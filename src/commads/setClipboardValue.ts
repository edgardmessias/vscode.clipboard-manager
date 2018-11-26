import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { commandList } from "./common";

export class SetClipboardValueCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.setClipboardValue,
        this.execute,
        this
      )
    );
  }

  protected async execute(value: string) {
    // Update current clip in clipboard
    await this._manager.setClipboardValue(value);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
