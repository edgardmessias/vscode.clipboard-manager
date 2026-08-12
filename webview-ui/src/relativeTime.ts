/**
 * Compact relative time for dense UI rows (e.g. "2m", "3h", "now").
 * Keep in sync with src/relativeTime.ts.
 */
export function formatRelativeTime(
  createdAt: number,
  now: number = Date.now()
): string {
  const diffMs = Math.max(0, now - createdAt);
  const sec = Math.floor(diffMs / 1000);

  if (sec < 45) {
    return "now";
  }
  if (sec < 60) {
    return `${sec}s`;
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m`;
  }

  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr}h`;
  }

  const day = Math.floor(hr / 24);
  if (day < 7) {
    return `${day}d`;
  }

  const week = Math.floor(day / 7);
  if (week < 5) {
    return `${week}w`;
  }

  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
