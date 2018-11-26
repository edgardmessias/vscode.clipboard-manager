import * as vscode from "vscode";
import {
  defaultClipboard,
  IClipboard,
  IClipboardTextChange
} from "./clipboard";

export interface IClipboardItem {
  value: string;
  createdAt: number;
  lastUse?: number;
  copyCount: number;
  useCount: number;
  language?: string;
  createdLocation?: vscode.Location;
}

export class ClipboardManager implements vscode.Disposable {
  protected _disposable: vscode.Disposable[] = [];

  protected _clips: IClipboardItem[] = [];
  get clips() {
    return this._clips;
  }

  // get clipboard() {
  //   return this._clipboard;
  // }

  private _onDidClipListChange = new vscode.EventEmitter<void>();
  public readonly onDidChangeClipList = this._onDidClipListChange.event;

  constructor(
    protected context: vscode.ExtensionContext,
    protected _clipboard: IClipboard = defaultClipboard
  ) {
    this._clipboard.onDidChangeText(
      this.updateClipList,
      this,
      this._disposable
    );

    this.loadClips();
  }

  protected updateClipList(change: IClipboardTextChange) {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const maxClips = config.get("maxClips", 100);
    const avoidDuplicates = config.get("avoidDuplicates", true);

    let item: IClipboardItem = {
      value: change.value,
      createdAt: change.timestamp,
      copyCount: 1,
      useCount: 0,
      language: change.language,
      createdLocation: change.location
    };

    if (avoidDuplicates) {
      const index = this._clips.findIndex(c => c.value === change.value);

      // Remove same clips and move recent to top
      if (index >= 0) {
        this._clips[index].copyCount++;
        item = this._clips[index];
        this._clips = this._clips.filter(c => c.value !== change.value);
      }
    }

    // Add to top
    this._clips.unshift(item);

    // Max clips to store
    if (maxClips > 0) {
      this._clips = this._clips.slice(0, maxClips);
    }

    this._onDidClipListChange.fire();

    this.saveClips();
  }

  public async setClipboardValue(value: string) {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const moveToTop = config.get("moveToTop", true);

    const index = this._clips.findIndex(c => c.value === value);

    if (index >= 0) {
      this._clips[index].useCount++;

      if (moveToTop) {
        const clips = this.clips.splice(index, 1);
        this._clips.unshift(...clips);
        this._onDidClipListChange.fire();
        this.saveClips();
      }
    }

    return await this._clipboard.writeText(value);
  }

  public async removeClipboardValue(value: string) {
    const prevLength = this._clips.length;

    this._clips = this._clips.filter(c => c.value !== value);
    this._onDidClipListChange.fire();

    return prevLength !== this._clips.length;
  }

  protected jsonReplacer(key: string, value: any) {
    if (key === "createdLocation") {
      value = {
        range: {
          start: value.range.start,
          end: value.range.end
        },
        uri: value.uri.toString()
      };
    } else if (value instanceof vscode.Uri) {
      value = value.toString();
    }

    return value;
  }

  public saveClips() {
    const json = JSON.stringify(
      {
        version: 2,
        clips: this._clips
      },
      this.jsonReplacer
    );
    this.context.globalState.update("clips", json);
  }

  public loadClips() {
    const json = this.context.globalState.get<any>("clips");

    if (!json) {
      return;
    }

    const stored = JSON.parse(json);

    if (!stored.version || !stored.clips) {
      return;
    }

    let clips = stored.clips as any[];

    if (stored.version === 1) {
      clips = clips.map(c => {
        c.createdAt = c.timestamp;
        c.copyCount = 1;
        c.useCount = 0;
        c.createdLocation = c.location;
        return c;
      });
      stored.version = 2;
    }

    this._clips = clips.map(c => {
      const clip: IClipboardItem = {
        value: c.value,
        createdAt: c.createdAt,
        copyCount: c.copyCount,
        useCount: c.copyCount,
        language: c.language
      };

      if (c.createdLocation) {
        const uri = vscode.Uri.parse(c.createdLocation.uri);
        const range = new vscode.Range(
          c.createdLocation.range.start.line,
          c.createdLocation.range.start.character,
          c.createdLocation.range.end.line,
          c.createdLocation.range.end.character
        );
        clip.createdLocation = new vscode.Location(uri, range);
      }

      return clip;
    });

    this._onDidClipListChange.fire();
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());

    if (this._clipboard) {
      this._clipboard.dispose();
    }
  }
}
