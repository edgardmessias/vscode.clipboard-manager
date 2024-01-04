import * as vscode from "vscode";
import { ClipboardManager, IClipboardItem } from "../manager";
import { commandList } from "./common";
export class ClipboardHistoryProvider
  implements vscode.TextDocumentContentProvider
{
  constructor(protected _manager: ClipboardManager) {}

  protected createClipsString(clips: IClipboardItem[]): string {
    return clips
      .map(clip => {
        const createdAt = new Date(clip.createdAt).toLocaleString();
        const language = clip.language ? `${clip.language}` : "";
        const statusLine = `${createdAt} - ${language} - ${clip.createdLocation?.uri.toString()}`;
        const clipText = clip.value.trim();
        const dashLine = "-".repeat(statusLine.length);
        return `${statusLine}\n${dashLine}\n${clipText}`;
      })
      .join("\n\n");
  }

  public provideTextDocumentContent(_uri: vscode.Uri): string {
    return this.createClipsString(this._manager.clips);
  }
}

export class ShowClipboardHistory implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  constructor(protected _manager: ClipboardManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.showClipboardHistory,
        this.execute,
        this
      )
    );
  }

  protected async execute() {
    const timestamp = Date.now();
    const uri = vscode.Uri.parse(
      `clipboard-history://history/clipboard-buffer.txt?${timestamp}`
    );

    const document = await vscode.workspace.openTextDocument(uri);

    await vscode.window.showTextDocument(document, {
      preview: true,
      viewColumn: vscode.ViewColumn.Active,
    });
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
