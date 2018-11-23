import * as vscode from "vscode";
import * as path from "path";
import { ClipboardManager } from "../manager";
import { IClipboardTextChange } from "../clipboard";
import { commandList } from "../commads/common";

class ClipHistoryItem extends vscode.TreeItem {
  constructor(protected _clip: IClipboardTextChange) {
    super(_clip.value);

    this.label = this._clip.value.replace(/\s+/g, " ").trim();
    this.tooltip = this._clip.value;

    this.command = {
      command: commandList.historyTreeDoubleClick,
      title: "Paste",
      tooltip: "Paste",
      arguments: [this._clip]
    };

    if (this._clip.location) {
      this.resourceUri = this._clip.location.uri;
      this.contextValue = "file";
    } else {
      const basePath = path.join(__filename, "..", "..", "..", "resources");

      this.iconPath = {
        light: path.join(basePath, "light", "string.svg"),
        dark: path.join(basePath, "dark", "string.svg")
      };
    }
  }
}

export class ClipboardTreeDataProvider
  implements vscode.TreeDataProvider<ClipHistoryItem>, vscode.Disposable {
  private _disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<ClipHistoryItem | null> = new vscode.EventEmitter<ClipHistoryItem | null>();
  readonly onDidChangeTreeData: vscode.Event<ClipHistoryItem | null> = this
    ._onDidChangeTreeData.event;

  constructor(protected _manager: ClipboardManager) {
    this._manager.onDidChangeClipList(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(
    element: ClipHistoryItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(
    element?: ClipHistoryItem | undefined
  ): vscode.ProviderResult<ClipHistoryItem[]> {
    const clips = this._manager.clips;

    const childs = clips.map(c => new ClipHistoryItem(c));

    return childs;
  }

  dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
