export enum commandList {
  apiGetMonitor = "clipboard-manager.api.getMonitor",
  clearClipboardHistory = "clipboard-manager.history.clear",
  clearUnpinnedHistory = "clipboard-manager.history.clearUnpinned",
  copyToHistory = "clipboard-manager.editor.copyToHistory",
  pickAndPaste = "clipboard-manager.editor.pickAndPaste",
  removeClipboardHistory = "clipboard-manager.history.remove",
  setClipboardValue = "clipboard-manager.setClipboardValue",
  showClipboardInFile = "clipboard-manager.editor.showClipboardInFile",
  statusBarClick = "clipboard-manager.statusBar.click",
  toggleCapture = "clipboard-manager.capture.toggle",
  clearBannedClips = "clipboard-manager.ban.clearAll",
  unbanLastClip = "clipboard-manager.ban.unbanLast",
}
