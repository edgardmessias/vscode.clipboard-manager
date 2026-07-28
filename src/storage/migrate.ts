export {
  legacyClipToPartial,
  normalizeLegacyStore,
  parseLegacyJson,
  readLegacyJsonFile,
} from "./jsonMonolithStorage";
export { AppendLogStorage, type StoragePaths } from "./appendLogStorage";
export {
  clipToMetadata,
  computeChecksum,
  createClipItem,
  deserializeLocation,
  metadataToClip,
  STORAGE_VERSION,
  type IClipboardItem,
  type IClipMetadata,
  type IStorageIndex,
} from "./types";

import type { IClipboardItem } from "./types";
import { createClipItem, deserializeLocation } from "./types";
import {
  legacyClipToPartial,
  normalizeLegacyStore,
  parseLegacyJson,
} from "./jsonMonolithStorage";

export async function migrateLegacyToV3(
  legacyContent: string | object
): Promise<IClipboardItem[]> {
  const legacyStore = parseLegacyJson(legacyContent);
  if (!legacyStore) {
    return [];
  }

  const normalized = normalizeLegacyStore(legacyStore);
  return normalized.clips.map(clip => {
    const partial = legacyClipToPartial(clip);
    return createClipItem(clip.value, {
      ...partial,
      createdLocation: deserializeLocation(partial.createdLocation),
    });
  });
}
