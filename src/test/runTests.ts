import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, ".");

  try {
    await runTests({
      version: process.env.CODE_VERSION,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: ["--disable-extensions"],
    });
  } catch (error) {
    console.error("Failed to run tests");
    console.error(error);
    process.exit(1);
  }
}

main();
