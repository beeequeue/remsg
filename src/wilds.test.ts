import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { expect, it } from "vitest"

import { decodeMsg } from "./decode"
import { encodeMsg } from "./encode"

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

it.skipIf(!existsSync(realFilePath))(
  "should encode a file to be equal to the input",
  async () => {
    const file = await fs.readFile(realFilePath)

    const msg = decodeMsg(file)
    const encoded = encodeMsg(msg)

    expect(encoded.equals(file)).toBe(true)
  },
)
