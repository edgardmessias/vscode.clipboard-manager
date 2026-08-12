import { useEffect, useMemo, useState } from "react";
import type { ConfigTarget, SettingSnapshot } from "../messages";
import {
  SETTING_DEFINITIONS,
  SETTING_GROUPS,
  SETTING_GROUP_ORDER,
  type SettingDefinition,
  type SettingGroup,
} from "../settingsSchema";
import { onHostMessage, postToHost } from "../vscode";

type SaveToMode = "default" | "disabled" | "custom";

function getValueForTarget(
  snapshot: SettingSnapshot,
  target: ConfigTarget
): unknown {
  if (target === "workspace") {
    return snapshot.workspaceValue ?? snapshot.defaultValue;
  }
  return snapshot.globalValue ?? snapshot.defaultValue;
}

function hasOverrideForTarget(
  snapshot: SettingSnapshot,
  target: ConfigTarget
): boolean {
  if (target === "workspace") {
    return snapshot.workspaceValue !== undefined;
  }
  return snapshot.globalValue !== undefined;
}

function isModified(snapshot: SettingSnapshot, target: ConfigTarget): boolean {
  const value = getValueForTarget(snapshot, target);
  return JSON.stringify(value) !== JSON.stringify(snapshot.defaultValue);
}

function getSaveToMode(value: unknown): SaveToMode {
  if (value === false) {
    return "disabled";
  }
  if (typeof value === "string" && value.length > 0) {
    return "custom";
  }
  return "default";
}

function getSaveToValue(mode: SaveToMode, customPath: string): unknown {
  switch (mode) {
    case "disabled":
      return false;
    case "custom":
      return customPath;
    default:
      return null;
  }
}

interface SettingRowProps {
  definition: SettingDefinition;
  snapshot?: SettingSnapshot;
  target: ConfigTarget;
  disabled: boolean;
}

