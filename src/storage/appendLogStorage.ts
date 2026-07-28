import * as fs from "fs/promises";
import * as path from "path";
import { Packr, Unpackr } from "msgpackr";
import * as vscode from "vscode";
import {
  legacyClipToPartial,
  normalizeLegacyStore,
  parseLegacyJson,
  readLegacyJsonFile,
} from "./jsonMonolithStorage";
import {
  clipToMetadata,
  createClipItem,
  deserializeLocation,
  IClipboardItem,
  IClipMetadata,
  IStorageIndex,
  INDEX_FILENAME,
  INDEX_SAVE_DEBOUNCE_MS,
  LEGACY_JSON_FILENAME,
  LEGACY_JSON_MIGRATED_SUFFIX,
  metadataToClip,
  PRUNE_GARBAGE_RATIO,
  PRUNE_IDLE_MS,
  STORAGE_DIRNAME,
  STORAGE_VERSION,
  VALUES_FILENAME,
} from "./types";

const packr = new Packr();
const unpackr = new Unpackr();

export interface StoragePaths {
  storageDir: string;
  indexPath: string;
  valuesPath: string;
  legacyJsonPath: string;
}

export interface AppendLogStorageOptions {
  context: vscode.ExtensionContext;
  getSaveTo: () => string | null | boolean;
  getStorageRoot: () => string;
}

export class AppendLogStorage {
  private index: IStorageIndex = {
    version: STORAGE_VERSION,
    valuesSize: 0,
    clips: [],
  };
  private lastIndexMtime = 0;
  private saveIndexTimer?: NodeJS.Timeout;
  private idlePruneTimer?: NodeJS.Timeout;
  private pendingClips?: IClipboardItem[];
  private pruning = false;
  private pruneAborted = false;
  private disposed = false;
  private operationQueue: Promise<void> = Promise.resolve();

  constructor(private readonly options: AppendLogStorageOptions) {}

  resolvePaths(): StoragePaths | false {
    const saveTo = this.options.getSaveTo();

    if (saveTo === false) {
      return false;
    }

    const storageRoot = this.options.getStorageRoot();

    if (typeof saveTo === "string") {
      const normalized = path.normalize(saveTo);
      const isJsonPath = normalized.toLowerCase().endsWith(".json");
      const storageDir = isJsonPath
        ? path.join(path.dirname(normalized), STORAGE_DIRNAME)
        : normalized;

      return {
        storageDir,
        indexPath: path.join(storageDir, INDEX_FILENAME),
        valuesPath: path.join(storageDir, VALUES_FILENAME),
        legacyJsonPath: isJsonPath
          ? normalized
          : path.join(storageRoot, LEGACY_JSON_FILENAME),
      };
    }

    const storageDir = path.join(storageRoot, STORAGE_DIRNAME);

    return {
      storageDir,
      indexPath: path.join(storageDir, INDEX_FILENAME),
      valuesPath: path.join(storageDir, VALUES_FILENAME),
      legacyJsonPath: path.join(storageRoot, LEGACY_JSON_FILENAME),
    };
  }

  async load(): Promise<IClipboardItem[]> {
    return this.enqueue(async () => {
      const paths = this.resolvePaths();
      if (!paths) {
        return [];
      }

      await fs.mkdir(paths.storageDir, { recursive: true });

      if (await this.pathExists(paths.indexPath)) {
        return this.loadFromIndex(paths);
      }

      const migrated = await this.migrateLegacy(paths);
      if (migrated) {
        return migrated;
      }

      return [];
    });
  }

  async save(clips: IClipboardItem[], immediate = false): Promise<void> {
    const paths = this.resolvePaths();
    if (!paths) {
      return;
    }

    this.pendingClips = clips;

    if (immediate) {
      if (this.saveIndexTimer) {
        clearTimeout(this.saveIndexTimer);
        this.saveIndexTimer = undefined;
      }
      await this.persistClips(paths, clips);
      return;
    }

    if (this.saveIndexTimer) {
      clearTimeout(this.saveIndexTimer);
    }

    await new Promise<void>((resolve, reject) => {
      this.saveIndexTimer = setTimeout(() => {
        const clipsToSave = this.pendingClips ?? clips;
        this.persistClips(paths, clipsToSave).then(resolve).catch(reject);
      }, INDEX_SAVE_DEBOUNCE_MS);
    });
  }

