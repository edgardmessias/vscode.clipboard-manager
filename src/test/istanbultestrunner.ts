/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";
import * as glob from "glob";
import * as istanbulCoverage from "istanbul-lib-coverage";
import * as istanbulHook from "istanbul-lib-hook";
import * as istanbulInstrument from "istanbul-lib-instrument";
import * as istanbulReport from "istanbul-lib-report";
import * as istanbulSourceMaps from "istanbul-lib-source-maps";
import * as istanbulReports from "istanbul-reports";
import * as Mocha from "mocha";
import * as fs from "original-fs";
import * as paths from "path";

// tslint:disable-next-line:no-var-requires

declare let global: {
  [key: string]: any; // missing index defintion
};

// Linux: prevent a weird NPE when mocha on Linux requires the window size from the TTY
// Since we are not running in a tty environment, we just implementt he method statically
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tty = require("tty");
if (!tty.getWindowSize) {
  tty.getWindowSize = function (): number[] {
    return [80, 75];
  };
}

let mocha = new Mocha({
  ui: "tdd",
  color: true,
});

let testOptions: any;

export function configure(mochaOpts: Mocha.MochaOptions, testOpts: any): void {
  mocha = new Mocha(mochaOpts);
  testOptions = testOpts;
}

function _mkDirIfExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

function _readCoverOptions(testsRoot: string): ITestRunnerOptions | undefined {
  const coverConfigPath = paths.join(testsRoot, testOptions.coverConfig);
  let coverConfig: ITestRunnerOptions | undefined;
  if (fs.existsSync(coverConfigPath)) {
    const configContent = fs.readFileSync(coverConfigPath, {
      encoding: "utf8",
    });
    coverConfig = JSON.parse(configContent);
  }
  return coverConfig;
}

export function run(testsRoot: string, clb: Function): any {
  // Enable source map support
  require("source-map-support").install();

  // Read configuration for the coverage file
  const coverOptions: ITestRunnerOptions | undefined = _readCoverOptions(
    testsRoot
  );
  let coverageRunner: CoverageRunner;
  if (coverOptions && coverOptions.enabled) {
    // Setup coverage pre-test, including post-test hook to report
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    coverageRunner = new CoverageRunner(coverOptions, testsRoot, clb);
    coverageRunner.setupCoverage();
  }

  // Glob test files
  glob("**/**.test.js", { cwd: testsRoot }, function (error, files): any {
    if (error) {
      return clb(error);
    }
    try {
      // Fill into Mocha
      files.forEach(function (f): Mocha {
        return mocha.addFile(paths.join(testsRoot, f));
      });
      // Run the tests
      let failureCount = 0;

      mocha
        .run()
        .on("fail", function (_test, _err): void {
          failureCount++;
        })
        .on("end", function (): void {
          if (coverageRunner) {
            coverageRunner.reportCoverage();
          }
          clb(undefined, failureCount);
        });
    } catch (error) {
      return clb(error);
    }
  });
}
interface ITestRunnerOptions {
  enabled?: boolean;
  relativeCoverageDir: string;
  relativeSourcePath: string;
  ignorePatterns: string[];
  includePid?: boolean;
  reports?: string[];
  verbose?: boolean;
}

class CoverageRunner {
  private coverageVar: string = "$$cov_" + new Date().getTime() + "$$";
  private transformer!: istanbulHook.Transformer;
  private matchFn: any = undefined;
  private instrumenter!: istanbulInstrument.Instrumenter;
  private unhookRequire!: Function;

  constructor(
    private options: ITestRunnerOptions,
    private testsRoot: string,
    private endRunCallback: Function
  ) {
    if (!options.relativeSourcePath) {
      return this.endRunCallback(
        "Error - relativeSourcePath must be defined for code coverage to work"
      );
    }
  }

