import * as os from "os";
import * as vscode from "vscode";
import { BanList } from "./banList";
import {
  applyMaxClips,
  isPinnedClip,
  moveClipToTop,
  placeAfterPinChange,
  sortClips,
  sortClipsByRecency,
} from "./clipList";
import { IClipboardTextChange, Monitor } from "./monitor";
import { AppendLogStorage } from "./storage/appendLogStorage";
import {
  computeChecksum,
  createClipItem,
  IClipboardItem,
  normalizeNote,
} from "./storage/types";

export type { IClipboardItem } from "./storage/types";

export class ClipboardManager implements vscode.Disposable {
  protected _disposable: vscode.Disposable[] = [];

  protected _clips: IClipboardItem[] = [];
  get clips() {
    return this._clips;
  }

  protected _storage: AppendLogStorage;
  protected _checksumMap = new Map<string, IClipboardItem>();
  protected _loading = false;
  protected _banList: BanList;

  private _onDidClipListChange = new vscode.EventEmitter<void>();
  public readonly onDidChangeClipList = this._onDidClipListChange.event;

  constructor(
    protected context: vscode.ExtensionContext,
    protected _monitor: Monitor
  ) {
    this._banList = new BanList(context.secrets);
    this._storage = new AppendLogStorage({
      context: this.context,
      getSaveTo: () =>
        vscode.workspace
          .getConfiguration("clipboard-manager")
          .get<string | null | boolean>("saveTo") ?? null,
      getStorageRoot: () => this.getStorageRoot(),
    });

    this._monitor.onDidChangeText(this.updateClipList, this, this._disposable);

    void this.loadClips();

    vscode.window.onDidChangeWindowState(
      state => {
        if (state.focused) {
          void this.checkClipsUpdate();
        }
      },
      this,
      this._disposable
    );

    vscode.workspace.onDidChangeConfiguration(e => {
      if (!e.affectsConfiguration("clipboard-manager")) {
        return;
      }
      if (e.affectsConfiguration("clipboard-manager.ui.pinnedToTop")) {
        this.normalizeClipOrder();
        this._onDidClipListChange.fire();
      }
      void this.saveClips(true);
    });
  }

  protected getPinnedToTop(): boolean {
    return vscode.workspace
      .getConfiguration("clipboard-manager")
      .get<boolean>("ui.pinnedToTop", true);
  }

  protected normalizeClipOrder(): void {
    if (this.getPinnedToTop()) {
      this._clips = sortClips(this._clips, true);
    } else {
      this._clips = sortClipsByRecency(this._clips);
    }
    this.rebuildChecksumMap();
  }

  get banList(): BanList {
    return this._banList;
  }

  protected getStorageRoot(): string {
    let folder = os.tmpdir();

    if (this.context.storagePath) {
      const parts = this.context.storagePath.split(
        /[\\/]workspaceStorage[\\/]/
      );
      folder = parts[0];
    }

    return folder;
  }

  protected rebuildChecksumMap() {
    this._checksumMap.clear();
    for (const clip of this._clips) {
      this._checksumMap.set(clip.checksum, clip);
    }
  }

  protected updateClipList(change: IClipboardTextChange) {
    void this.applyClipListUpdate(change);
  }

  protected async applyClipListUpdate(change: IClipboardTextChange) {
    await this.checkClipsUpdate();
    await this._banList.ensureLoaded();

    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const maxClips = config.get("maxClips", 100);
    const avoidDuplicates = config.get("avoidDuplicates", true);
    const checksum = computeChecksum(change.value);

    if (this._banList.has(checksum)) {
      if (config.get("ban.notifyOnBlock", false)) {
        void vscode.window.showInformationMessage(
          "Clipboard Manager: blocked a banned clip"
        );
      }
      return;
    }

    let item = createClipItem(change.value, {
      createdAt: change.timestamp,
      copyCount: 1,
      useCount: 0,
      language: change.language,
      createdLocation: change.location,
      checksum,
    });

    if (avoidDuplicates) {
      const existing = this._checksumMap.get(checksum);

      if (existing) {
        existing.copyCount++;
        item = { ...existing };
        this._clips = this._clips.filter(c => c.checksum !== checksum);
      }
    }

    this._clips.unshift(item);
    this.rebuildChecksumMap();
    this._clips = applyMaxClips(
      sortClips(this._clips, this.getPinnedToTop()),
      maxClips,
      this.getPinnedToTop()
    );
    this.rebuildChecksumMap();

    this._onDidClipListChange.fire();
    this._storage.touchActivity();
    await this.saveClips();
  }

  public async setClipboardValue(value: string) {
    await this.checkClipsUpdate();

    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const moveToTop = config.get("moveToTop", true);
    const checksum = computeChecksum(value);
    const index = this._clips.findIndex(
      c => c.checksum === checksum || c.value === value
    );

    if (index >= 0) {
      this._clips[index].useCount++;

      if (moveToTop) {
        this._clips = moveClipToTop(this._clips, index, this.getPinnedToTop());
        this.rebuildChecksumMap();
        this._onDidClipListChange.fire();
        await this.saveClips();
      } else {
        await this.saveClips();
      }
    }

    return await this._monitor.clipboard.writeText(value);
  }

