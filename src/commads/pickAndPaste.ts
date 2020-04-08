import * as vscode from "vscode";
import { ClipboardManager, IClipboardItem } from "../manager";
import { leftPad } from "../util";
import { commandList } from "./common";

class ClipPickItem implements vscode.QuickPickItem {
  public label: string;

  get description() {
    if (this.clip.createdAt) {
      const date = new Date(this.clip.createdAt);
      return date.toLocaleString();
    }
  }

  constructor(readonly clip: IClipboardItem) {
    this.label = this.clip.value.replace(/\s+/g, " ").trim();
  }
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

  protected async execute() {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const preview = config.get("preview", true);

    const clips = this._manager.clips;

    const maxLength = `${clips.length}`.length;

    const picks = clips.map((c, index) => {
      const item = new ClipPickItem(c);
      const indexNumber = leftPad(index + 1, maxLength, "0");

      item.label = `${indexNumber}) ${item.label}`;

      return item;
    });

    // Variable to check changes in document by preview
    let needUndo = false;

    const options: vscode.QuickPickOptions = {
      placeHolder: "Select one clip to paste. ESC to cancel.",
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
              for (const selection of editor.selections) {
                edit.replace(selection, selected.clip.value);
              }
              needUndo = true;
            },
            {
              undoStopAfter: false,
              undoStopBefore: false,
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
    await this._manager.setClipboardValue(pick.clip.value);

    // If text changed, only need remove selecion
    // If a error occur on replace, run paste command for fallback
    if (needUndo) {
      // Fix editor selection
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const selecions = editor.selections.map(
          s => new vscode.Selection(s.end, s.end)
        );
        editor.selections = selecions;
      } else {
        return await vscode.commands.executeCommand("cancelSelection");
      }
    } else {
      return await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
    }
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
