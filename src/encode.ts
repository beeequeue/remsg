import { Encoder } from "binary-util"
import type { REMsg } from "./types"
import { createStringMapAndData, uUIDToBuffer } from "./utils"
import { encrypt } from "./crypto"

export const encodeMsg = (input: REMsg) => {
  if (input.meta.version !== 539100710) {
    throw new Error(`Unsupported version ${input.meta.version}`)
  }

  const encoder = new Encoder()

  encoder.setUint32(input.meta.version) // version
  encoder.setString("GMSG") // magic
  encoder.setUint64(16n) // header offset
  encoder.setUint32(input.entries.length) // entry count
  encoder.setUint32(input.meta.attributes.length) // attribute count
  // language count
  const languageCount =
    input.entries[0] != null ? Object.keys(input.entries[0].strings).length : 0
  encoder.setUint32(languageCount)
  encoder.alignTo(8)

  // offsets

  // data offset
  const dataOffsetOffset = encoder.currentOffset
  encoder.setInt64(-1n)
  // unknown data offset
  const unknownOffsetOffset = encoder.currentOffset
  encoder.setInt64(-1n)
  // language offset
  const langOffsetOffset = encoder.currentOffset
  encoder.setInt64(-1n)
  // attributes offset
  const attributesOffsetOffset = encoder.currentOffset
  encoder.setInt64(-1n)
  // attribute names offset
  const attributeNamesOffsetOffset = encoder.currentOffset
  encoder.setInt64(-1n)
  // entry headers offsets
  const entryHeadersOffsets = [] as number[]
  for (let i = 0; i < input.entries.length; i++) {
    entryHeadersOffsets.push(encoder.currentOffset)
    encoder.setInt64(-1n)
  }

  // unknown data offset
  encoder.setUint64(BigInt(encoder.currentOffset), { into: unknownOffsetOffset })
  encoder.setUint64(0n) // unknown data

  // language offset
  encoder.setUint64(BigInt(encoder.currentOffset), { into: langOffsetOffset })
  for (let i = 0; i < languageCount; i++) {
    encoder.setUint32(i)
  }
  encoder.alignTo(8)

  // attributes offset
  encoder.setUint64(BigInt(encoder.currentOffset), { into: attributesOffsetOffset })
  for (const attribute of input.meta.attributes) {
    encoder.setInt32(attribute.type)
  }
  encoder.alignTo(8)

  // attribute names offset
  encoder.setUint64(BigInt(encoder.currentOffset), { into: attributeNamesOffsetOffset })
  const attributeNameOffsetOffsets = [] as number[]
  for (const _ of input.meta.attributes) {
    attributeNameOffsetOffsets.push(encoder.currentOffset)
    encoder.setInt64(-1n)
  }

  // entry headers
  const entryHeaderOffsets = [] as Array<{
    name: number
    attributes: number
    langs: number[]
    attributeValues: number[]
  }>
  for (let i = 0; i < input.entries.length; i++) {
    encoder.setUint64(BigInt(encoder.currentOffset), { into: entryHeadersOffsets[i] })

    const entry = input.entries[i]

    encoder.setBuffer(uUIDToBuffer(entry.meta.id))
    encoder.setUint32(entry.meta.crc)
    encoder.setUint32(entry.meta.hash)

    entryHeaderOffsets[i] ??= {} as never

    entryHeaderOffsets[i].name = encoder.currentOffset
    encoder.setInt64(-1n)
    entryHeaderOffsets[i].attributes = encoder.currentOffset
    encoder.setInt64(-1n)

    entryHeaderOffsets[i].langs = []
    for (let j = 0; j < languageCount; j++) {
      entryHeaderOffsets[i].langs[j] = encoder.currentOffset
      encoder.setInt64(-1n)
    }

    entryHeaderOffsets[i].attributeValues = []
  }

  // entry attributes
  for (let i = 0; i < input.entries.length; i++) {
    const entry = input.entries[i]

    encoder.setUint64(BigInt(encoder.currentOffset), { into: entryHeaderOffsets[i].attributes })

    for (let j = 0; j < input.meta.attributes.length; j++) {
      const attribute = input.meta.attributes[j]

      switch (attribute.type) {
        case -1: // null string
          encoder.setInt64(-1n)
          break
        case 0: // int
          encoder.setInt32(entry.attributes[j] as number)
          break
        case 1: // double
          encoder.setDouble(entry.attributes[j] as number)
          break
        case 2: // string
          encoder.setInt64(-1n)
          break
      }

      entryHeaderOffsets[i].attributeValues[j] = encoder.currentOffset
    }
  }

  const dataOffset = encoder.currentOffset
  encoder.setUint64(BigInt(dataOffset), { into: dataOffsetOffset })

  const {
    data,
    map: stringMap,
    nullAttributes,
    stringAttributes,
  } = createStringMapAndData(input, dataOffset)
  const encryptedData = encrypt(data)
  encoder.setBuffer(encryptedData)

  // update offsets

  for (let i = 0; i < input.meta.attributes.length; i++) {
    const { name } = input.meta.attributes[i]
    const offset = attributeNameOffsetOffsets[i]
    encoder.setUint64(BigInt(stringMap.get(name)!), { into: offset })
  }

  for (let i = 0; i < input.entries.length; i++) {
    const entry = input.entries[i]
    const offsets = entryHeaderOffsets[i]

    // entry name
    encoder.setUint64(BigInt(stringMap.get(entry.name)!), { into: offsets.name })

    // strings
    const strings = Object.values(entry.strings)
    for (let j = 0; j < strings.length; j++) {
      const string = strings[j]
      encoder.setUint64(BigInt(stringMap.get(string)!), { into: offsets.langs[j] })
    }

    // string attributes
    for (const index of stringAttributes) {
      const string = entry.attributes[index] as string
      encoder.setUint64(BigInt(stringMap.get(string)!), {
        into: offsets.attributeValues[index],
      })
    }

    // null string attributes
    const nullStringOffset = stringMap.get("")!
    for (const index of nullAttributes) {
      encoder.setUint64(BigInt(nullStringOffset), {
        into: offsets.attributeValues[index],
      })
    }
  }

  return encoder.buffer
}
