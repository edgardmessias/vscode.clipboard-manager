//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.

import * as IstanbulTestRunner from "./istanbultestrunner";

const testRunner = IstanbulTestRunner;

const reporter = process.env.MOCHA_REPORTER || "spec";

const mochaOpts: Mocha.MochaOptions = {
  ui: "tdd", // the TDD UI is being used in extension.test.ts (suite, test, etc.)
  color: true, // colored output from test results,
  timeout: 10000, // default timeout: 10 seconds
  retries: 1,
  reporter: "mocha-multi-reporters",
  reporterOptions: {
    reporterEnabled: reporter,
  },
};

testRunner.configure(
  mochaOpts,
  // Coverage configuration options
  {
    coverConfig: "../../coverconfig.json",
  }
);

module.exports = testRunner;
