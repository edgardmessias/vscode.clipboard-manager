"use strict";
import * as vscode from "vscode";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { defaultClipboard } from "./clipboard";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { ClipboardTreeDataProvider } from "./tree/history";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const config = vscode.workspace.getConfiguration("clipboard-manager");

  const manager = new ClipboardManager(context);
  disposable.push(manager);

  const completion = new ClipboardCompletion(manager);
  // disposable.push(completion);

  vscode.languages.registerCompletionItemProvider(
    {
      scheme: "file"
    },
    completion
  );

  const pickAndPasteCommand = new PickAndPasteCommand(manager);
  disposable.push(pickAndPasteCommand);

  const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
  disposable.push(clipboardTreeDataProvider);

  vscode.window.registerTreeDataProvider(
    "clipboardHistory",
    clipboardTreeDataProvider
  );

  const historyTreeDoubleClickCommand = new HistoryTreeDoubleClickCommand(manager);
  disposable.push(historyTreeDoubleClickCommand);

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
