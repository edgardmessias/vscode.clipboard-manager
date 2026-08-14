import type { IconName } from "./components/Icons";
import type { ClipSummary } from "./messages";
import { postToHost } from "./vscode";

export interface ClipAction {
  key: string;
  label: string;
  icon: IconName;
  danger?: boolean;
  run: () => void;
}

export function getClipActionGroups(
  clip: ClipSummary,
  options: { expanded: boolean; onToggleExpand: (id: string) => void }
): ClipAction[][] {
  const { expanded, onToggleExpand } = options;

  return [
    [
      {
        key: "pin",
        label: clip.pinned ? "Unpin" : "Pin",
        icon: clip.pinned ? "unpin" : "pin",
        run: () =>
          postToHost({
            type: "clip/setPinned",
            id: clip.id,
            pinned: !clip.pinned,
          }),
      },
      {
        key: "editNote",
        label: "Edit note…",
        icon: "note",
        run: () => postToHost({ type: "clip/editNote", id: clip.id }),
      },
      ...(clip.note
        ? [
            {
              key: "clearNote",
              label: "Clear note",
              icon: "eraser",
              run: () => postToHost({ type: "clip/clearNote", id: clip.id }),
            } satisfies ClipAction,
          ]
        : []),
    ],
    [
      {
        key: "copy",
        label: "Copy to clipboard",
        icon: "copy",
        run: () => postToHost({ type: "clip/copy", id: clip.id }),
      },
      ...(clip.hasLocation
        ? [
            {
              key: "showInFile",
              label: "Open in file",
              icon: "file",
              run: () => postToHost({ type: "clip/showInFile", id: clip.id }),
            } satisfies ClipAction,
          ]
        : []),
      {
        key: "expand",
        label: expanded ? "Collapse content" : "Expand content",
        icon: "chevron",
        run: () => onToggleExpand(clip.id),
      },
    ],
    [
      {
        key: "ban",
        label: "Ban clip",
        icon: "ban",
        danger: true,
        run: () => postToHost({ type: "clip/ban", id: clip.id }),
      },
      {
        key: "remove",
        label: "Remove",
        icon: "trash",
        danger: true,
        run: () => postToHost({ type: "clip/remove", id: clip.id }),
      },
    ],
  ];
}
