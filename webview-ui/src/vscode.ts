import type { HostToWebviewMessage, WebviewToHostMessage } from "./messages";

interface VsCodeApi {
  postMessage(message: WebviewToHostMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

let api: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi {
  if (!api) {
    api = acquireVsCodeApi();
  }
  return api;
}

export function postToHost(message: WebviewToHostMessage): void {
  getVsCodeApi().postMessage(message);
}

export function onHostMessage(
  handler: (message: HostToWebviewMessage) => void
): () => void {
  const listener = (event: MessageEvent<HostToWebviewMessage>) => {
    handler(event.data);
  };
  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}
