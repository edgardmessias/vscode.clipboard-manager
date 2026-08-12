export type SettingType =
  "boolean" | "integer" | "text" | "saveTo" | "stringList";

export type SettingGroup = "monitor" | "history" | "persistence" | "snippets";

export interface SettingDefinition {
  key: string;
  type: SettingType;
  group: SettingGroup;
  label: string;
  description: string;
  defaultValue: unknown;
  min?: number;
  canSetWorkspace: boolean;
}

export const SETTING_GROUPS: Record<
  SettingGroup,
  { title: string; description?: string }
> = {
  monitor: {
    title: "Monitor",
    description: "Clipboard polling and capture behavior",
  },
  history: {
    title: "History",
    description: "How clips are stored and displayed",
  },
  persistence: {
    title: "Persistence",
    description: "Where clipboard history is saved on disk",
  },
  snippets: {
    title: "Snippets",
    description: "Completion snippets in the editor",
  },
};

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "ban.notifyOnBlock",
    type: "boolean",
    group: "monitor",
    label: "Notify on ban block",
    description:
      "Show a notification when a banned clip is blocked. Ban hashes are stored in SecretStorage (machine-local).",
    defaultValue: false,
    canSetWorkspace: true,
  },
  {
    key: "capture.enabled",
    type: "boolean",
    group: "monitor",
    label: "Capture enabled",
    description:
      "When false, automatic clipboard capture is paused. Manual Copy to Clipboard History still works.",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "exclude.filePatterns",
    type: "stringList",
    group: "monitor",
    label: "Exclude file patterns",
    description:
      "One glob per line. Copies from matching files are not saved (e.g. .env, **/.env, *.pem). Empty by default.",
    defaultValue: [],
    canSetWorkspace: true,
  },
  {
    key: "checkInterval",
    type: "integer",
    group: "monitor",
    label: "Check interval",
    description:
      "Time in milliseconds to check changes in clipboard. Set zero to disable.",
    defaultValue: 500,
    min: 0,
    canSetWorkspace: true,
  },
  {
    key: "onlyWindowFocused",
    type: "boolean",
    group: "monitor",
    label: "Only when focused",
    description: "Get clips only from VSCode",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "maxClipboardSize",
    type: "integer",
    group: "monitor",
    label: "Max clipboard size",
    description: "Maximum clipboard size in bytes.",
    defaultValue: 1_000_000,
    min: 1,
    canSetWorkspace: true,
  },
  {
    key: "maxClips",
    type: "integer",
    group: "history",
    label: "Max clips",
    description: "Maximum number of clips to save (0 for unlimited)",
    defaultValue: 100,
    min: 0,
    canSetWorkspace: true,
  },
  {
    key: "avoidDuplicates",
    type: "boolean",
    group: "history",
    label: "Avoid duplicates",
    description: "Avoid duplicate clips in the list",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "moveToTop",
    type: "boolean",
    group: "history",
    label: "Move to top",
    description: "Move used clip to top in the list",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "preview",
    type: "boolean",
    group: "history",
    label: "Preview",
    description: "View a preview while you are choosing the clip",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "ui.relativeTime",
    type: "boolean",
    group: "history",
    label: "Relative time",
    description:
      "Show compact relative timestamps in History and Quick Pick (absolute time remains in the tooltip)",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "saveTo",
    type: "saveTo",
    group: "persistence",
    label: "Save location",
    description:
      "Set location to save the clipboard file, set false to disable",
    defaultValue: null,
    canSetWorkspace: false,
  },
  {
    key: "snippet.enabled",
    type: "boolean",
    group: "snippets",
    label: "Enable snippets",
    description: "Enable completion snippets",
    defaultValue: true,
    canSetWorkspace: true,
  },
  {
    key: "snippet.max",
    type: "integer",
    group: "snippets",
    label: "Max snippets",
    description: "Maximum clips to suggest in snippets (0 for all)",
    defaultValue: 10,
    min: 0,
    canSetWorkspace: true,
  },
  {
    key: "snippet.prefix",
    type: "text",
    group: "snippets",
    label: "Snippet prefix",
    description: "Default prefix for snippets completion (clip1, clip2, ...)",
    defaultValue: "clip",
    canSetWorkspace: true,
  },
  {
    key: "statusBar.enabled",
    type: "boolean",
    group: "monitor",
    label: "Status bar",
    description:
      "Show Clipboard Manager status bar item (clip count and capture state)",
    defaultValue: true,
    canSetWorkspace: true,
  },
];

export const SETTING_GROUP_ORDER: SettingGroup[] = [
  "monitor",
  "history",
  "persistence",
  "snippets",
];
