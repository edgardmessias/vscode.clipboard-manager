import * as vscode from "vscode";
import { ClipboardManager, IClipboardItem } from "../manager";
import { commandList } from "./common";

class ClipPickItem implements vscode.QuickPickItem {
  get label() {
    return this._clip.value;
  }

  get description() {
    if (this._clip.createdAt) {
      const date = new Date(this._clip.createdAt);
      return date.toLocaleString();
    }
  }

  get clip() {
    return this._clip;
  }

  constructor(protected _clip: IClipboardItem) {}
}

export class PickAndPasteCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.pickAndPaste,
        this.execute,
        this
      )
    );
  }

  async execute() {
    /**
     * @todo Create option to enable/disable
     */
    const preview = true;

    const clips = this._manager.clips;

    const picks = clips.map(c => new ClipPickItem(c));

    // Variable to check changes in document by preview
    let needUndo = false;

    const options: vscode.QuickPickOptions = {
      placeHolder: "Select one clip to paste. ESC to cancel."
    };

    /**
     * If preview is enabled, get current text editor and replace
     * current selecion.
     * NOTE: not need paste if the text is replaced
     */
    if (preview) {
      options.onDidSelectItem = async (selected: ClipPickItem) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit(
            edit => {
              edit.replace(editor.selection, selected.clip.value);
              needUndo = true;
            },
            {
              undoStopAfter: false,
              undoStopBefore: false
            }
          );
        }
      };
    }

    const pick = await vscode.window.showQuickPick(picks, options);

    if (!pick) {
      if (needUndo) {
        return await vscode.commands.executeCommand("undo");
      }
      return;
    }

    // Update current clip in clipboard
    await this._manager.clipboard.writeText(pick.clip.value);

    // If text changed, only need remove selecion
    // If a error occur on replace, run paste command for fallback
    if (needUndo) {
      // Remove cursor selecion
      return await vscode.commands.executeCommand("cancelSelection");
    } else {
      return await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
    }
  }

  dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
