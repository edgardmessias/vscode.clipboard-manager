import * as vscode from "vscode";
import { BanList } from "../banList";
import { commandList } from "./common";

export class ClearBannedClipsCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(private readonly _banList: BanList) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.clearBannedClips,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    await this._banList.ensureLoaded();
    const count = this._banList.size;

    if (count === 0) {
      await vscode.window.showInformationMessage(
        "Clipboard Manager: no banned clips"
      );
      return;
    }

    const yes = "Clear all";
    const response = await vscode.window.showWarningMessage(
      `Clear ${count} banned clip hash${count === 1 ? "" : "es"}? Banned content can be captured again.`,
      { modal: true },
      yes
    );

    if (response !== yes) {
      return;
    }

    await this._banList.clear();
    await vscode.window.showInformationMessage(
      "Clipboard Manager: banned clip list cleared"
    );
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
