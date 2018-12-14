import * as vscode from "vscode";
import { Monitor } from "../monitor";
import { commandList } from "./common";

export class ApiGetMonitor implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected monitor: Monitor) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.apiGetMonitor,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    return this.monitor;
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
