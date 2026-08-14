"use strict";
import * as vscode from "vscode";
import { defaultClipboard } from "./clipboard";
import { ApiGetMonitor } from "./commands/apiGetMonitor";
import { ClearBannedClipsCommand } from "./commands/clearBannedClips";
import { ClearClipboardHistory } from "./commands/clearClipboardHistory";
import { ClearUnpinnedHistory } from "./commands/clearUnpinnedHistory";
import { CopyToHistoryCommand } from "./commands/copyToHistory";
import { PickAndPasteCommand } from "./commands/pickAndPaste";
import { RemoveClipboardHistory } from "./commands/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commands/setClipboardValue";
import { ShowClipboardInFile } from "./commands/showClipboardInFile";
import { ToggleCaptureCommand } from "./commands/toggleCapture";
import { TogglePinnedToTopCommand } from "./commands/togglePinnedToTop";
import { UnbanLastClipCommand } from "./commands/unbanLastClip";
import { ClipboardCompletion } from "./completion";
import { normalizeExcludePatterns } from "./excludePatterns";
import { ClipboardManager } from "./manager";
import { Monitor } from "./monitor";
import { ClipboardStatusBar } from "./statusBar";
import {
  ClipboardHistoryWebviewProvider,
  CLIPBOARD_HISTORY_VIEW_ID,
} from "./webview/clipboardHistoryProvider";

let manager: ClipboardManager;

export async function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  try {
    await defaultClipboard.readText();
  } catch (error: any) {
    console.log(error);
    setTimeout(() => {
      if (error.message) {
        vscode.window.showErrorMessage(error.message);
      } else {
        vscode.window.showErrorMessage(
          "Failed to read value from clipboard, check the console log"
        );
      }
    }, 2000);
    defaultClipboard.dispose();
    return;
  }

  disposable.push(defaultClipboard);

  const monitor = new Monitor(defaultClipboard);
  disposable.push(monitor);

  manager = new ClipboardManager(context, monitor);
  disposable.push(manager);

  disposable.push(new ApiGetMonitor(monitor));
  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));
  disposable.push(new RemoveClipboardHistory(manager));
  disposable.push(new ShowClipboardInFile(manager));
  disposable.push(new ClearClipboardHistory(manager));
  disposable.push(new ClearUnpinnedHistory(manager));
  disposable.push(new ClearBannedClipsCommand(manager.banList));
  disposable.push(new UnbanLastClipCommand(manager.banList));
  disposable.push(new CopyToHistoryCommand(monitor));
  disposable.push(new ToggleCaptureCommand(monitor));
  disposable.push(new TogglePinnedToTopCommand());

  const statusBar = new ClipboardStatusBar(manager, monitor);
  disposable.push(statusBar);

  const completion = new ClipboardCompletion(manager);
  disposable.push(completion);

  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "file" },
      completion
    )
  );

  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "untitled" },
      completion
    )
  );

  const historyProvider = new ClipboardHistoryWebviewProvider(
    context.extensionUri,
    manager
  );
  disposable.push(historyProvider);

  disposable.push(
    vscode.window.registerWebviewViewProvider(
      CLIPBOARD_HISTORY_VIEW_ID,
      historyProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  const updateConfig = () => {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    monitor.checkInterval = config.get("checkInterval", 500);
    monitor.onlyWindowFocused = config.get("onlyWindowFocused", true);
    monitor.maxClipboardSize = config.get("maxClipboardSize", 1000000);
    monitor.captureEnabled = config.get("capture.enabled", true);
    monitor.setExcludeFilePatterns(
      normalizeExcludePatterns(config.get("exclude.filePatterns"))
    );
    statusBar.applyConfig();
  };
  updateConfig();

  disposable.push(
    vscode.workspace.onDidChangeConfiguration(
      e => e.affectsConfiguration("clipboard-manager") && updateConfig()
    )
  );

  context.subscriptions.push(...disposable);

  return {
    completion,
    manager,
  };
}

export async function deactivate() {
  if (manager) {
    await manager.shutdown();
  }
}
