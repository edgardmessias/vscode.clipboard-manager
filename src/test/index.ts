import * as path from "path";
import { glob } from "glob";
import Mocha from "mocha";

type TestCallback = (error?: Error, failures?: number) => void;

const mocha = new Mocha({
  ui: "tdd",
  color: true,
  timeout: 60000,
});

export function run(testsRoot: string, callback: TestCallback): void {
  glob
    .glob("**/*.test.js", { cwd: testsRoot, ignore: ["unit/**"] })
    .then(files => {
      files.forEach(file => mocha.addFile(path.join(testsRoot, file)));

      let failureCount = 0;

      mocha
        .run()
        .on("fail", () => {
          failureCount++;
        })
        .on("end", () => {
          callback(undefined, failureCount);
        });
    })
    .catch(error => {
      callback(error);
    });
}

module.exports = { run };
