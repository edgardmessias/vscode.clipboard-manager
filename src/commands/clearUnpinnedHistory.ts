import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { commandList } from "./common";

export class ClearUnpinnedHistory implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.clearUnpinnedHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const yes = "Yes";
    const response = await vscode.window.showWarningMessage(
      "Remove all unpinned clips? Pinned clips will be kept.",
      { modal: true },
      yes
    );

    if (response === yes) {
      await this._manager.clearUnpinned();
    }
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
