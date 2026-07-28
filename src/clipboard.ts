import * as vscode from "vscode";

export abstract class BaseClipboard {
  protected _disposables: vscode.Disposable[] = [];

  private _onDidWillWriteText = new vscode.EventEmitter<string>();
  public readonly onDidWillWriteText = this._onDidWillWriteText.event;

  private _onDidWriteText = new vscode.EventEmitter<string>();
  public readonly onDidWriteText = this._onDidWriteText.event;

  constructor() {
    this._disposables.push(this._onDidWillWriteText);
    this._disposables.push(this._onDidWriteText);
  }

  public readText(): Thenable<string> {
    return this.readTextInternal();
  }

  public async writeText(value: string) {
    this._onDidWillWriteText.fire(value);
    await this.writeTextInternal(value);
    this._onDidWriteText.fire(value);
  }

  protected abstract readTextInternal(): Thenable<string>;
  protected abstract writeTextInternal(value: string): Thenable<void>;

  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}

export class VSCodeClipboard extends BaseClipboard {
  protected readTextInternal(): Thenable<string> {
    return vscode.env.clipboard.readText();
  }
  protected writeTextInternal(value: string): Thenable<void> {
    return vscode.env.clipboard.writeText(value);
  }
}

export const defaultClipboard = new VSCodeClipboard();

export function getNewDefaultInstance(): VSCodeClipboard {
  return new VSCodeClipboard();
}
