import * as vscode from "vscode";
import { ClipboardManager, IClipboardItem } from "../manager";
import { commandList } from "./common";

export class RemoveClipboardHistory implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.removeClipboardHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute(value: string | IClipboardItem) {
    const clipValue = typeof value === "string" ? value : value.value;
    await this._manager.removeClipboardValue(clipValue);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
