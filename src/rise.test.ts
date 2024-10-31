import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { expect, it } from "vitest"

import { decodeMsg } from "./decode"
import { encodeMsg } from "./encode"

const realFilePath = path.resolve(
  import.meta.dirname,
  "../fixtures/DialogMsg.msg.539100710",
)

it.skipIf(!existsSync(realFilePath))("should parse a real file", async () => {
  const file = await fs.readFile(realFilePath)

  const msg = decodeMsg(file)

  expect(msg.entries[1]).toMatchObject({
    name: "DialogMsg_Fa_TrainingArea_001",
    strings: {
      en: "Go to your room?",
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
