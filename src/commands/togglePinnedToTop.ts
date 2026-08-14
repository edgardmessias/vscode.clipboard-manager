import * as vscode from "vscode";
import { commandList } from "./common";

export class TogglePinnedToTopCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor() {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.togglePinnedToTop,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const current = config.get<boolean>("ui.pinnedToTop", true);
    const next = !current;

    await config.update(
      "ui.pinnedToTop",
      next,
      vscode.ConfigurationTarget.Global
    );

    await vscode.window.showInformationMessage(
      next
        ? "Clipboard Manager: pinned clips shown at top"
        : "Clipboard Manager: pinned clips in normal list order"
    );
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
