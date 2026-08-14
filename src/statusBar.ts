import * as vscode from "vscode";
import { commandList } from "./commands/common";
import { ClipboardManager } from "./manager";
import { Monitor } from "./monitor";
import { formatStatusBarText, formatStatusBarTooltip } from "./statusBarText";
import { CLIPBOARD_HISTORY_VIEW_ID } from "./webview/clipboardHistoryProvider";

export { formatStatusBarText, formatStatusBarTooltip } from "./statusBarText";

export class ClipboardStatusBar implements vscode.Disposable {
  private readonly _item: vscode.StatusBarItem;
  private readonly _disposables: vscode.Disposable[] = [];
  private _enabled = true;

  constructor(
    private readonly _manager: ClipboardManager,
    private readonly _monitor: Monitor
  ) {
    this._item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this._item.command = commandList.statusBarClick;
    this._disposables.push(this._item);

    this._disposables.push(
      vscode.commands.registerCommand(
        commandList.statusBarClick,
        this.onClick,
        this
      )
    );

    this._disposables.push(
      this._manager.onDidChangeClipList(() => this.refresh())
    );

    this.applyConfig();
    this.refresh();
  }

  public applyConfig() {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    this._enabled = config.get<boolean>("statusBar.enabled", true);
    this.refresh();
  }

  public refresh() {
    if (!this._enabled) {
      this._item.hide();
      return;
    }

    const clipCount = this._manager.clips.length;
    const captureEnabled = this._monitor.captureEnabled;

    this._item.text = formatStatusBarText(clipCount, captureEnabled);
    this._item.tooltip = formatStatusBarTooltip(clipCount, captureEnabled);
    this._item.show();
  }

  protected async onClick() {
    const config = vscode.workspace.getConfiguration("clipboard-manager");
    const pinnedToTop = config.get<boolean>("ui.pinnedToTop", true);

    const openHistory = {
      label: "$(list-flat) Open Clipboard History",
      action: "open" as const,
    };
    const toggleCapture = {
      label: this._monitor.captureEnabled
        ? "$(debug-pause) Pause Capture"
        : "$(play) Resume Capture",
      action: "toggle" as const,
    };
    const togglePinnedToTop = {
      label: pinnedToTop
        ? "$(pin) Pinned in Normal Order"
        : "$(pin) Pinned at Top",
      action: "togglePinnedToTop" as const,
    };
    const clearHistory = {
      label: "$(clear-all) Clear History…",
      action: "clear" as const,
    };

    const picked = await vscode.window.showQuickPick(
      [openHistory, toggleCapture, togglePinnedToTop, clearHistory],
      { placeHolder: "Clipboard Manager" }
    );

    if (!picked) {
      return;
    }

    switch (picked.action) {
      case "open":
        await vscode.commands.executeCommand(
          `${CLIPBOARD_HISTORY_VIEW_ID}.focus`
        );
        break;
      case "toggle":
        await vscode.commands.executeCommand(commandList.toggleCapture);
        this.refresh();
        break;
      case "togglePinnedToTop":
        await vscode.commands.executeCommand(commandList.togglePinnedToTop);
        break;
      case "clear":
        await vscode.commands.executeCommand(commandList.clearClipboardHistory);
        break;
    }
  }

  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
