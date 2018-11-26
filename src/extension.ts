"use strict";
import * as vscode from "vscode";
import { defaultClipboard } from "./clipboard";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { RemoveClipboardHistory } from "./commads/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";
import { ClipboardCompletion } from "./completion";
import { ClipboardManager } from "./manager";
import { ClipboardTreeDataProvider } from "./tree/history";

let manager: ClipboardManager;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Check the clipboard is working
  try {
    await defaultClipboard.readText(); // Read test
  } catch (error) {
    console.log(error);
    if (error.message) {
      vscode.window.showErrorMessage(error.message);
    } else {
      vscode.window.showErrorMessage(
        "Failed to read value from clipboard, check the console log"
      );
    }
    // Disable clipboard listening
    defaultClipboard.dispose();
    return;
  }

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const config = vscode.workspace.getConfiguration("clipboard-manager");

  manager = new ClipboardManager(context, defaultClipboard);
  disposable.push(manager);

  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new HistoryTreeDoubleClickCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));
  disposable.push(new RemoveClipboardHistory(manager));

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
export function deactivate() {
  if (manager) {
    manager.saveClips();
  }
}
