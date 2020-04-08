import * as assert from "assert";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { BaseClipboard, getNewDefaultInstance } from "../clipboard";
import { IClipboardTextChange, Monitor } from "../monitor";
import { sleep } from "../util";
import { activateExtension } from "./common";

suiteSetup(async function () {
  if (!(await activateExtension())) {
    this.skip();
  }
});

// Defines a Mocha test suite to group tests of similar kind together
suite("Monitor Tests", function () {
  let sandbox: sinon.SinonSandbox;
  let onDidChangeWindowState: sinon.SinonStub<any[] | any, any>;

  let disposables: vscode.Disposable[] = [];
  let externalClipboard: BaseClipboard;
  let clipboard: BaseClipboard;
  let monitor: Monitor;

  // Emulate windows focus events
  async function setWindowsFocus(focused: boolean) {
    for (const call of onDidChangeWindowState.getCalls()) {
      const focusFunction = call.args[0];
      const focusObj = call.args[1];
      await focusFunction.call(focusObj, { focused });
    }
  }

  setup(async function () {
    sandbox = sinon.createSandbox();

    // Stubs
    onDidChangeWindowState = sandbox.stub(
      vscode.window,
      "onDidChangeWindowState"
    );

    // Inits
    disposables = [];

    externalClipboard = getNewDefaultInstance();

    clipboard = getNewDefaultInstance();

    monitor = new Monitor(clipboard);

    monitor.checkInterval = 300;
    monitor.onlyWindowFocused = true;

    disposables.push(externalClipboard, clipboard, monitor);

    await clipboard.writeText("Initial Value");

    await setWindowsFocus(true);
  });

  teardown(function () {
    disposables.forEach(d => d.dispose());

    sandbox.restore();
  });

  test("Check changes interval", async function () {
    const readTextSpy = sandbox.spy(monitor.clipboard, "readText");

    monitor.checkInterval = 1000;
    const initialCount = readTextSpy.callCount;

    await sleep(500);
    assert.equal(readTextSpy.callCount, initialCount);

    await sleep(600); // after 1100ms
    assert.equal(readTextSpy.callCount, initialCount + 1);

    await sleep(monitor.checkInterval);
    assert.equal(readTextSpy.callCount, initialCount + 2);
  });

  test("Check changes content", async function () {
    const onDidChangeTextSpy = sandbox.spy();

    disposables.push(monitor.onDidChangeText(onDidChangeTextSpy));
    monitor.checkInterval = 200; // Reset setInterval

    await externalClipboard.writeText("new value");
    await sleep(monitor.checkInterval + 300);

    assert.equal(onDidChangeTextSpy.callCount, 1);
  });

  test("Check changes external", async function () {
    const onDidChangeTextSpy = sandbox.spy();

    disposables.push(monitor.onDidChangeText(onDidChangeTextSpy));
    monitor.checkInterval = 200; // Reset setInterval

    await externalClipboard.writeText("new value");
    await sleep(monitor.checkInterval + 300);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    // Not emit the event when window is not focused
    await setWindowsFocus(false);
    await externalClipboard.writeText("external change");
    await sleep(monitor.checkInterval + 300);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    // Not emit the event when window regains focus
    await setWindowsFocus(true);
    await sleep(monitor.checkInterval + 300);
    assert.equal(onDidChangeTextSpy.callCount, 1);

    await externalClipboard.writeText("internal change");
    await sleep(monitor.checkInterval + 300);
    assert.equal(onDidChangeTextSpy.callCount, 2);
  });

  test("Editor Position", async function () {
    const onDidChangeTextSpy = sandbox.spy();
    disposables.push(monitor.onDidChangeText(onDidChangeTextSpy));

    const document = await vscode.workspace.openTextDocument({
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    });

    const editor = await vscode.window.showTextDocument(document);

    editor.selections = [new vscode.Selection(0, 0, 0, 11)];

    await vscode.commands.executeCommand("editor.action.clipboardCopyAction");

    await sleep(monitor.checkInterval + 300);

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
