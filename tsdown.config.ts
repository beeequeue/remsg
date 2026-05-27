import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  unbundle: true,
  deps: { onlyBundle: ["murmur-hash"] },
  outputOptions: {
    comments: { jsdoc: false }, // removes jsdoc comments from JS output, keeps them in TS
  },

  env: { TEST: false },

  platform: "node",
  format: "esm",
  dts: { oxc: true },
  fixedExtension: true,
  minify: "dce-only",
})
