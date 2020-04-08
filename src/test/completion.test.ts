import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  BaseClipboard,
  defaultClipboard,
  getNewDefaultInstance,
} from "../clipboard";
import { commandList } from "../commads/common";
import { Monitor } from "../monitor";
import { sleep } from "../util";
import * as common from "./common";

suiteSetup(async function () {
  if (!(await common.activateExtension())) {
    this.skip();
  }
});

// Defines a Mocha test suite to group tests of similar kind together
suite("Completion Tests", function () {
  let sandbox: sinon.SinonSandbox;

  let externalClipboard: BaseClipboard;
  let monitor: Monitor;

  setup(async function () {
    sandbox = sinon.createSandbox();

    externalClipboard = getNewDefaultInstance();

    monitor = (await vscode.commands.executeCommand(
      commandList.apiGetMonitor
    )) as Monitor;

    monitor.checkInterval = 300;
    monitor.onlyWindowFocused = false;

    // Reset initial value
    await defaultClipboard.writeText("Initial Value");

    // Show sidebar
    common.showSidebar();

    // Clear clipboard history
    common.getExtension()?.exports.manager.clearAll();
    await sleep(500);
  });

  teardown(function () {
    externalClipboard.dispose();

    sandbox.restore();
  });

  test("Completion List", async function () {
    const completion = common.getExtension()?.exports.completion;

    if (!completion) {
      return this.skip();
    }

    this.timeout(60000);

    const provideCompletionItemsSpy = sandbox.spy(
      completion,
      "provideCompletionItems"
    );

    await externalClipboard.writeText("alpha");
    await sleep(monitor.checkInterval + 300);
    await externalClipboard.writeText("beta");
    await sleep(monitor.checkInterval + 300);
    await externalClipboard.writeText("gamma");
    await sleep(monitor.checkInterval + 300);

    const document = await vscode.workspace.openTextDocument({
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nclip",
    });

    const editor = await vscode.window.showTextDocument(document);

    editor.selections = [new vscode.Selection(1, 4, 1, 4)];

    await vscode.commands.executeCommand("editor.action.triggerSuggest");
    await sleep(500);
    assert.ok(provideCompletionItemsSpy.called);

    await vscode.commands.executeCommand("selectNextSuggestion");
    await sleep(500);

    await vscode.commands.executeCommand("selectPrevSuggestion");
    await sleep(500);

    await vscode.commands.executeCommand("acceptSelectedSuggestion");
    await sleep(500);

    assert.ok(!editor.document.getText().includes("clip"));
    assert.ok(editor.document.getText().includes("gamma"));

    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });
});
