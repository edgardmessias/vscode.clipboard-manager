import * as path from "path";
import { downloadAndUnzipVSCode, runTests } from "vscode-test";

async function go() {
  if (process.argv.includes("--download-only")) {
    await downloadAndUnzipVSCode(process.env.CODE_VERSION);
    return;
  }

  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  let extensionTestsPath = path.resolve(__dirname, "../../out/test");

  if (process.env.CODE_TESTS_PATH) {
    extensionTestsPath = process.env.CODE_TESTS_PATH;
  }

  /**
   * Basic usage
   */
  try {
    await runTests({
      version: process.env.CODE_VERSION,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ["--disable-extensions"],
    });
  } catch (err) {
    console.error("Failed to run tests");
    console.error(err);
    process.exit(1);
  }
}

go();
