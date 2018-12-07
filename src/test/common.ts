import * as vscode from "vscode";

export async function activateExtension() {
  const ext = vscode.extensions.getExtension("EdgardMessias.clipboard-manager");

  if (!ext) {
    return false;
  }

  if (!ext.isActive) {
    await ext.activate();
  }

  return ext.isActive;
}
