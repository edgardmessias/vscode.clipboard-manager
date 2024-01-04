import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { ClipboardManager } from "../manager";
import { ShowClipboardHistory } from "../commads/showClipboardHistory";
import { activateExtension, getExtension } from "./common";

suite("Show Clipboard History Tests", function () {
  let sandbox: sinon.SinonSandbox;
  let clipboardManager: ClipboardManager | undefined;
  let showClipboardHistory: ShowClipboardHistory;

  suiteSetup(async function () {
    if (!(await activateExtension())) {
      this.skip();
    }
  });

  setup(function () {
    sandbox = sinon.createSandbox();
    clipboardManager = getExtension()?.exports.manager;
    if(clipboardManager) {
      showClipboardHistory = new ShowClipboardHistory(clipboardManager);
    }
  });

  teardown(function () {
    sandbox.restore();
    showClipboardHistory.dispose();
  });

  test("Show Clipboard History Command Execution", async function () {
    const showTextDocumentStub = sandbox.stub(vscode.window, "showTextDocument");
    const openTextDocumentStub = sandbox.stub(vscode.workspace, "openTextDocument");

    await vscode.commands.executeCommand("clipboard-manager.history.show-buffer");

    assert.ok(openTextDocumentStub.calledOnce, "openTextDocument should be called once");
    assert.ok(showTextDocumentStub.calledOnce, "showTextDocument should be called once");
  });
});