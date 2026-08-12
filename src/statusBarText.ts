export function formatStatusBarText(
  clipCount: number,
  captureEnabled: boolean
): string {
  if (!captureEnabled) {
    return `$(clippy) ${clipCount} · paused`;
  }
  return `$(clippy) ${clipCount}`;
}

export function formatStatusBarTooltip(
  clipCount: number,
  captureEnabled: boolean
): string {
  const capture = captureEnabled ? "Capture on" : "Capture paused";
  return `Clipboard Manager: ${clipCount} clip${clipCount === 1 ? "" : "s"} · ${capture}`;
}
