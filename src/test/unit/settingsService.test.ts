import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  browseSavePath,
  getSettingsSnapshot,
  resetSetting,
  setSetting,
  SettingsValidationError,
} from "../../webview/settingsService";
import { ConfigurationTarget, window, workspace } from "./mocks/vscode";

type ConfigStore = Record<string, unknown>;

function createConfigMock(store: ConfigStore) {
  return {
    get: vi.fn((key: string, defaultValue?: unknown) => {
      if (Object.hasOwn(store, key)) {
        return store[key];
      }
      return defaultValue;
    }),
    inspect: vi.fn((key: string) => ({
      key,
      defaultValue: undefined,
      globalValue: Object.hasOwn(store, `global:${key}`)
        ? store[`global:${key}`]
        : undefined,
      workspaceValue: Object.hasOwn(store, `workspace:${key}`)
        ? store[`workspace:${key}`]
        : undefined,
    })),
    update: vi.fn(async (key: string, value: unknown, target: number) => {
      const prefix =
        target === ConfigurationTarget.Global ? "global" : "workspace";
      const storeKey = `${prefix}:${key}`;
      if (value === undefined) {
        delete store[storeKey];
        return;
      }
      store[storeKey] = value;
      store[key] = value;
    }),
  };
}

describe("settingsService", () => {
  let store: ConfigStore;

  beforeEach(() => {
    store = {};
    workspace.workspaceFolders = [{ uri: { fsPath: "/workspace" } }];
    workspace.getConfiguration.mockReturnValue(createConfigMock(store));
    vi.mocked(window.showOpenDialog).mockResolvedValue(undefined);
  });

  describe("getSettingsSnapshot", () => {
    it("should return all settings with workspace availability", () => {
      const snapshot = getSettingsSnapshot();

      expect(snapshot.hasWorkspace).toBe(true);
      expect(snapshot.settings).toHaveLength(13);
      expect(snapshot.settings.some(s => s.key === "preview")).toBe(true);
      expect(snapshot.settings.some(s => s.key === "capture.enabled")).toBe(
        true
      );
      expect(snapshot.settings.some(s => s.key === "statusBar.enabled")).toBe(
        true
      );
    });

    it("should report no workspace when folders are absent", () => {
      workspace.workspaceFolders = undefined;
      const snapshot = getSettingsSnapshot();
      expect(snapshot.hasWorkspace).toBe(false);
    });
  });

  describe("setSetting", () => {
    it("should update a boolean setting at global scope", async () => {
      await setSetting("preview", false, "global");

      const config = workspace.getConfiguration();
      expect(config.update).toHaveBeenCalledWith(
        "preview",
        false,
        ConfigurationTarget.Global
      );
    });

    it("should update an integer setting at workspace scope", async () => {
      await setSetting("maxClips", 50, "workspace");

      const config = workspace.getConfiguration();
      expect(config.update).toHaveBeenCalledWith(
        "maxClips",
        50,
        ConfigurationTarget.Workspace
      );
    });

    it("should reject invalid integer values", async () => {
      await expect(setSetting("checkInterval", -1, "global")).rejects.toThrow(
        SettingsValidationError
      );
    });

    it("should reject empty snippet prefix", async () => {
      await expect(
        setSetting("snippet.prefix", "  ", "global")
      ).rejects.toThrow(SettingsValidationError);
    });

    it("should reject workspace updates when no folder is open", async () => {
      workspace.workspaceFolders = undefined;

      await expect(setSetting("preview", false, "workspace")).rejects.toThrow(
        SettingsValidationError
      );
    });

    it("should reject workspace updates for application-scoped saveTo", async () => {
      await expect(
        setSetting("saveTo", "/tmp/clips", "workspace")
      ).rejects.toThrow(SettingsValidationError);
    });

    it("should allow saveTo at global scope", async () => {
      await setSetting("saveTo", "/tmp/clips", "global");

      const config = workspace.getConfiguration();
      expect(config.update).toHaveBeenCalledWith(
        "saveTo",
        "/tmp/clips",
        ConfigurationTarget.Global
      );
    });

    it("should allow saveTo false and null", async () => {
      await setSetting("saveTo", false, "global");
      await setSetting("saveTo", null, "global");

      const config = workspace.getConfiguration();
      expect(config.update).toHaveBeenCalledWith(
        "saveTo",
        null,
        ConfigurationTarget.Global
      );
    });
  });

  describe("resetSetting", () => {
    it("should clear override at the selected target", async () => {
      await resetSetting("preview", "global");

      const config = workspace.getConfiguration();
      expect(config.update).toHaveBeenCalledWith(
        "preview",
        undefined,
        ConfigurationTarget.Global
      );
    });

    it("should reject workspace reset for saveTo", async () => {
      await expect(resetSetting("saveTo", "workspace")).rejects.toThrow(
        SettingsValidationError
      );
    });
  });

  describe("browseSavePath", () => {
    it("should return selected folder path", async () => {
      vi.mocked(window.showOpenDialog).mockResolvedValue([
        { fsPath: "C:\\clips" },
      ]);

      await expect(browseSavePath()).resolves.toBe("C:\\clips");
    });

    it("should return undefined when dialog is cancelled", async () => {
      vi.mocked(window.showOpenDialog).mockResolvedValue(undefined);
      await expect(browseSavePath()).resolves.toBeUndefined();
    });
  });
});
