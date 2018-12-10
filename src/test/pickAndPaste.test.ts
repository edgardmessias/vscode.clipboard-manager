import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  defaultClipboard,
  getNewDefaultInstance,
  IClipboard
} from "../clipboard";
import { commandList } from "../commads/common";
import { sleep } from "../util";
import * as common from "./common";

suiteSetup(async function() {
  if (!(await common.activateExtension())) {
    this.skip();
  }
});

// Defines a Mocha test suite to group tests of similar kind together
suite("Pick and Paste Tests", function() {
  let sandbox: sinon.SinonSandbox;
  let showQuickPickStub: sinon.SinonStub;

  let externalClipboard: IClipboard;
  let editor: vscode.TextEditor;

  setup(async function() {
    sandbox = sinon.createSandbox();

    showQuickPickStub = sandbox.stub(vscode.window, "showQuickPick");

    externalClipboard = getNewDefaultInstance();
    externalClipboard.checkInterval = 0;

    defaultClipboard.checkInterval = 300;
    defaultClipboard.onlyWindowFocused = false;

    // Reset initial value
    await defaultClipboard.writeText("Initial Value");

    // Show sidebar
    common.showSidebar();

    // Clear clipboard history
    await vscode.commands.executeCommand(commandList.clearClipboardHistory);
    await sleep(500);

    await externalClipboard.writeText("alpha");
    await sleep(defaultClipboard.checkInterval + 300);
    await externalClipboard.writeText("beta");
    await sleep(defaultClipboard.checkInterval + 300);
    await externalClipboard.writeText("gamma");
    await sleep(defaultClipboard.checkInterval + 300);

    const document = await vscode.workspace.openTextDocument({
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nclip"
    });

    editor = await vscode.window.showTextDocument(document);

    editor.selections = [new vscode.Selection(1, 0, 1, 4)];
  });

  teardown(async function() {
    externalClipboard.dispose();

    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

    sandbox.restore();
  });

  test("Select with preview", async function() {
    this.timeout(60000);

    showQuickPickStub.callsFake(
      async (
        picks: vscode.QuickPickItem[],
        options: vscode.QuickPickOptions
      ) => {
        if (options.onDidSelectItem) {
          options.onDidSelectItem(picks[0]);
          await sleep(100);
          options.onDidSelectItem(picks[1]);
          await sleep(100);
          options.onDidSelectItem(picks[2]);
          await sleep(100);
          options.onDidSelectItem(picks[0]);
          await sleep(100);
        }
        return picks[0];
      }
    );

    assert.ok(!showQuickPickStub.called);

    await vscode.commands.executeCommand(commandList.pickAndPaste);

    assert.ok(showQuickPickStub.called);

    await sleep(100);

    assert.ok(!editor.document.getText().includes("clip"));
    assert.ok(editor.document.getText().includes("gamma"));
  });

  test("Select without preview", async function() {
    this.timeout(60000);

    showQuickPickStub.callsFake(
      async (
        picks: vscode.QuickPickItem[],
        options: vscode.QuickPickOptions
      ) => {
        return picks[0];
      }
    );

    assert.ok(!showQuickPickStub.called);

    await vscode.commands.executeCommand(commandList.pickAndPaste);

    assert.ok(showQuickPickStub.called);

    await sleep(100);

    assert.ok(!editor.document.getText().includes("clip"));
    assert.ok(editor.document.getText().includes("gamma"));
  });

  test("Cancel with preview", async function() {
    this.timeout(60000);

    showQuickPickStub.callsFake(
      async (
        picks: vscode.QuickPickItem[],
        options: vscode.QuickPickOptions
      ) => {
        if (options.onDidSelectItem) {
          options.onDidSelectItem(picks[0]);
          await sleep(100);
          options.onDidSelectItem(picks[1]);
          await sleep(100);
          options.onDidSelectItem(picks[2]);
          await sleep(100);
          options.onDidSelectItem(picks[0]);
          await sleep(100);
        }
        return undefined;
      }
    );

    assert.ok(!showQuickPickStub.called);

    await vscode.commands.executeCommand(commandList.pickAndPaste);

    assert.ok(showQuickPickStub.called);

    await sleep(100);

    assert.ok(editor.document.getText().includes("clip"));
    assert.ok(!editor.document.getText().includes("alpha"));
    assert.ok(!editor.document.getText().includes("beta"));
    assert.ok(!editor.document.getText().includes("gamma"));
  });

  test("Cancel without preview", async function() {
    this.timeout(60000);

    showQuickPickStub.callsFake(
      async (
        picks: vscode.QuickPickItem[],
        options: vscode.QuickPickOptions
      ) => {
        return undefined;
      }
    );

    assert.ok(!showQuickPickStub.called);

    await vscode.commands.executeCommand(commandList.pickAndPaste);

    assert.ok(showQuickPickStub.called);

    await sleep(100);

    assert.ok(editor.document.getText().includes("clip"));
    assert.ok(!editor.document.getText().includes("alpha"));
    assert.ok(!editor.document.getText().includes("beta"));
    assert.ok(!editor.document.getText().includes("gamma"));
  });
});
