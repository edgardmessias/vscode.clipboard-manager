import * as assert from "assert";
import * as sinon from "sinon";
import { BaseClipboard, getNewDefaultInstance } from "../clipboard";
import { activateExtension } from "./common";

suiteSetup(async function () {
  if (!(await activateExtension())) {
    this.skip();
  }
});

// Defines a Mocha test suite to group tests of similar kind together
suite("Clipboard Tests", function () {
  let sandbox: sinon.SinonSandbox;

  let clipboard: BaseClipboard;

  setup(async function () {
    sandbox = sinon.createSandbox();

    clipboard = getNewDefaultInstance();

    await clipboard.writeText("Initial Value");
  });

  teardown(function () {
    clipboard.dispose();

    sandbox.restore();
  });

  test("Read clipboard", async function () {
    const clip = await clipboard.readText();

    assert.ok(clip === "Initial Value");
  });

  test("Read/Write Clipboard", async function () {
    await clipboard.writeText("test");

    const actual = await clipboard.readText();

    assert.equal(actual, "test");
  });
});