  public setupCoverage(): void {
    // Set up Code Coverage, hooking require so that instrumented code is returned
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.instrumenter = istanbulInstrument.createInstrumenter({
      coverageVariable: self.coverageVar,
    });
    const sourceRoot = paths.join(
      self.testsRoot,
      self.options.relativeSourcePath
    );

    // Glob source files
    const srcFiles = glob.sync("**/**.js", {
      ignore: self.options.ignorePatterns,
      cwd: sourceRoot,
    });

    // Create a match function - taken from the run-with-cover.js in istanbul.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const decache = require("decache");
    const fileMap: { [key: string]: any } = {};
    srcFiles.forEach(file => {
      const fullPath = paths.join(sourceRoot, file);
      fileMap[fullPath] = true;

      // On Windows, extension is loaded pre-test hooks and this mean we lose
      // our chance to hook the Require call. In order to instrument the code
      // we have to decache the JS file so on next load it gets instrumented.
      // This doesn't impact tests, but is a concern if we had some integration
      // tests that relied on VSCode accessing our module since there could be
      // some shared global state that we lose.
      decache(fullPath);
    });

    self.matchFn = function (file: string): boolean {
      return fileMap[file];
    };
    self.matchFn.files = Object.keys(fileMap);

    // Hook up to the Require function so that when this is called, if any of our source files
    // are required, the instrumented version is pulled in instead. These instrumented versions
    // write to a global coverage variable with hit counts whenever they are accessed
    self.transformer = (code, options) =>
      self.instrumenter!.instrumentSync(code, options.filename);
    const hookOpts = { verbose: false, extensions: [".js"] };
    self.unhookRequire = istanbulHook.hookRequire(
      self.matchFn,
      self.transformer,
      hookOpts
    );

    // initialize the global variable to stop mocha from complaining about leaks
    global[self.coverageVar] = {};
  }

  /**
   * Writes a coverage report. Note that as this is called in the process exit callback, all calls must be synchronous.
   *
   * @returns {void}
   *
   * @memberOf CoverageRunner
   */
  public async reportCoverage(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.unhookRequire();
    let cov: any;
    if (
      typeof global[self.coverageVar] === "undefined" ||
      Object.keys(global[self.coverageVar]).length === 0
    ) {
      console.error(
        "No coverage information was collected, exit without writing coverage information"
      );
      return;
    } else {
      cov = global[self.coverageVar];
    }

    const map = istanbulCoverage.createCoverageMap();
    const mapStore = istanbulSourceMaps.createSourceMapStore();

    for (const file of self.matchFn.files) {
      // TODO consider putting this under a conditional flag
      // Files that are not touched by code ran by the test runner is manually instrumented, to
      // illustrate the missing coverage.
      if (!cov[file]) {
        const code = fs.readFileSync(file, { encoding: "utf8" });
        self.instrumenter!.instrumentSync(code, file);
        cov[file] = self.instrumenter!.lastFileCoverage();
      }

      mapStore.registerURL(file, `${file}.map`); // Load sourceMap
      map.addFileCoverage(cov[file]);
    }

    // TODO Allow config of reporting directory with
    const reportingDir = paths.join(
      self.testsRoot,
      self.options.relativeCoverageDir
    );
    const includePid = self.options.includePid;
    const pidExt = includePid ? "-" + process.pid : "";
    const coverageFile = paths.join(
      reportingDir,
      "coverage" + pidExt + ".json"
    );

    _mkDirIfExists(reportingDir); // yes, do this again since some test runners could clean the dir initially created

    fs.writeFileSync(coverageFile, JSON.stringify(cov), "utf8");

    const tsMap = ((await mapStore.transformCoverage(
      map
    )) as any) as istanbulCoverage.CoverageMap;

    const context = istanbulReport.createContext({
      coverageMap: tsMap,
      dir: reportingDir,
    });

    const reportTypes =
      self.options.reports instanceof Array ? self.options.reports : ["lcov"];

    reportTypes.forEach(reporter =>
      (istanbulReports.create(reporter as any, {
        projectRoot: paths.join(__dirname, "..", ".."),
      }) as any).execute(context)
    );
  }
}
