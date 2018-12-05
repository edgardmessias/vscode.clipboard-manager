import * as clipboardy from "clipboardy";
import { ExecaReturns } from "execa";
import * as vscode from "vscode";
import { toDisposable } from "./util";

export interface IClipboardTextChange {
  value: string;
  timestamp: number;
  language?: string;
  location?: vscode.Location;
}

/**
 * Clipboard interface to read and write text and detect changes
 */
export interface IClipboard extends vscode.Disposable {
  onDidChangeText: vscode.Event<IClipboardTextChange>;
  checkInterval: number;
  onlyWindowFocused: boolean;
  readText(): Thenable<string>;
  writeText(value: string): Thenable<void>;
}

export abstract class BaseClipboard implements IClipboard {
  protected _disposables: vscode.Disposable[] = [];

  protected _prevText: string = "";
  protected _windowFocused: boolean = true;
  public onlyWindowFocused: boolean = true;

  private _onDidChangeText = new vscode.EventEmitter<IClipboardTextChange>();
  public readonly onDidChangeText = this._onDidChangeText.event;

  protected _timer: NodeJS.Timer | undefined;
  protected _checkInterval: number = 500;
  get checkInterval() {
    return this._checkInterval;
  }
  set checkInterval(timeout: number) {
    this._checkInterval = timeout;
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
    if (timeout > 0) {
      this._timer = setInterval(() => this.checkChangeText(), timeout);
    }
  }

  constructor() {
    // Update current clipboard to check changes after init
    this.readText().then(value => {
      this._prevText = value;

      // Initialize the checkInterval
      this.checkInterval = this._checkInterval;

      return value;
    });

    this._disposables.push(
      toDisposable(() => {
        if (this._timer) {
          clearInterval(this._timer);
        }
      })
    );

    this._windowFocused = vscode.window.state.focused;
    // Update current clip when window if focused again
    vscode.window.onDidChangeWindowState(
      this.onDidChangeWindowState,
      this,
      this._disposables
    );
  }

  public readText(): Thenable<string> {
    return this.readTextInternal();
  }

  public writeText(value: string): Thenable<void> {
    return this.writeTextInternal(value).then(() => {
      // Prevent the detect changes when a new text is defined
      this._prevText = value;
    });
  }

  protected abstract readTextInternal(): Thenable<string>;
  protected abstract writeTextInternal(value: string): Thenable<void>;

  protected async onDidChangeWindowState(state: vscode.WindowState) {
    // Prevent detect change from external copy
    if (this.onlyWindowFocused && state.focused) {
      this._prevText = await this.readText();
    }

    this._windowFocused = state.focused;
  }

  protected async checkChangeText() {
    // Don't check the clipboard when windows is not focused
    if (this.onlyWindowFocused && !this._windowFocused) {
      return;
    }

    const newText = await this.readText();
    if (newText === this._prevText) {
      return;
    }

    const change: IClipboardTextChange = {
      value: newText,
      timestamp: Date.now()
    };

    const editor = vscode.window.activeTextEditor;

    if (this._windowFocused && editor && editor.document) {
      // Set current language of copied clip
      change.language = editor.document.languageId;

      // Try get position of clip
      if (editor.selection) {
        const selection = editor.selection;
        change.location = {
          range: new vscode.Range(selection.start, selection.end),
          uri: editor.document.uri
        };
      }
    }

    this._onDidChangeText.fire(change);
    this._prevText = newText;
  }

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
      promise = promise.then(null, (reason: ExecaReturns) => {
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

export const defaultClipboard: IClipboard = getNewDefaultInstance();
