import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts", "src/presets/typescript/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  shims: false,
  // Exclude devDependencies that have native bindings from bundling
  noExternal: [],
  skipNodeModulesBundle: true,
});
