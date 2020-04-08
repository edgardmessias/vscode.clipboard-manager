import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { commandList } from "./common";

export class ClearClipboardHistory implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.clearClipboardHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const yes = "Yes";
    const response = await vscode.window.showWarningMessage(
      "Do you really want to clear the history list?",
      {
        modal: true,
      },
      yes
    );

    if (response === yes) {
      this._manager.clearAll();
    }
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
