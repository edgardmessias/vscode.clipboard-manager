//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";
import * as vscode from "vscode";
import { activateExtension } from "./common";

suiteSetup(async function () {
  if (!(await activateExtension())) {
    this.skip();
  }
});

suite("Extension Tests", function () {
  test("Active Extension", async function () {
    const ext = vscode.extensions.getExtension(
      "EdgardMessias.clipboard-manager"
    ) as vscode.Extension<any>;

    assert.ok(ext, "Extension not found");

    assert.equal(ext.isActive, true, "Extension not activated");
  });
});