function SettingRow({
  definition,
  snapshot,
  target,
  disabled,
}: SettingRowProps) {
  const effectiveValue = snapshot
    ? getValueForTarget(snapshot, target)
    : definition.defaultValue;
  const canReset = snapshot ? hasOverrideForTarget(snapshot, target) : false;
  const modified = snapshot ? isModified(snapshot, target) : false;

  const setValue = (value: unknown) => {
    postToHost({
      type: "config/set",
      key: definition.key,
      value,
      target,
    });
  };

  const resetValue = () => {
    postToHost({
      type: "config/reset",
      key: definition.key,
      target,
    });
  };

  const renderControl = () => {
    switch (definition.type) {
      case "boolean":
        return (
          <label className="setting-toggle">
            <input
              type="checkbox"
              checked={Boolean(effectiveValue)}
              disabled={disabled}
              onChange={event => setValue(event.target.checked)}
            />
            <span className="setting-toggle-track" />
          </label>
        );

      case "integer":
        return (
          <input
            className="setting-input setting-input-number"
            type="number"
            min={definition.min}
            step={1}
            value={Number(effectiveValue)}
            disabled={disabled}
            onChange={event => {
              const next = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(next)) {
                setValue(next);
              }
            }}
          />
        );

      case "text":
        return (
          <input
            className="setting-input"
            type="text"
            value={String(effectiveValue ?? "")}
            disabled={disabled}
            onChange={event => setValue(event.target.value)}
          />
        );

      case "stringList": {
        const lines = Array.isArray(effectiveValue)
          ? effectiveValue.map(item => String(item)).join("\n")
          : "";
        return (
          <textarea
            className="setting-input setting-textarea"
            rows={4}
            value={lines}
            disabled={disabled}
            placeholder={".env\n**/.env\n*.pem"}
            onChange={event => {
              const next = event.target.value
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);
              setValue(next);
            }}
          />
        );
      }

      case "saveTo": {
        const mode = getSaveToMode(effectiveValue);
        const customPath =
          mode === "custom" && typeof effectiveValue === "string"
            ? effectiveValue
            : "";

        return (
          <div className="setting-save-to">
            <select
              className="setting-input"
              value={mode}
              disabled={disabled}
              onChange={event => {
                const nextMode = event.target.value as SaveToMode;
                if (nextMode === "custom") {
                  if (customPath) {
                    setValue(customPath);
                  } else {
                    postToHost({ type: "config/browseSavePath" });
                  }
                  return;
                }
                setValue(getSaveToValue(nextMode, customPath));
              }}
            >
              <option value="default">Default location</option>
              <option value="disabled">Disabled</option>
              <option value="custom">Custom path</option>
            </select>
            {mode === "custom" && (
              <div className="setting-save-to-path">
                <input
                  className="setting-input"
                  type="text"
                  value={customPath}
                  disabled={disabled}
                  placeholder="Folder path"
                  onChange={event => setValue(event.target.value)}
                />
                <button
                  type="button"
                  className="setting-btn"
                  disabled={disabled}
                  onClick={() => postToHost({ type: "config/browseSavePath" })}
                >
                  Browse…
                </button>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`setting-row${disabled ? " is-disabled" : ""}`}>
      <div className="setting-row-header">
        <div className="setting-row-labels">
          <span className="setting-label">
            {definition.label}
            {modified && (
              <span className="setting-modified" title="Modified">
                ●
              </span>
            )}
          </span>
          <span className="setting-description">{definition.description}</span>
        </div>
        {canReset && !disabled && (
          <button
            type="button"
            className="setting-reset-btn"
            onClick={resetValue}
            title="Reset to default"
          >
            Reset
          </button>
        )}
      </div>
      <div className="setting-control">{renderControl()}</div>
    </div>
  );
}

export function SettingsView() {
  const [target, setTarget] = useState<ConfigTarget>("global");
  const [hasWorkspace, setHasWorkspace] = useState(false);
  const [settings, setSettings] = useState<SettingSnapshot[]>([]);

  useEffect(() => {
    postToHost({ type: "config/request" });
    return onHostMessage(message => {
      if (message.type === "config/settings") {
        setHasWorkspace(message.hasWorkspace);
        setSettings(message.settings);
      }
    });
  }, []);

  useEffect(() => {
    if (target === "workspace" && !hasWorkspace) {
      setTarget("global");
    }
  }, [hasWorkspace, target]);

  const settingsByKey = useMemo(
    () => new Map(settings.map(snapshot => [snapshot.key, snapshot])),
    [settings]
  );

  const groupedSettings = useMemo(() => {
    return SETTING_GROUP_ORDER.map(group => ({
      group,
      items: SETTING_DEFINITIONS.filter(def => def.group === group),
    })).filter(section => section.items.length > 0);
  }, []);

  const isRowDisabled = (definition: SettingDefinition) => {
    if (target === "workspace" && !hasWorkspace) {
      return true;
    }
    if (target === "workspace" && !definition.canSetWorkspace) {
      return true;
    }
    return false;
  };

  return (
    <div className="settings-view">
      <div className="settings-scope">
        <span className="settings-scope-label">Apply to</span>
        <div className="settings-scope-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            className={`settings-scope-btn${target === "global" ? " is-active" : ""}`}
            aria-selected={target === "global"}
            onClick={() => setTarget("global")}
          >
            User
          </button>
          <button
            type="button"
            role="tab"
            className={`settings-scope-btn${target === "workspace" ? " is-active" : ""}`}
            aria-selected={target === "workspace"}
            disabled={!hasWorkspace}
            title={
              hasWorkspace
                ? "Workspace settings"
                : "Open a workspace folder to edit workspace settings"
            }
            onClick={() => setTarget("workspace")}
          >
            Workspace
          </button>
        </div>
      </div>

      <div className="settings-scroll">
        {groupedSettings.map(({ group, items }) => {
          const meta = SETTING_GROUPS[group as SettingGroup];
          return (
            <section key={group} className="settings-group">
              <header className="settings-group-header">
                <h3 className="settings-group-title">{meta.title}</h3>
                {meta.description && (
                  <p className="settings-group-desc">{meta.description}</p>
                )}
              </header>
              <div className="settings-group-items">
                {items.map(definition => (
                  <SettingRow
                    key={definition.key}
                    definition={definition}
                    snapshot={settingsByKey.get(definition.key)}
                    target={target}
                    disabled={isRowDisabled(definition)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
