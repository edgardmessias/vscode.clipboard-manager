import * as vscode from "vscode";
import { IClipboardItem } from "../manager";

export async function openClipLocation(clip: IClipboardItem): Promise<void> {
  if (!clip.createdLocation) {
    return;
  }

  const uri = clip.createdLocation.uri;
  const document = await vscode.workspace.openTextDocument(uri);

  const opts: vscode.TextDocumentShowOptions = {
    viewColumn: vscode.ViewColumn.Active,
  };

  if (document.getText(clip.createdLocation.range) === clip.value) {
    opts.selection = clip.createdLocation.range;
  } else {
    const indexes: number[] = [];
    const text = document.getText();
    let lastIndex = text.indexOf(clip.value);

    while (lastIndex >= 0) {
      indexes.push(lastIndex);
      lastIndex = text.indexOf(clip.value, lastIndex + 1);
    }

    if (indexes.length > 0) {
      const offset = document.offsetAt(clip.createdLocation.range.start);
      indexes.sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset));

      const index = indexes[0];
      if (index >= 0) {
        opts.selection = new vscode.Range(
          document.positionAt(index),
          document.positionAt(index + clip.value.length)
        );
      }
    }
  }

  await vscode.window.showTextDocument(document, opts);
}
