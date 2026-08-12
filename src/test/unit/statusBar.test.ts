import { describe, expect, it } from "vitest";
import {
  formatStatusBarText,
  formatStatusBarTooltip,
} from "../../statusBarText";

describe("statusBar formatting", () => {
  it("shows clip count when capture is enabled", () => {
    expect(formatStatusBarText(12, true)).toBe("$(clippy) 12");
    expect(formatStatusBarTooltip(12, true)).toBe(
      "Clipboard Manager: 12 clips · Capture on"
    );
  });

  it("shows paused state when capture is disabled", () => {
    expect(formatStatusBarText(3, false)).toBe("$(clippy) 3 · paused");
    expect(formatStatusBarTooltip(1, false)).toBe(
      "Clipboard Manager: 1 clip · Capture paused"
    );
  });
});
