import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "../../relativeTime";

describe("formatRelativeTime", () => {
  const now = Date.UTC(2026, 7, 12, 18, 0, 0);

  it("returns now for recent clips", () => {
    expect(formatRelativeTime(now - 10_000, now)).toBe("now");
    expect(formatRelativeTime(now - 44_000, now)).toBe("now");
  });

  it("returns seconds under a minute", () => {
    expect(formatRelativeTime(now - 45_000, now)).toBe("45s");
    expect(formatRelativeTime(now - 59_000, now)).toBe("59s");
  });

  it("returns compact minutes, hours, days, weeks", () => {
    expect(formatRelativeTime(now - 2 * 60_000, now)).toBe("2m");
    expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe("3h");
    expect(formatRelativeTime(now - 2 * 86_400_000, now)).toBe("2d");
    expect(formatRelativeTime(now - 3 * 7 * 86_400_000, now)).toBe("3w");
  });

  it("falls back to a short date for older clips", () => {
    const older = Date.UTC(2026, 5, 1, 12, 0, 0);
    const label = formatRelativeTime(older, now);
    expect(label).not.toMatch(/^\d+[smhdw]$/);
    expect(label).not.toBe("now");
  });

  it("clamps future timestamps to now", () => {
    expect(formatRelativeTime(now + 60_000, now)).toBe("now");
  });
});