  async checkExternalUpdate(): Promise<IClipboardItem[] | null> {
    const paths = this.resolvePaths();
    if (!paths) {
      return null;
    }

    try {
      const stat = await fs.stat(paths.indexPath);
      if (stat.mtimeMs <= this.lastIndexMtime) {
        return null;
      }

      return this.enqueue(async () => this.loadFromIndex(paths));
    } catch {
      return null;
    }
  }

  touchActivity(): void {
    this.scheduleIdlePrune();
  }

  async prune(force = false): Promise<void> {
    const paths = this.resolvePaths();
    if (!paths) {
      return;
    }

    await this.enqueue(async () => {
      if (this.pruning) {
        return;
      }

      const garbageRatio = this.getGarbageRatio();
      if (!force && garbageRatio < PRUNE_GARBAGE_RATIO) {
        return;
      }

      this.pruning = true;
      this.pruneAborted = false;

      try {
        await this.compactValues(paths);
      } finally {
        this.pruning = false;
      }
    });
  }

  async dispose(): Promise<void> {
    this.disposed = true;

    if (this.saveIndexTimer) {
      clearTimeout(this.saveIndexTimer);
      this.saveIndexTimer = undefined;
    }

    if (this.idlePruneTimer) {
      clearTimeout(this.idlePruneTimer);
      this.idlePruneTimer = undefined;
    }

    if (this.pendingClips) {
      const paths = this.resolvePaths();
      if (paths) {
        await this.enqueue(() =>
          this.persistClipsLocked(paths, this.pendingClips!)
        );
      }
    }

    await this.prune(true);
  }

  getLastIndexMtime(): number {
    return this.lastIndexMtime;
  }

  private async persistClips(
    paths: StoragePaths,
    clips: IClipboardItem[]
  ): Promise<void> {
    await this.enqueue(() => this.persistClipsLocked(paths, clips));
  }

  private async persistClipsLocked(
    paths: StoragePaths,
    clips: IClipboardItem[]
  ): Promise<void> {
    await fs.mkdir(paths.storageDir, { recursive: true });

    const persistedClips: IClipboardItem[] = [];

    for (const clip of clips) {
      if (this.pruneAborted) {
        return;
      }

      if (clip.offset !== undefined && clip.length !== undefined) {
        persistedClips.push(clip);
        continue;
      }

      const appended = await this.appendValue(paths, clip.value);
      persistedClips.push({
        ...clip,
        offset: appended.offset,
        length: appended.length,
      });
    }

    this.index = {
      version: STORAGE_VERSION,
      valuesSize: this.index.valuesSize,
      clips: persistedClips.map(clipToMetadata),
    };

    await this.writeIndex(paths);
    this.scheduleIdlePrune();
  }

  private async loadFromIndex(paths: StoragePaths): Promise<IClipboardItem[]> {
    const indexBuffer = await fs.readFile(paths.indexPath);
    const stored = unpackr.unpack(indexBuffer) as IStorageIndex;

    if (!stored?.clips || stored.version !== STORAGE_VERSION) {
      return [];
    }

    this.index = stored;
    this.lastIndexMtime = (await fs.stat(paths.indexPath)).mtimeMs;

    let valuesBuffer: Buffer;
    try {
      valuesBuffer = await fs.readFile(paths.valuesPath);
    } catch {
      return [];
    }

    const clips: IClipboardItem[] = [];

    for (const metadata of stored.clips) {
      if (
        metadata.offset < 0 ||
        metadata.length <= 0 ||
        metadata.offset + metadata.length > valuesBuffer.length
      ) {
        continue;
      }

      try {
        const value = unpackr.unpack(valuesBuffer, {
          start: metadata.offset,
          end: metadata.offset + metadata.length,
        }) as string;

        if (typeof value !== "string") {
          continue;
        }

        clips.push(metadataToClip(metadata, value));
      } catch {
        continue;
      }
    }

    return clips;
  }

