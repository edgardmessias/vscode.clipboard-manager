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
    const editor = vscode.window.activeTextEditor;
    const selected =
      editor && !editor.selection.isEmpty
        ? editor.document.getText(editor.selection)
        : undefined;

    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");

    // Explicit capture must work while paused and when the clipboard text
    // did not change (re-copying the same value after syncing during pause).
    await this.monitor.checkChangeText({
      force: true,
      value: selected,
    });
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
