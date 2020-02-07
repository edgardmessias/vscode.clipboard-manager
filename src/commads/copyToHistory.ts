import * as vscode from "vscode";
import { commandList } from "./common";
import { Monitor } from "../monitor";

export class CopyToHistoryCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected monitor: Monitor) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.copyToHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");
    await this.monitor.checkChangeText();
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