  private async migrateLegacy(
    paths: StoragePaths
  ): Promise<IClipboardItem[] | null> {
    let legacyStore = await readLegacyJsonFile(paths.legacyJsonPath);

    if (!legacyStore) {
      const globalStateClips =
        this.options.context.globalState.get<unknown>("clips");
      if (globalStateClips) {
        legacyStore = parseLegacyJson(globalStateClips as string | object);
        if (legacyStore) {
          legacyStore = normalizeLegacyStore({ ...legacyStore, version: 1 });
        }
      }
    }

    if (!legacyStore) {
      return null;
    }

    const clips = legacyStore.clips.map(clip => {
      const partial = legacyClipToPartial(clip);
      return createClipItem(clip.value, {
        ...partial,
        createdLocation: deserializeLocation(partial.createdLocation),
      });
    });

    await this.persistClipsLocked(paths, clips);
    await this.backupLegacyJson(paths.legacyJsonPath);

    return clips;
  }

  private async backupLegacyJson(legacyJsonPath: string): Promise<void> {
    try {
      await fs.rename(
        legacyJsonPath,
        `${legacyJsonPath}${LEGACY_JSON_MIGRATED_SUFFIX}`
      );
    } catch {
      // ignore missing legacy file
    }
  }

  private async appendValue(
    paths: StoragePaths,
    value: string
  ): Promise<{ offset: number; length: number }> {
    const packed = packr.pack(value);
    const offset = this.index.valuesSize;

    await fs.appendFile(paths.valuesPath, packed);
    this.index.valuesSize = offset + packed.length;

    return {
      offset,
      length: packed.length,
    };
  }

  private async writeIndex(paths: StoragePaths): Promise<void> {
    const tempPath = `${paths.indexPath}.tmp`;
    const packed = packr.pack(this.index);

    await fs.writeFile(tempPath, packed);
    await fs.rename(tempPath, paths.indexPath);
    this.lastIndexMtime = (await fs.stat(paths.indexPath)).mtimeMs;
  }

  private getGarbageRatio(): number {
    if (this.index.valuesSize <= 0) {
      return 0;
    }

    const activeBytes = this.index.clips.reduce(
      (total, clip) => total + clip.length,
      0
    );

    return 1 - activeBytes / this.index.valuesSize;
  }

  private async compactValues(paths: StoragePaths): Promise<void> {
    if (this.index.clips.length === 0) {
      await this.writeEmptyValues(paths);
      return;
    }

    let valuesBuffer: Buffer;
    try {
      valuesBuffer = await fs.readFile(paths.valuesPath);
    } catch {
      await this.writeEmptyValues(paths);
      return;
    }

    const tempPath = `${paths.valuesPath}.tmp`;
    let nextOffset = 0;
    const updatedClips: IClipMetadata[] = [];

    const handle = await fs.open(tempPath, "w");

    try {
      for (const metadata of this.index.clips) {
        if (this.pruneAborted || this.disposed) {
          return;
        }

        const chunk = valuesBuffer.subarray(
          metadata.offset,
          metadata.offset + metadata.length
        );

        await handle.write(chunk);
        updatedClips.push({
          ...metadata,
          offset: nextOffset,
        });
        nextOffset += metadata.length;
      }
    } finally {
      await handle.close();
    }

    await fs.rename(tempPath, paths.valuesPath);

    this.index = {
      version: STORAGE_VERSION,
      valuesSize: nextOffset,
      clips: updatedClips,
    };

    await this.writeIndex(paths);
  }

  private async writeEmptyValues(paths: StoragePaths): Promise<void> {
    await fs.writeFile(paths.valuesPath, Buffer.alloc(0));
    this.index = {
      version: STORAGE_VERSION,
      valuesSize: 0,
      clips: [],
    };
    await this.writeIndex(paths);
  }

  private scheduleIdlePrune(): void {
    if (this.idlePruneTimer) {
      clearTimeout(this.idlePruneTimer);
    }

    this.idlePruneTimer = setTimeout(() => {
      void this.prune();
    }, PRUNE_IDLE_MS);
  }

  private abortPrune(): void {
    if (this.pruning) {
      this.pruneAborted = true;
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    this.abortPrune();

    const result = this.operationQueue.then(operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
