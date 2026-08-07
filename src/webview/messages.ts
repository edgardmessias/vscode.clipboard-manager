export const CLIPBOARD_HISTORY_VIEW_ID = "clipboardHistory";

export interface ClipSummary {
  id: string;
  title: string;
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

export type WebviewToHostMessage =
  | { type: "ready" }
  | { type: "clips/filter"; query: string }
  | { type: "clip/paste"; id: string }
  | { type: "clip/preview"; id: string }
  | { type: "clip/preview/clear" }
  | { type: "clip/copy"; id: string }
  | { type: "clip/remove"; id: string }
  | { type: "clip/showInFile"; id: string }
  | { type: "clip/requestDetail"; id: string }
  | { type: "history/clear" };

export type HostToWebviewMessage =
  | { type: "clips/update"; clips: ClipSummary[] }
  | { type: "clips/filterResult"; query: string; ids: string[] }
  | { type: "clip/detail"; clip: ClipDetail }
  | { type: "config/update"; preview: boolean };
