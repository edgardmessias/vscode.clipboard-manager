import * as vscode from "vscode";
import { ConfigTarget, EffectiveTarget, SettingSnapshot } from "./messages";
import {
  getSettingDefinition,
  SETTING_DEFINITIONS,
  SettingDefinition,
} from "./settingsSchema";

export interface SettingsSnapshot {
  hasWorkspace: boolean;
  settings: SettingSnapshot[];
}

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

function hasWorkspaceFolder(): boolean {
  return Boolean(vscode.workspace.workspaceFolders?.length);
}

function getEffectiveTarget(
  inspected:
    | {
        globalValue?: unknown;
        workspaceValue?: unknown;
      }
    | undefined
): EffectiveTarget {
  if (!inspected) {
    return "default";
  }
  if (inspected.workspaceValue !== undefined) {
    return "workspace";
  }
  if (inspected.globalValue !== undefined) {
    return "global";
  }
  return "default";
}

function toSnapshot(definition: SettingDefinition): SettingSnapshot {
  const config = vscode.workspace.getConfiguration("clipboard-manager");
  const inspected = config.inspect(definition.key);

  return {
    key: definition.key,
    value: config.get(definition.key, definition.defaultValue),
    defaultValue: definition.defaultValue,
    globalValue: inspected?.globalValue,
    workspaceValue: inspected?.workspaceValue,
    effectiveTarget: getEffectiveTarget(inspected),
    canSetWorkspace: definition.canSetWorkspace,
  };
}

function validateValue(definition: SettingDefinition, value: unknown): unknown {
  switch (definition.type) {
    case "boolean":
      if (typeof value !== "boolean") {
        throw new SettingsValidationError(
          `${definition.label} must be a boolean`
        );
      }
      return value;

    case "integer": {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new SettingsValidationError(
          `${definition.label} must be an integer`
        );
      }
      if (definition.min !== undefined && value < definition.min) {
        throw new SettingsValidationError(
          `${definition.label} must be at least ${definition.min}`
        );
      }
      return value;
    }

    case "text":
      if (typeof value !== "string") {
        throw new SettingsValidationError(
          `${definition.label} must be a string`
        );
      }
      if (!value.trim()) {
        throw new SettingsValidationError(
          `${definition.label} cannot be empty`
        );
      }
      return value;

    case "saveTo":
      if (value === null || value === false) {
        return value;
      }
      if (typeof value === "string") {
        if (!value.trim()) {
          throw new SettingsValidationError(
            `${definition.label} path cannot be empty`
          );
        }
        return value;
      }
      throw new SettingsValidationError(
        `${definition.label} must be a path, null, or false`
      );

    case "stringList": {
      if (!Array.isArray(value)) {
        throw new SettingsValidationError(
          `${definition.label} must be a list of strings`
        );
      }
      return value
        .filter((item): item is string => typeof item === "string")
        .map(item => item.trim())
        .filter(Boolean);
    }

    default:
      return value;
  }
}

function toConfigurationTarget(
  target: ConfigTarget
): vscode.ConfigurationTarget {
  return target === "global"
    ? vscode.ConfigurationTarget.Global
    : vscode.ConfigurationTarget.Workspace;
}

export function getSettingsSnapshot(): SettingsSnapshot {
  return {
    hasWorkspace: hasWorkspaceFolder(),
    settings: SETTING_DEFINITIONS.map(toSnapshot),
  };
}

export async function setSetting(
  key: string,
  value: unknown,
  target: ConfigTarget
): Promise<void> {
  const definition = getSettingDefinition(key);
  if (!definition) {
    throw new SettingsValidationError(`Unknown setting: ${key}`);
  }

  if (target === "workspace") {
    if (!hasWorkspaceFolder()) {
      throw new SettingsValidationError("No workspace folder is open");
    }
    if (!definition.canSetWorkspace) {
      throw new SettingsValidationError(
        `${definition.label} can only be set at user scope`
      );
    }
  }

  const validated = validateValue(definition, value);
  const config = vscode.workspace.getConfiguration("clipboard-manager");
  await config.update(key, validated, toConfigurationTarget(target));
}

export async function resetSetting(
  key: string,
  target: ConfigTarget
): Promise<void> {
  const definition = getSettingDefinition(key);
  if (!definition) {
    throw new SettingsValidationError(`Unknown setting: ${key}`);
  }

  if (target === "workspace") {
    if (!hasWorkspaceFolder()) {
      throw new SettingsValidationError("No workspace folder is open");
    }
    if (!definition.canSetWorkspace) {
      throw new SettingsValidationError(
        `${definition.label} can only be reset at user scope`
      );
    }
  }

  const config = vscode.workspace.getConfiguration("clipboard-manager");
  await config.update(key, undefined, toConfigurationTarget(target));
}

export async function browseSavePath(): Promise<string | undefined> {
  const result = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select folder",
  });

  return result?.[0]?.fsPath;
}

export function getPreviewEnabled(): boolean {
  const config = vscode.workspace.getConfiguration("clipboard-manager");
  return config.get<boolean>("preview", true);
}

export function getRelativeTimeEnabled(): boolean {
  const config = vscode.workspace.getConfiguration("clipboard-manager");
  return config.get<boolean>("ui.relativeTime", true);
}

export function getPinnedToTopEnabled(): boolean {
  const config = vscode.workspace.getConfiguration("clipboard-manager");
  return config.get<boolean>("ui.pinnedToTop", true);
}
