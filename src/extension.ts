"use strict";
import * as vscode from "vscode";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { defaultClipboard } from "./clipboard";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { ClipboardTreeDataProvider } from "./tree/history";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const config = vscode.workspace.getConfiguration("clipboard-manager");

  const manager = new ClipboardManager(context);
  disposable.push(manager);

  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new HistoryTreeDoubleClickCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));

  const completion = new ClipboardCompletion(manager);
  // disposable.push(completion);

  vscode.languages.registerCompletionItemProvider(
    {
      scheme: "file"
    },
    completion
  );

  const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
  disposable.push(clipboardTreeDataProvider);

  vscode.window.registerTreeDataProvider(
    "clipboardHistory",
    clipboardTreeDataProvider
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
