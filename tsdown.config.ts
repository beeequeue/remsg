import path from "node:path"

import { defineConfig } from "tsdown"
import type { NodeProtocolPlugin } from "tsdown/plugins"

export const vendoredPathsPlugin = () =>
  ({
    name: "vendored-paths",
    outputOptions(config) {
      const original = config.entryFileNames as (i: unknown) => string

      config.entryFileNames = (i) => {
        const modulePath = i.facadeModuleId!

        if (modulePath.endsWith("package.json") && !modulePath.includes("node_modules")) {
          return "manifest.mjs"
        }

        if (i.name.startsWith("node_modules")) {
          const matches = /\.pnpm[\\/](.+?@.+?)[\\/]/.exec(modulePath)
          if (matches != null && matches[1] != null) {
            const name = matches[1].split("@")[0]!
            const endOfPath = i.facadeModuleId!.slice(
              i.facadeModuleId!.indexOf(matches[1]) + matches[1].length,
            )
            return path.join("_vendor", matches[1], endOfPath.split(name).slice(1)!.join(name))
          }

          return path.join("_vendor", "unknown.mjs")
        }

        return original(i)
      }
    },
  }) satisfies ReturnType<typeof NodeProtocolPlugin>

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  unbundle: true,
  // removes jsdoc comments from JS output, keeps them in TS
  outputOptions: { comments: { jsdoc: false } },
  deps: { onlyBundle: ["murmur-hash"] },
  exports: true,

  env: { TEST: false },

  platform: "node",
  format: "esm",
  dts: { oxc: true },
  fixedExtension: true,
  minify: "dce-only",

  plugins: [vendoredPathsPlugin()],
})
