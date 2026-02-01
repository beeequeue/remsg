/* eslint-disable test/prefer-lowercase-title */
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { hash128 } from "murmur-hash"
import { describe, expect, it } from "vitest"

import { decodeMsg } from "./decode"
import { encodeMsg } from "./encode"

const realFilePath = path.resolve(
  import.meta.dirname,
  "../fixtures/DialogMsg.msg.539100710",
)

describe.skipIf(!existsSync(realFilePath))("DialogMsg.msg.539100710", async () => {
  const file = await fs.readFile(realFilePath)
  const msg = decodeMsg(file)

  it("should parse the file correctly", () => {
    expect(msg.entries[1]).toMatchObject({
      name: "DialogMsg_Fa_TrainingArea_001",
      strings: {
        en: "Go to your room?",
      },
    })
  })

  it.skip("should produce an identical file to a parsed one", () => {
    const result = encodeMsg(msg)

    expect(result.byteLength).toStrictEqual(file.byteLength)
    expect(hash128(result)).toStrictEqual(hash128(file))
  })
})
