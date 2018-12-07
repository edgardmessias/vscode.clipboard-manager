import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import {
  getNewDefaultInstance,
  IClipboard,
  IClipboardTextChange
} from "../clipboard";
import { sleep } from "../util";
import { activateExtension } from "./common";

suiteSetup(async function() {
  if (!(await activateExtension())) {
    this.skip();
  }
});

// Defines a Mocha test suite to group tests of similar kind together
suite("Clipboard Tests", function() {
  let sandbox: sinon.SinonSandbox;
  let onDidChangeWindowState: sinon.SinonStub;

  let externalClipboard: IClipboard;
  let clipboard: IClipboard;

  // Emulate windows focus events
  async function setWindowsFocus(focused: boolean) {
    const focusFunction = onDidChangeWindowState.firstCall.args[0];
    const focusObj = onDidChangeWindowState.firstCall.args[1];
    await focusFunction.call(focusObj, { focused });
  }

  setup(async function() {
    sandbox = sinon.createSandbox();

    externalClipboard = getNewDefaultInstance();
    externalClipboard.checkInterval = 0;

    onDidChangeWindowState = sandbox.stub(
      vscode.window,
      "onDidChangeWindowState"
    );

    clipboard = getNewDefaultInstance();
    clipboard.checkInterval = 500;

    await setWindowsFocus(true);

    await clipboard.writeText("Initial Value");
  });

  teardown(function() {
    externalClipboard.dispose();
    clipboard.dispose();

    sandbox.restore();
  });

  test("Read clipboard", async function() {
    const clip = await clipboard.readText();

    assert.ok(clip === "Initial Value");
  });

  test("Read/Write Clipboard", async function() {
    await clipboard.writeText("test");

    const actual = await clipboard.readText();

    assert.equal(actual, "test");
  });

  test("Check changes interval", async function() {
    const readTextSpy = sandbox.spy(clipboard, "readText");

    clipboard.checkInterval = 1000;
    const initialCount = readTextSpy.callCount;

    await sleep(500);
    assert.equal(readTextSpy.callCount, initialCount);

    await sleep(600); // after 1100ms
    assert.equal(readTextSpy.callCount, initialCount + 1);

    await sleep(clipboard.checkInterval);
    assert.equal(readTextSpy.callCount, initialCount + 2);
  });

  test("Check changes content", async function() {
    const onDidChangeTextSpy = sandbox.spy();

    clipboard.onDidChangeText(onDidChangeTextSpy);

    clipboard.checkInterval = 100; // Reset setInterval

    await externalClipboard.writeText("new value");
    await sleep(clipboard.checkInterval + 100);

    assert.equal(onDidChangeTextSpy.callCount, 1);
  });

  test("Check changes external", async function() {
    const onDidChangeTextSpy = sandbox.spy();

    clipboard.onDidChangeText(onDidChangeTextSpy);
    clipboard.checkInterval = 100; // Reset setInterval

    await externalClipboard.writeText("new value");
    await sleep(clipboard.checkInterval + 100);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    // Not emit the event when window is not focused
    await setWindowsFocus(false);
    await externalClipboard.writeText("external change");
    await sleep(clipboard.checkInterval + 100);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    // Not emit the event when window regains focus
    await setWindowsFocus(true);
    await sleep(clipboard.checkInterval + 100);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    await externalClipboard.writeText("internal change");
    await sleep(clipboard.checkInterval + 100);
    assert.equal(onDidChangeTextSpy.callCount, 2);
  });

  test("Editor Position", async function() {
    const onDidChangeTextSpy = sandbox.spy();
    clipboard.onDidChangeText(onDidChangeTextSpy);

    const document = await vscode.workspace.openTextDocument({
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    });

    const editor = await vscode.window.showTextDocument(document);

    editor.selections = [new vscode.Selection(0, 0, 0, 11)];

    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");

    await sleep(clipboard.checkInterval + 100);

    // Check clipboard content
    const current = await clipboard.readText();
    assert.equal(current, "Lorem ipsum");

    // Check clipboard event
    assert.equal(onDidChangeTextSpy.called, true);

    const firstCall = onDidChangeTextSpy.firstCall
      .args[0] as IClipboardTextChange;

    assert.equal(firstCall.value, "Lorem ipsum");
    assert.ok(firstCall.language);
    assert.ok(firstCall.location);

    const location: vscode.Location = firstCall.location as vscode.Location;
    const range: vscode.Range = location.range as vscode.Range;

    assert.equal(range.start.line, 0);
    assert.equal(range.start.character, 0);
    assert.equal(range.end.line, 0);
    assert.equal(range.end.character, 11);
  });
});
