export const CLIPBOARD_HISTORY_VIEW_ID = "clipboardHistory";

export interface ClipSummary {
  id: string;
  title: string;
  note?: string;
  pinned: boolean;
  createdAt: number;
  language?: string;
  copyCount: number;
  useCount: number;
  hasLocation: boolean;
}

export interface ClipDetail {
  id: string;
  value: string;
}

export type ConfigTarget = "global" | "workspace";

export type EffectiveTarget = "default" | "global" | "workspace";

export interface SettingSnapshot {
  key: string;
  value: unknown;
  defaultValue: unknown;
  globalValue?: unknown;
  workspaceValue?: unknown;
  effectiveTarget: EffectiveTarget;
  canSetWorkspace: boolean;
}

export type WebviewToHostMessage =
  | { type: "ready" }
  | { type: "clips/filter"; query: string }
  | { type: "clip/paste"; id: string }
  | { type: "clip/preview"; id: string }
  | { type: "clip/preview/clear" }
  | { type: "clip/copy"; id: string }
  | { type: "clip/remove"; id: string }
  | { type: "clip/ban"; id: string }
  | { type: "clip/setPinned"; id: string; pinned: boolean }
  | { type: "clip/editNote"; id: string }
  | { type: "clip/clearNote"; id: string }
  | { type: "clip/showInFile"; id: string }
  | { type: "clip/requestDetail"; id: string }
  | { type: "history/clear" }
  | { type: "history/clearUnpinned" }
  | { type: "config/request" }
  | { type: "config/set"; key: string; value: unknown; target: ConfigTarget }
  | { type: "config/reset"; key: string; target: ConfigTarget }
  | { type: "config/browseSavePath" };

export type HostToWebviewMessage =
  | { type: "clips/update"; clips: ClipSummary[] }
  | { type: "clips/filterResult"; query: string; ids: string[] }
  | { type: "clip/detail"; clip: ClipDetail }
  | {
      type: "config/update";
      preview: boolean;
      relativeTime: boolean;
      pinnedToTop: boolean;
    }
  | {
      type: "config/settings";
      hasWorkspace: boolean;
      settings: SettingSnapshot[];
    };
