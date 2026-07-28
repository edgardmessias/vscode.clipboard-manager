import * as fs from "fs/promises";
import { ILegacyClip, ILegacyStore } from "./types";

export async function readLegacyJsonFile(
  filePath: string
): Promise<ILegacyStore | null> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseLegacyJson(content);
  } catch {
    return null;
  }
}

export function parseLegacyJson(content: string | object): ILegacyStore | null {
  try {
    const stored =
      typeof content === "string"
        ? (JSON.parse(content) as ILegacyStore)
        : (content as ILegacyStore);

    if (!stored?.version || !Array.isArray(stored.clips)) {
      return null;
    }

    return normalizeLegacyStore(stored);
  } catch {
    return null;
  }
}

export function normalizeLegacyStore(stored: ILegacyStore): ILegacyStore {
  let clips = stored.clips;

  if (stored.version === 1) {
    clips = clips.map(clip => ({
      ...clip,
      createdAt: clip.createdAt ?? clip.timestamp ?? Date.now(),
      copyCount: clip.copyCount ?? 1,
      useCount: clip.useCount ?? 0,
      createdLocation: clip.createdLocation ?? clip.location,
    }));
  }

  return {
    version: 2,
    clips: clips.map(clip => ({
      ...clip,
      createdAt: clip.createdAt ?? clip.timestamp ?? Date.now(),
      copyCount: clip.copyCount ?? 1,
      useCount: clip.useCount ?? 0,
      createdLocation: clip.createdLocation ?? clip.location,
    })),
  };
}

export function legacyClipToPartial(clip: ILegacyClip) {
  return {
    value: clip.value,
    createdAt: clip.createdAt ?? clip.timestamp ?? Date.now(),
    lastUse: clip.lastUse,
    copyCount: clip.copyCount ?? 1,
    useCount: clip.useCount ?? 0,
    language: clip.language,
    createdLocation: clip.createdLocation ?? clip.location,
  };
}
