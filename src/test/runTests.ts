import * as os from "os";
import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, ".");

  // macOS limits Unix socket paths to ~103 chars; CI workspace paths are too long.
  const testDataDir = path.join(os.tmpdir(), "vscode-clipboard-manager-test");
  const extensionsDir = path.join(os.tmpdir(), "vscode-clipboard-manager-ext");

  try {
    await runTests({
      version: process.env.CODE_VERSION,
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        "--disable-extensions",
        `--user-data-dir=${testDataDir}`,
        `--extensions-dir=${extensionsDir}`,
      ],
    });
  } catch (error) {
    console.error("Failed to run tests");
    console.error(error);
    process.exit(1);
  }
}

main();
