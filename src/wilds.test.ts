import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { expect, it } from "vitest"

import { decodeMsg } from "./decode"

const realFilePath = path.resolve(import.meta.dirname, "../fixtures/OpenBetaText.msg.23")

it.skipIf(!existsSync(realFilePath))("should parse a real file", async () => {
  const file = await fs.readFile(realFilePath)

  const msg = decodeMsg(file)

  expect(msg.entries[1]).toMatchObject({
    name: "OpenBetaText_000",
    strings: {
      en: expect.stringContaining("From now on, ask your parents to help you."),
    },
  })
})
