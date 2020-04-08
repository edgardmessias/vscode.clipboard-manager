import * as vscode from "vscode";
import { commandList } from "./commads/common";
import { ClipboardManager } from "./manager";
import { leftPad } from "./util";

export class ClipboardCompletion implements vscode.CompletionItemProvider {
  constructor(protected manager: ClipboardManager) {}

  public provideCompletionItems(
    document: vscode.TextDocument,
    _position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const config = vscode.workspace.getConfiguration(
      "clipboard-manager",
      document.uri
    );

    const enabled = config.get<boolean>("snippet.enabled", true);

    if (!enabled) {
      return null;
    }

    const prefix = config.get<string>("snippet.prefix", "clip");
    const maxSnippets = config.get<number>("snippet.max", 10);

    const clips =
      maxSnippets > 0
        ? this.manager.clips.slice(0, maxSnippets)
        : this.manager.clips;

    const maxLength = `${clips.length}`.length;

    const completions: vscode.CompletionItem[] = clips.map((clip, index) => {
      // Add left zero pad from max number of clips
      const indexNumber = leftPad(index + 1, maxLength, "0");

      const c: vscode.CompletionItem = {
        label: `${prefix}${indexNumber}`,
        detail: `Clipboard ${indexNumber}`,
        insertText: clip.value,
        kind: vscode.CompletionItemKind.Text,
        filterText: `${prefix}${indexNumber} ${clip.value}`,
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
        arguments: [clip.value],
      };

      return c;
    });

    return completions;
  }
}
