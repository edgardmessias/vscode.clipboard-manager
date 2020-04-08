import * as vscode from "vscode";
import { ClipboardCompletion } from "../completion";
import { ClipboardManager } from "../manager";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../../package.json");

const EXTENSION_ID = `${pkg.publisher}.${pkg.name}`;

interface ExtensionAPI {
  completion: ClipboardCompletion;
  manager: ClipboardManager;
}

export function getExtension() {
  return vscode.extensions.getExtension<ExtensionAPI>(EXTENSION_ID);
}

export async function activateExtension() {
  const ext = getExtension();

  if (!ext) {
    return false;
  }

  if (!ext.isActive) {
    await ext.activate();
  }

  return ext.isActive;
}

export async function showSidebar() {
  try {
    await vscode.commands.executeCommand(
      "workbench.view.extension.clipboard-manager"
    );
    // tslint:disable-next-line:no-empty
  } catch (error) {}
}
