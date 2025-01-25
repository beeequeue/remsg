import { Buffer } from "node:buffer"

import type { REMsg } from "./types"

export const bufferToUUID = (buffer: Buffer): string => {
  const hex = buffer.toString("hex")
  return [
    hex.slice(6, 8) + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2), // time_low
    hex.slice(10, 12) + hex.slice(8, 10), // time_mid
    hex.slice(14, 16) + hex.slice(12, 14), // time_high_and_version
    hex.slice(16, 18) + hex.slice(18, 20), // clock_seq_and_reserved
    hex.slice(20, 32), // node
  ].join("-")
}

export const uUIDToBuffer = (uuid: string): Buffer => {
  const hex = uuid.replaceAll("-", "")
  return Buffer.from(
    [
      hex.slice(6, 8) + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2), // time_low
      hex.slice(10, 12) + hex.slice(8, 10), // time_mid
      hex.slice(14, 16) + hex.slice(12, 14), // time_high_and_version
      hex.slice(16, 18) + hex.slice(18, 20), // clock_seq_and_reserved
      hex.slice(20, 32), // node
    ].join(""),
    "hex",
  )
}

export const extractStringMap = (
  data: Buffer,
  baseOffset: number,
): Map<number, string> => {
  if (data.length === 0) {
    return new Map()
  }

  const string = data.toString("utf16le")
  if (string[string.length - 1] !== "\x00") {
    throw new Error("String is not null-terminated")
  }

  const stringMap = new Map<number, string>()
  let start = 0
  for (let i = 0; i < string.length; i++) {
    const char = string[i]
    if (char === "\x00") {
      stringMap.set(baseOffset + start * 2, string.slice(start, i))
      start = i + 1
    }
  }

  return stringMap
}

export const createStringMapAndData = (msg: REMsg, initialOffset: number) => {
  let currentOffset = 0
  const map = new Map<string, number>()

  const getStringOffset = (str: string) => {
    if (map.has(str)) return map.get("str")

    const offset = initialOffset + currentOffset
    map.set(str, offset)

    currentOffset += str.length * 2 + 2
    return offset
  }

  const nullAttributes = [] as number[]
  const stringAttributes = [] as number[]
  for (let i = 0; i < msg.meta.attributes.length; i++) {
    const attribute = msg.meta.attributes[i]

    if (attribute.type === -1) {
      getStringOffset("")
      nullAttributes.push(i)
    } else if (attribute.type === 2) {
      getStringOffset(attribute.name)
      stringAttributes.push(i)
    }
  }

  for (let i = 0; i < msg.meta.attributes.length; i++) {
    const attribute = msg.meta.attributes[i]
    getStringOffset(attribute.name)
  }

  for (const entry of msg.entries) {
    getStringOffset(entry.name)

    for (const value of Object.values(entry.strings)) {
      getStringOffset(value)
    }
    for (const index of stringAttributes) {
      getStringOffset(entry.attributes[index] as string)
    }
  }

  let data = Buffer.alloc(0)
  for (const str of map.keys()) {
    const strBuffer = Buffer.from(`${str}\x00`, "utf16le")
    data = Buffer.concat([data, strBuffer])
  }

  return { map, nullAttributes, stringAttributes, data } as const
}
