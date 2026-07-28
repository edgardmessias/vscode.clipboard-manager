import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { IClipboardTextChange } from "../monitor";
import { commandList } from "./common";

/**
 * Command to paste from double click on history item
 */
export class HistoryTreeDoubleClickCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  private prevClip: IClipboardTextChange | undefined;
  private prevTime = Date.now();

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.historyTreeDoubleClick,
        this.execute,
        this
      )
    );
  }

  /**
   * Emulate double click on tree view history
   * @param clip
   */
  protected async execute(clip: IClipboardTextChange) {
    const now = Date.now();
    if (this.prevClip !== clip) {
      this.prevClip = clip;
      this.prevTime = now;
      return;
    }

    const diff = now - this.prevTime;
    this.prevTime = now;

    if (diff > 500) {
      return;
    }

    // Reset double click
    this.prevClip = undefined;

    // Update current clip in clipboard
    await this._manager.setClipboardValue(clip.value);

    // Force to focus on editor to paste command works
    await vscode.commands.executeCommand(
      "workbench.action.focusActiveEditorGroup"
    );

    // Run default paste
    return await vscode.commands.executeCommand(
      "editor.action.clipboardPasteAction"
    );
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
