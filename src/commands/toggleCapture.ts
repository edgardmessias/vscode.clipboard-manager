import * as vscode from "vscode";
import { commandList } from "./common";
import { Monitor } from "../monitor";

export class ToggleCaptureCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected monitor: Monitor) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.toggleCapture,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const current = config.get<boolean>("capture.enabled", true);
    const next = !current;

    await config.update(
      "capture.enabled",
      next,
      vscode.ConfigurationTarget.Global
    );

    this.monitor.captureEnabled = next;

    await vscode.window.showInformationMessage(
      next
        ? "Clipboard Manager: capture resumed"
        : "Clipboard Manager: capture paused"
    );
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
