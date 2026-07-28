import * as IstanbulTestRunner from "./istanbultestrunner";

IstanbulTestRunner.configure(
  {
    ui: "tdd",
    color: true,
    timeout: 60000,
  },
  {
    coverConfig: "../../coverconfig.json",
  }
);

module.exports = IstanbulTestRunner;
