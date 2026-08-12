import { ClipPreviewController } from "../clipPreview";
import * as vscode from "vscode";
import { openClipLocation } from "../commands/openClipLocation";
import { ClipboardManager, IClipboardItem } from "../manager";
import {
  CLIPBOARD_HISTORY_VIEW_ID,
  ClipDetail,
  ClipSummary,
  HostToWebviewMessage,
  WebviewToHostMessage,
} from "./messages";
import {
  browseSavePath,
  getPreviewEnabled,
  getRelativeTimeEnabled,
  getSettingsSnapshot,
  resetSetting,
  setSetting,
  SettingsValidationError,
} from "./settingsService";

function toClipSummary(clip: IClipboardItem): ClipSummary {
  return {
    id: clip.id ?? clip.checksum,
    title: clip.title,
    createdAt: clip.createdAt,
    language: clip.language,
    copyCount: clip.copyCount,
    useCount: clip.useCount,
    hasLocation: Boolean(clip.createdLocation),
  };
}

function toClipDetail(clip: IClipboardItem): ClipDetail {
  return {
    id: clip.id ?? clip.checksum,
    value: clip.value,
  };
}

function filterClipIds(clips: IClipboardItem[], query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return clips.map(clip => clip.id ?? clip.checksum);
  }

  return clips
    .filter(
      clip =>
        clip.title.toLowerCase().includes(normalized) ||
        clip.value.toLowerCase().includes(normalized)
    )
    .map(clip => clip.id ?? clip.checksum);
}

export class ClipboardHistoryWebviewProvider
  implements vscode.WebviewViewProvider, vscode.Disposable
{
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _preview = new ClipPreviewController();
  private _previewEnabled = true;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _manager: ClipboardManager
  ) {
    this._disposables.push(
      this._manager.onDidChangeClipList(() => this.postClipsUpdate())
    );

    this._disposables.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration("clipboard-manager")) {
          this.postConfigUpdate();
          this.postSettingsUpdate();
        }
      })
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "media", "clipboard-history"),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      message => this.handleMessage(message),
      undefined,
      this._disposables
    );

    webviewView.onDidDispose(() => {
      void this._preview.clear();
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "clipboard-history",
        "index.js"
      )
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "media",
        "clipboard-history",
        "index.css"
      )
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private findClip(id: string): IClipboardItem | undefined {
    return this._manager.clips.find(
      clip => clip.id === id || clip.checksum === id
    );
  }

  private postMessage(message: HostToWebviewMessage): void {
    void this._view?.webview.postMessage(message);
  }

  private postClipsUpdate(): void {
    this.postMessage({
      type: "clips/update",
      clips: this._manager.clips.map(toClipSummary),
    });
  }

  private postConfigUpdate(): void {
    this._previewEnabled = getPreviewEnabled();
    this.postMessage({
      type: "config/update",
      preview: this._previewEnabled,
      relativeTime: getRelativeTimeEnabled(),
    });
  }

  private postSettingsUpdate(): void {
    const snapshot = getSettingsSnapshot();
    this.postMessage({
      type: "config/settings",
      hasWorkspace: snapshot.hasWorkspace,
      settings: snapshot.settings,
    });
  }

  private async handleMessage(message: WebviewToHostMessage): Promise<void> {
    switch (message.type) {
      case "ready":
        this.postClipsUpdate();
        this.postConfigUpdate();
        break;

      case "clip/preview": {
        if (!this._previewEnabled) {
          return;
        }
        const previewClip = this.findClip(message.id);
        if (!previewClip) {
          return;
        }
        await this._preview.show(previewClip.value);
        break;
      }

      case "clip/preview/clear":
        await this._preview.clear();
        break;

      case "clip/paste": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        await this._preview.finalizePaste(clip.value, value =>
          this._manager.setClipboardValue(value)
        );
        break;
      }

      case "clip/copy": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        await this._preview.clear();
        await this._manager.setClipboardValue(clip.value);
        break;
      }

      case "clip/remove": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        await this._preview.clear();
        await this._manager.removeClipboardValue(clip.value);
        break;
      }

      case "clip/ban": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        await this._preview.clear();
        await this._manager.banClipboardValue(clip.value);
        void vscode.window.showInformationMessage(
          "Clipboard Manager: clip banned (content hash stored securely)"
        );
        break;
      }

      case "clip/showInFile": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        await this._preview.clear();
        await openClipLocation(clip);
        break;
      }

      case "clip/requestDetail": {
        const clip = this.findClip(message.id);
        if (!clip) {
          return;
        }
        this.postMessage({ type: "clip/detail", clip: toClipDetail(clip) });
        break;
      }

      case "clips/filter":
        this.postMessage({
          type: "clips/filterResult",
          query: message.query,
          ids: filterClipIds(this._manager.clips, message.query),
        });
        break;

      case "history/clear": {
        const yes = "Yes";
        const response = await vscode.window.showWarningMessage(
          "Do you really want to clear the history list?",
          { modal: true },
          yes
        );
        if (response === yes) {
          await this._preview.clear();
          await this._manager.clearAll();
        }
        break;
      }

      case "config/request":
        this.postSettingsUpdate();
        break;

      case "config/set":
        try {
          await setSetting(message.key, message.value, message.target);
          this.postSettingsUpdate();
        } catch (error) {
          const text =
            error instanceof SettingsValidationError
              ? error.message
              : "Failed to update setting";
          void vscode.window.showErrorMessage(text);
        }
        break;

      case "config/reset":
        try {
          await resetSetting(message.key, message.target);
          this.postSettingsUpdate();
        } catch (error) {
          const text =
            error instanceof SettingsValidationError
              ? error.message
              : "Failed to reset setting";
          void vscode.window.showErrorMessage(text);
        }
        break;

      case "config/browseSavePath": {
        const path = await browseSavePath();
        if (!path) {
          break;
        }
        try {
          await setSetting("saveTo", path, "global");
          this.postSettingsUpdate();
        } catch (error) {
          const text =
            error instanceof SettingsValidationError
              ? error.message
              : "Failed to update save location";
          void vscode.window.showErrorMessage(text);
        }
        break;
      }
    }
  }

  public dispose(): void {
    void this._preview.clear();
    this._disposables.forEach(d => d.dispose());
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export { CLIPBOARD_HISTORY_VIEW_ID };
