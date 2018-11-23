import * as vscode from "vscode";
import { ClipboardManager } from "./manager";

export class ClipboardCompletion implements vscode.CompletionItemProvider {
  constructor(protected manager: ClipboardManager) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const config = vscode.workspace.getConfiguration(
      "clipboard-manager",
      document.uri
    );

    const prefix = config.get("snippetPrefix", "clip");

    const clips = this.manager.clips;

    const completions: vscode.CompletionItem[] = clips.map((clip, index) => {
      const c: vscode.CompletionItem = {
        label: `${prefix}${index + 1}`,
        detail: `Clipboard ${index + 1}`,
        insertText: clip.value,
        kind: vscode.CompletionItemKind.Text,
        filterText: `${prefix}${index + 1} ${clip.value}`
      };

      // Highlight the syntax of clip
      c.documentation = new vscode.MarkdownString();
      c.documentation.appendCodeblock(clip.value, clip.language);

      if (clip.timestamp) {
        const date = new Date(clip.timestamp);
        c.detail += " - " + date.toLocaleString();
      }

      return c;
    });

    return completions;
  }
}
