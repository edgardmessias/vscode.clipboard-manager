import * as vscode from "vscode";
import { BanList } from "../banList";
import { commandList } from "./common";

export class UnbanLastClipCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(private readonly _banList: BanList) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.unbanLastClip,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const removed = await this._banList.unbanLast();

    if (!removed) {
      await vscode.window.showInformationMessage(
        "Clipboard Manager: no banned clips to unban"
      );
      return;
    }

    await vscode.window.showInformationMessage(
      "Clipboard Manager: last banned clip was unbanned"
    );
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
