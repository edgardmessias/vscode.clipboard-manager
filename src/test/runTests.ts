import * as fs from "fs";
import * as path from "path";
import { downloadAndUnzipVSCode, runTests } from "vscode-test";

async function go() {
  if (process.argv.includes("--download-only")) {
    await downloadAndUnzipVSCode(process.env.CODE_VERSION);
    return;
  }

  const extensionPath = path.resolve(__dirname, "../../");

  let testRunnerPath;
  if (process.env.CODE_TESTS_PATH) {
    testRunnerPath = process.env.CODE_TESTS_PATH;
  } else if (fs.existsSync(path.join(process.cwd(), "out", "test"))) {
    testRunnerPath = path.join(process.cwd(), "out", "test"); // TS extension
  } else {
    testRunnerPath = path.join(process.cwd(), "test"); // JS extension
  }

  const testWorkspace = process.env.CODE_TESTS_WORKSPACE || testRunnerPath;

  /**
   * Basic usage
   */
  await runTests({
    version: process.env.CODE_VERSION,
    extensionPath,
    testRunnerPath,
    testWorkspace
  });
}

go();
