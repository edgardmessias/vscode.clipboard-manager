import { createHash, randomUUID } from "crypto";
import * as vscode from "vscode";

export const STORAGE_VERSION = 3;
export const INDEX_FILENAME = "index.msgpack";
export const VALUES_FILENAME = "values.bin";
export const LEGACY_JSON_FILENAME = "clipboard.history.json";
export const LEGACY_JSON_MIGRATED_SUFFIX = ".migrated";
export const STORAGE_DIRNAME = "clipboard-history";
export const TITLE_MAX_LENGTH = 120;
export const NOTE_MAX_LENGTH = 120;
export const PRUNE_IDLE_MS = 5 * 60 * 1000;
export const PRUNE_GARBAGE_RATIO = 0.3;
export const INDEX_SAVE_DEBOUNCE_MS = 250;

export interface ISerializedLocation {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface IClipMetadata {
  id: string;
  offset: number;
  length: number;
  checksum: string;
  title: string;
  createdAt: number;
  lastUse?: number;
  copyCount: number;
  useCount: number;
  language?: string;
  createdLocation?: ISerializedLocation;
  pinned?: boolean;
  note?: string;
}

export interface IStorageIndex {
  version: number;
  valuesSize: number;
  clips: IClipMetadata[];
}

export interface IClipboardItem {
  id?: string;
  value: string;
  title: string;
  checksum: string;
  createdAt: number;
  lastUse?: number;
  copyCount: number;
  useCount: number;
  language?: string;
  createdLocation?: vscode.Location;
  offset?: number;
  length?: number;
  pinned?: boolean;
  note?: string;
}

export interface ILegacyClip {
  value: string;
  createdAt?: number;
  timestamp?: number;
  lastUse?: number;
  copyCount?: number;
  useCount?: number;
  language?: string;
  createdLocation?: ISerializedLocation;
  location?: ISerializedLocation;
}

export interface ILegacyStore {
  version: number;
  clips: ILegacyClip[];
}

export function computeChecksum(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildTitle(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, TITLE_MAX_LENGTH);
}

export function normalizeNote(note: string | undefined): string | undefined {
  if (note === undefined) {
    return undefined;
  }
  const trimmed = note.trim().slice(0, NOTE_MAX_LENGTH);
  return trimmed || undefined;
}

export function getClipDisplayLabel(clip: IClipboardItem): string {
  return clip.title;
}

export function createClipItem(
  value: string,
  partial: Partial<IClipboardItem> = {}
): IClipboardItem {
  return {
    id: partial.id ?? randomUUID(),
    value,
    title: partial.title ?? buildTitle(value),
    checksum: partial.checksum ?? computeChecksum(value),
    createdAt: partial.createdAt ?? Date.now(),
    lastUse: partial.lastUse,
    copyCount: partial.copyCount ?? 1,
    useCount: partial.useCount ?? 0,
    language: partial.language,
    createdLocation: partial.createdLocation,
    offset: partial.offset,
    length: partial.length,
    pinned: partial.pinned,
    note: normalizeNote(partial.note),
  };
}

export function serializeLocation(
  location?: vscode.Location
): ISerializedLocation | undefined {
  if (!location) {
    return undefined;
  }

  return {
    uri: location.uri.toString(),
    range: {
      start: {
        line: location.range.start.line,
        character: location.range.start.character,
      },
      end: {
        line: location.range.end.line,
        character: location.range.end.character,
      },
    },
  };
}

export function deserializeLocation(
  location?: ISerializedLocation
): vscode.Location | undefined {
  if (!location) {
    return undefined;
  }

  const uri = vscode.Uri.parse(location.uri);
  const range = new vscode.Range(
    location.range.start.line,
    location.range.start.character,
    location.range.end.line,
    location.range.end.character
  );

  return new vscode.Location(uri, range);
}

export function metadataToClip(
  metadata: IClipMetadata,
  value: string
): IClipboardItem {
  return {
    id: metadata.id,
    value,
    title: metadata.title,
    checksum: metadata.checksum,
    createdAt: metadata.createdAt,
    lastUse: metadata.lastUse,
    copyCount: metadata.copyCount,
    useCount: metadata.useCount,
    language: metadata.language,
    createdLocation: deserializeLocation(metadata.createdLocation),
    offset: metadata.offset,
    length: metadata.length,
    pinned: metadata.pinned,
    note: metadata.note,
  };
}

export function clipToMetadata(clip: IClipboardItem): IClipMetadata {
  return {
    id: clip.id ?? randomUUID(),
    offset: clip.offset ?? 0,
    length: clip.length ?? 0,
    checksum: clip.checksum,
    title: clip.title,
    createdAt: clip.createdAt,
    lastUse: clip.lastUse,
    copyCount: clip.copyCount,
    useCount: clip.useCount,
    language: clip.language,
    createdLocation: serializeLocation(clip.createdLocation),
    pinned: clip.pinned,
    note: clip.note,
  };
}
