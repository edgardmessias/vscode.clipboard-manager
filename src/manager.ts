import * as vscode from "vscode";
import {
  IClipboard,
  IClipboardTextChange,
  defaultClipboard
} from "./clipboard";

export class ClipboardManager implements vscode.Disposable {
  protected _disposable: vscode.Disposable[] = [];

  protected _clips: IClipboardTextChange[] = [];
  get clips() {
    return this._clips;
  }

  get clipboard() {
    return this._clipboard;
  }

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

    if (avoidDuplicates) {
      // Remove same clips to move recent to top
      this._clips = this._clips.filter(c => c.value !== change.value);
    }

    // Add to top
    this._clips.unshift(change);

    // Max clips to store
    if (maxClips > 0) {
      this._clips = this._clips.slice(0, maxClips);
    }

    this.saveClips();
  }

  protected saveClips() {
    const replacer = (key: string, value: any) => {
      if (key === "location") {
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
    };

    const json = JSON.stringify(
      {
        version: 1,
        clips: this._clips
      },
      replacer
    );
    this.context.globalState.update("clips", json);
  }

  protected loadClips() {
    const json = this.context.globalState.get<any>("clips");

    if (!json) {
      return;
    }

    const stored = JSON.parse(json);

    if (!stored.version || !stored.clips) {
      return;
    }

    const clips = stored.clips as any[];

    this._clips = clips.map(c => {
      const clip: IClipboardTextChange = {
        value: c.value,
        timestamp: c.timestamp,
        language: c.language
      };

      if (c.location) {
        const uri = vscode.Uri.parse(c.location.uri);
        const range = new vscode.Range(
          c.location.range.start.line,
          c.location.range.start.character,
          c.location.range.end.line,
          c.location.range.end.character
        );
        clip.location = new vscode.Location(uri, range);
      }

      return clip;
    });
  }

  dispose() {
    this._disposable.forEach(d => d.dispose());

    if (this._clipboard) {
      this._clipboard.dispose();
    }
  }
}
