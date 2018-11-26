import * as vscode from "vscode";
import { commandList } from "./commads/common";
import { ClipboardManager } from "./manager";

export class ClipboardCompletion implements vscode.CompletionItemProvider {
  constructor(protected manager: ClipboardManager) {}

  public provideCompletionItems(
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
    const maxSnippets = config.get("maxSnippets", 10);

    const clips =
      maxSnippets > 0
        ? this.manager.clips.slice(0, maxSnippets)
        : this.manager.clips;

    const zeros = "0".repeat(`${clips.length}`.length);

    const completions: vscode.CompletionItem[] = clips.map((clip, index) => {
      // Add left zero pad from max number of clips
      const indexNumber = `${zeros}${index + 1}`.substr(-zeros.length);

      const c: vscode.CompletionItem = {
        label: `${prefix}${indexNumber}`,
        detail: `Clipboard ${indexNumber}`,
        insertText: clip.value,
        kind: vscode.CompletionItemKind.Text,
        filterText: `${prefix}${indexNumber} ${clip.value}`
      };

      // Highlight the syntax of clip
      c.documentation = new vscode.MarkdownString();
      c.documentation.appendCodeblock(clip.value, clip.language);

      if (clip.createdAt) {
        const date = new Date(clip.createdAt);
        c.detail += " - " + date.toLocaleString();
      }

      c.command = {
        command: commandList.setClipboardValue,
        title: "Paste",
        tooltip: "Paste",
        arguments: [clip.value]
      };

      return c;
    });

    return completions;
  }
}
