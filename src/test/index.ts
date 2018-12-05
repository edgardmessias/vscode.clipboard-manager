//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.

import * as IstanbulTestRunner from "./istanbultestrunner";

const testRunner = IstanbulTestRunner;

const mochaOpts: Mocha.MochaOptions = {
  ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
  useColors: true // colored output from test results,
};

// Enable appveyor reporter if exists
try {
  require.resolve("mocha-appveyor-reporter");
  mochaOpts.reporter = "mocha-appveyor-reporter";
  // tslint:disable-next-line:no-empty
} catch (error) {}

testRunner.configure(
  mochaOpts,
  // Coverage configuration options
  {
    coverConfig: "../../coverconfig.json"
  }
);

module.exports = testRunner;
