import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/extension.ts",
  format: "cjs",
  platform: "node",
  target: "node18",
  outDir: "out",
  clean: true,
  sourcemap: true,
  dts: false,
  deps: {
    neverBundle: ["vscode"],
  },
});