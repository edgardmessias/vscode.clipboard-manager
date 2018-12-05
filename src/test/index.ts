//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.

import * as IstanbulTestRunner from "./istanbultestrunner";

const testRunner = IstanbulTestRunner;

testRunner.configure(
  // Mocha Options
  {
    ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
    useColors: true // colored output from test results
  },
  // Coverage configuration options
  {
    coverConfig: "../../coverconfig.json"
  }
);

module.exports = testRunner;
