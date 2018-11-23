"use strict";
import * as vscode from "vscode";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { defaultClipboard } from "./clipboard";
import { PickAndPasteCommand } from "./commads/pickAndPaste";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const config = vscode.workspace.getConfiguration("clipboard-manager");

  const manager = new ClipboardManager(context);
  const completion = new ClipboardCompletion(manager);
  const pickAndPasteCommand = new PickAndPasteCommand(manager);

  disposable.push(manager);
  // disposable.push(completion);
  disposable.push(pickAndPasteCommand);

  vscode.languages.registerCompletionItemProvider(
    {
      scheme: "file"
    },
    completion
  );

  const updateConfig = () => {
    defaultClipboard.checkInterval = config.get("checkInterval", 500);
    defaultClipboard.onlyWindowFocused = config.get("onlyWindowFocused", true);
  };
  updateConfig();

  vscode.workspace.onDidChangeConfiguration(
    e => e.affectsConfiguration("clipboard-manager") && updateConfig()
  );

  context.subscriptions.push(...disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
