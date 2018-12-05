import * as assert from "assert";
import * as vscode from "vscode";

export async function activateExtension() {
  const ext = vscode.extensions.getExtension(
    "EdgardMessias.clipboard-manager"
  ) as vscode.Extension<any>;

  assert.ok(ext);

  if (!ext.isActive) {
    await ext.activate();
  }

  assert.equal(ext.isActive, true);
}
