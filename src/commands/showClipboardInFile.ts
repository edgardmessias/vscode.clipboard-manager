import * as vscode from "vscode";
import { openClipLocation } from "./openClipLocation";
import { ClipboardManager, IClipboardItem } from "../manager";
import { commandList } from "./common";

export class ShowClipboardInFile implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.showClipboardInFile,
        this.execute,
        this
      )
    );
  }

  protected async execute(clip: IClipboardItem) {
    await openClipLocation(clip);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