  public async removeClipboardValue(value: string) {
    await this.checkClipsUpdate();

    const prevLength = this._clips.length;
    const checksum = computeChecksum(value);

    this._clips = this._clips.filter(
      c => c.checksum !== checksum && c.value !== value
    );
    this.rebuildChecksumMap();
    this._onDidClipListChange.fire();
    await this.saveClips();

    return prevLength !== this._clips.length;
  }

  /**
   * Ban a clip by content: store checksum in SecretStorage, remove from history, prune.
   */
  public async banClipboardValue(value: string): Promise<boolean> {
    await this.checkClipsUpdate();
    await this._banList.ensureLoaded();

    const checksum = computeChecksum(value);
    await this._banList.ban(checksum);

    const removed = await this.removeClipboardValue(value);
    await this._storage.prune(true);

    return removed;
  }

  public findClipById(id: string): IClipboardItem | undefined {
    return this._clips.find(clip => (clip.id ?? clip.checksum) === id);
  }

  public async updateClipById(
    id: string,
    patch: Partial<Pick<IClipboardItem, "pinned" | "note">>
  ): Promise<boolean> {
    await this.checkClipsUpdate();

    const index = this._clips.findIndex(
      clip => (clip.id ?? clip.checksum) === id
    );
    if (index < 0) {
      return false;
    }

    let clips = this._clips.slice();
    const current = clips[index];
    const next: IClipboardItem = { ...current };

    if (Object.hasOwn(patch, "note")) {
      next.note = normalizeNote(patch.note);
    }
    if (Object.hasOwn(patch, "pinned")) {
      next.pinned = patch.pinned;
    }

    clips[index] = next;

    if (Object.hasOwn(patch, "pinned") && patch.pinned !== undefined) {
      clips = placeAfterPinChange(
        clips,
        id,
        patch.pinned,
        this.getPinnedToTop()
      );
    } else if (this.getPinnedToTop()) {
      clips = sortClips(clips, true);
    }

    const maxClips = vscode.workspace
      .getConfiguration("clipboard-manager")
      .get("maxClips", 100);
    this._clips = applyMaxClips(clips, maxClips, this.getPinnedToTop());
    this.rebuildChecksumMap();
    this._onDidClipListChange.fire();
    await this.saveClips();

    return true;
  }

  public async setPinned(id: string, pinned: boolean): Promise<boolean> {
    return this.updateClipById(id, { pinned });
  }

  public async setNote(id: string, note: string | undefined): Promise<boolean> {
    return this.updateClipById(id, { note });
  }

  public async clearUnpinned(): Promise<boolean> {
    await this.checkClipsUpdate();

    const prevLength = this._clips.length;
    this._clips = this._clips.filter(isPinnedClip);
    this.rebuildChecksumMap();
    this._onDidClipListChange.fire();
    await this.saveClips(true);
    await this._storage.prune(true);

    return prevLength !== this._clips.length;
  }

  public async clearAll() {
    await this.checkClipsUpdate();

    this._clips = [];
    this.rebuildChecksumMap();
    this._onDidClipListChange.fire();
    await this.saveClips(true);

    return true;
  }

  public async saveClips(immediate = false) {
    try {
      await this._storage.save(this._clips, immediate);
    } catch (error: any) {
      this.handleStorageError(error);
    }
  }

  public async checkClipsUpdate() {
    if (this._loading) {
      return;
    }

    try {
      const clips = await this._storage.checkExternalUpdate();
      if (!clips) {
        return;
      }

      await this._banList.ensureLoaded();
      this._clips = clips.filter(clip => !this._banList.has(clip.checksum));
      this.rebuildChecksumMap();
      this._onDidClipListChange.fire();
    } catch (error) {
      console.error(error);
    }
  }

  public async loadClips() {
    if (this._loading) {
      return;
    }

    this._loading = true;

    try {
      await this._banList.ensureLoaded();
      const loaded = await this._storage.load();
      const filtered = loaded.filter(clip => !this._banList.has(clip.checksum));

      this._clips = filtered;
      this.normalizeClipOrder();
      this._onDidClipListChange.fire();

      if (filtered.length !== loaded.length) {
        await this.saveClips(true);
        await this._storage.prune(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this._loading = false;
    }
  }

  protected handleStorageError(error: any) {
    if (error?.code === "EPERM") {
      const paths = this._storage.resolvePaths();
      vscode.window.showErrorMessage(
        `Not permitted to save clipboards on "${paths ? paths.storageDir : "storage"}"`
      );
      return;
    }

    if (error?.code === "EISDIR") {
      const paths = this._storage.resolvePaths();
      vscode.window.showErrorMessage(
        `Failed to save clipboards on "${paths ? paths.storageDir : "storage"}", because the path is a directory`
      );
      return;
    }

    console.error(error);
  }

  public async shutdown() {
    await this.saveClips(true);
    await this._storage.dispose();
    this._disposable.forEach(d => d.dispose());
  }

  public dispose() {
    void this.shutdown();
  }
}
