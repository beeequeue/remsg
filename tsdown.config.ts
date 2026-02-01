import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  unbundle: true,
  inlineOnly: ["murmur-hash"],

  env: { TEST: false },

  platform: "node",
  format: "esm",
  dts: true,
  fixedExtension: true,
})
