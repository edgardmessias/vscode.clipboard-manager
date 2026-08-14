import { IClipboardItem } from "./storage/types";

export function isPinnedClip(clip: IClipboardItem): boolean {
  return clip.pinned === true;
}

/** Pinned clips first when pinnedToTop is true; otherwise preserve list order. */
export function sortClips(
  clips: IClipboardItem[],
  pinnedToTop = true
): IClipboardItem[] {
  if (!pinnedToTop) {
    return clips;
  }

  const pinned: IClipboardItem[] = [];
  const unpinned: IClipboardItem[] = [];

  for (const clip of clips) {
    if (isPinnedClip(clip)) {
      pinned.push(clip);
    } else {
      unpinned.push(clip);
    }
  }

  return [...pinned, ...unpinned];
}

export function sortClipsByRecency(clips: IClipboardItem[]): IClipboardItem[] {
  return [...clips].sort((a, b) => b.createdAt - a.createdAt);
}

/** Trim only unpinned clips; pinned clips are never evicted. */
export function applyMaxClips(
  clips: IClipboardItem[],
  maxClips: number,
  pinnedToTop = true
): IClipboardItem[] {
  if (maxClips <= 0) {
    return clips;
  }

  const ordered = sortClips(clips, pinnedToTop);
  const pinned = ordered.filter(isPinnedClip);
  const unpinned = ordered.filter(clip => !isPinnedClip(clip));
  const maxUnpinned = Math.max(0, maxClips - pinned.length);

  if (pinnedToTop) {
    return [...pinned, ...unpinned.slice(0, maxUnpinned)];
  }

  const result: IClipboardItem[] = [];
  let unpinnedKept = 0;

  for (const clip of ordered) {
    if (isPinnedClip(clip)) {
      result.push(clip);
    } else if (unpinnedKept < maxUnpinned) {
      result.push(clip);
      unpinnedKept++;
    }
  }

  return result;
}

export function moveClipToTop(
  clips: IClipboardItem[],
  index: number,
  pinnedToTop = true
): IClipboardItem[] {
  if (index < 0 || index >= clips.length) {
    return clips;
  }

  const clip = clips[index];
  const rest = clips.filter((_, i) => i !== index);

  if (!pinnedToTop) {
    return [clip, ...rest];
  }

  const pinned = rest.filter(isPinnedClip);
  const unpinned = rest.filter(c => !isPinnedClip(c));

  if (isPinnedClip(clip)) {
    return [clip, ...pinned, ...unpinned];
  }

  return [...pinned, clip, ...unpinned];
}

export function placeAfterPinChange(
  clips: IClipboardItem[],
  id: string,
  pinned: boolean,
  pinnedToTop = true
): IClipboardItem[] {
  const index = clips.findIndex(clip => (clip.id ?? clip.checksum) === id);
  if (index < 0) {
    return clips;
  }

  const clip = { ...clips[index], pinned };

  if (!pinnedToTop) {
    return clips.map(item => ((item.id ?? item.checksum) === id ? clip : item));
  }

  const rest = clips.filter((_, i) => i !== index);
  const pinnedClips = rest.filter(isPinnedClip);
  const unpinnedClips = rest.filter(c => !isPinnedClip(c));

  if (pinned) {
    return [clip, ...pinnedClips, ...unpinnedClips];
  }

  return [...pinnedClips, clip, ...unpinnedClips];
}
