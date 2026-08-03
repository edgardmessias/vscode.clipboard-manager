import { glob } from "glob";
import Mocha from "mocha";
import * as path from "path";

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 60000,
  });

  const testsRoot = path.resolve(__dirname, ".");

  return glob("**/*.test.js", { cwd: testsRoot, ignore: ["unit/**"] }).then(
    files => {
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      return new Promise<void>((resolve, reject) => {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      });
    }
  );
}
