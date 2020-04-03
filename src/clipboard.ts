import * as clipboardy from "clipboardy";
import * as vscode from "vscode";

/**
 * Clipboard base class to read and write text and detect changes
 */
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

export class ClipboardyClipboard extends BaseClipboard {
  protected readTextInternal(): Thenable<string> {
    let promise = clipboardy.read();

    /**
     * Fix problem in `clipboardy` when clipboard text is empty on windows
     * Example: After power up or after a print screen
     */
    if (process.platform === "win32") {
      promise = promise.then(null, (reason: any) => {
        const ignoreMessage =
          "thread 'main' panicked at 'Error: Could not paste from clipboard: Error { repr: Os { code: 0, message:";

        if (reason.stderr && reason.stderr.startsWith(ignoreMessage)) {
          // return empty content
          return "";
        }

        throw reason;
      });
    }

    return promise;
  }
  protected writeTextInternal(value: string): Thenable<void> {
    return clipboardy.write(value);
  }
}

export function getNewDefaultInstance() {
  let clipboard;

  try {
    vscode.env.clipboard.readText();
    clipboard = new VSCodeClipboard();
    // tslint:disable-next-line:no-empty
  } catch (error) {}

  if (!clipboard) {
    clipboard = new ClipboardyClipboard();
  }

  return clipboard;
}

export const defaultClipboard: BaseClipboard = getNewDefaultInstance();
