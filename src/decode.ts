import type { Buffer } from "node:buffer"

import { Decoder } from "binary-util"

import { LanguageCodes } from "./constants"
import { decrypt } from "./crypto"
import type { REMsg } from "./types"
import { bufferToUUID, extractStringMap } from "./utils"

// Internal types

type MsgHeaderParsed = {
  magic: "GMSG"
  version: number
  headerOffset: bigint
  entryCount: number
  attributeCount: number
  langCount: number
  dataOffset: bigint
  langOffset: bigint
  attributesOffset: bigint
  attributeNamesOffset: bigint
}

type MsgAttributeHeaderParsed = {
  type: number
  nameOffset: bigint
  name: string
}

type MsgEntryHeaderParsed = {
  id: string
  crc: number
  hash: number
  nameOffset: bigint
  attributesOffset: bigint
  contentOffsetsByLang: bigint[]
}

type MsgEntryParsed = {
  header: MsgEntryHeaderParsed
  name: string
  attributes: Array<string | number>
  strings: Record<string, string>
}

const parseHeader = (parser: Decoder): MsgHeaderParsed => ({
  version: parser.readUint32(),
  magic: parser.readString({ length: 4 }) as "GMSG",
  headerOffset: parser.readUint64(),
  entryCount: parser.readUint32(),
  attributeCount: parser.readUint32(),
  langCount: parser.readUint32(),
  ["_" as never]: parser.alignTo(8),
  dataOffset: parser.readUint64(),
  ["_2" as never]: parser.seek(8),
  langOffset: parser.readUint64(),
  attributesOffset: parser.readUint64(),
  attributeNamesOffset: parser.readUint64(),
})

export const decodeMsg = (data: Buffer): REMsg => {
  const parser = new Decoder(data)
  const header = parseHeader(parser)

  const entries = [] as MsgEntryParsed[]

  if (header.magic !== "GMSG") {
    throw new Error(`Invalid magic: ${header.magic as string}`)
  }
  if (header.version !== 539100710 && header.version !== 23) {
    throw new Error(`Uknkown version: ${header.version}`)
  }

  const entryHeaderOffsets = [] as bigint[]
  for (let i = 0; i < header.entryCount; i++) {
    entryHeaderOffsets.push(parser.readUint64())
  }

  // unknown data (probably header separator?)
  parser.seek(8)

  const languages = [] as (typeof LanguageCodes)[number][]
  for (let i = 0; i < header.langCount; i++) {
    languages.push(LanguageCodes[parser.readUint32()])
  }
  parser.alignTo(8)

  if (Number(header.attributesOffset) !== parser.currentOffset) {
    throw new Error(
      `Attributes offset mismatch: ${header.attributesOffset} != ${parser.currentOffset}`,
    )
  }
  const attributesHeaders = [] as MsgAttributeHeaderParsed[]
  for (let i = 0; i < header.attributeCount; i++) {
    attributesHeaders.push({
      type: parser.readInt32(),
      nameOffset: null!,
      name: null!,
    })
  }
  parser.alignTo(8)

  if (Number(header.attributeNamesOffset) !== parser.currentOffset) {
    throw new Error(
      `Attribute names offset mismatch: ${header.attributeNamesOffset} != ${parser.currentOffset}`,
    )
  }
  for (let i = 0; i < header.attributeCount; i++) {
    attributesHeaders[i].nameOffset = parser.readUint64()
  }

  if (header.entryCount !== 0) {
    for (let i = 0; i < header.entryCount; i++) {
      if (Number(entryHeaderOffsets[i]) !== parser.currentOffset) {
        throw new Error(
          `Entry header offset mismatch: $${parser.currentOffset} != entry:${i}:${entryHeaderOffsets[i]}`,
        )
      }

      const entryHeader = {
        id: bufferToUUID(parser.readBuffer({ length: 16 })),
        crc: parser.readUint32(),
        hash: parser.readUint32(),
        nameOffset: parser.readUint64(),
        attributesOffset: parser.readUint64(),
        contentOffsetsByLang: [] as bigint[],
      } satisfies MsgEntryHeaderParsed

      for (let j = 0; j < header.langCount; j++) {
        entryHeader.contentOffsetsByLang.push(parser.readUint64())
      }

      entries.push({ header: entryHeader } as MsgEntryParsed)
    }

    for (let i = 0; i < header.entryCount; i++) {
      const entry = entries[i]

      if (Number(entry.header.attributesOffset) !== parser.currentOffset) {
        throw new Error(
          `Entry header attributes offset mismatch: $${parser.currentOffset} != entry:${i}:${entry.header.attributesOffset}`,
        )
      }

      entry.attributes = []

      for (let j = 0; j < attributesHeaders.length; j++) {
        const attrHeader = attributesHeaders[j]
        switch (attrHeader.type) {
          // "null" string pointer
          case -1:
            entry.attributes[j] = Number(parser.readUint64())
            break
          // int
          case 0:
            entry.attributes[j] = parser.readUint32()
            parser.seek(4) // maybe wrong
            break
          // float/double
          case 1:
            entry.attributes[j] = parser.readDouble()
            break
          // string pointer
          case 2:
            entry.attributes[j] = Number(parser.readUint64())
            break
          default:
            throw new Error(`Not implemented attribute type ${attrHeader.type}`)
        }
      }
    }

    if (Number(header.dataOffset) !== parser.currentOffset) {
      throw new Error(
        `Data offset mismatch: $${header.dataOffset} != ${parser.currentOffset}`,
      )
    }

    const decryptedStringsBuffer = decrypt(data.subarray(parser.currentOffset))
    const stringMap = extractStringMap(decryptedStringsBuffer, parser.currentOffset)

    for (let i = 0; i < attributesHeaders.length; i++) {
      const attributeHeader = attributesHeaders[i]
      attributeHeader.name = stringMap.get(Number(attributeHeader.nameOffset))!
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]

      for (let j = 0; j < header.attributeCount; j++) {
        switch (attributesHeaders[j].type) {
          case 2:
            entry.attributes[j] = stringMap.get(entry.attributes[j] as number)!
            break
          case -1:
            entry.attributes[j] = stringMap.get(entry.attributes[j] as number)!

            if (entry.attributes[j] !== "" && entry.attributes[j] !== "\x00") {
              throw new Error(
                `Attribute with type -1 is not empty string: "${entry.attributes[j]}"`,
              )
            }
            break
        }
      }
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      entry.name = stringMap.get(Number(entry.header.nameOffset))!

      entry.strings = {}
      for (let j = 0; j < entry.header.contentOffsetsByLang.length; j++) {
        const offset = Number(entry.header.contentOffsetsByLang[j])
        entry.strings[languages[j]] = stringMap.get(offset)!
      }
    }
  }

  return {
    meta: {
      version: header.version,
      attributes: attributesHeaders.map((attr) => ({
        type: attr.type,
        name: attr.name,
      })),
    },
    entries: entries.map((entry) => ({
      meta: {
        id: entry.header.id,
        crc: entry.header.crc,
        hash: entry.header.hash,
      },
      name: entry.name,
      attributes: entry.attributes,
      strings: entry.strings,
    })),
  }
}
