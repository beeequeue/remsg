import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

import { expect, it } from "vitest"

import { decodeMsg } from "./decode"

const realFilePath = path.resolve(
  import.meta.dirname,
  "../fixtures/DialogMsg.msg.539100710",
)

it.skipIf(!existsSync(realFilePath))(
  "should parse a real file (DialogMsg.msg.539100710)",
  async () => {
    const file = await fs.readFile(realFilePath)

    const msg = decodeMsg(file)

    expect(msg.entries[1]).toMatchObject({
      name: "DialogMsg_Fa_TrainingArea_001",
      strings: {
        en: "Go to your room?",
      },
    })
  },
)
