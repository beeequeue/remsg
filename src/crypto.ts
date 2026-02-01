import { Buffer } from "node:buffer"

// prettier-ignore
const encryptionKey = [
  0xcf, 0xce, 0xfb, 0xf8, 0xec, 0x0a, 0x33, 0x66,
  0x93, 0xa9, 0x1d, 0x93, 0x50, 0x39, 0x5f, 0x09,
] as const

export const decrypt = (data: Buffer): Buffer => {
  const rawData = Buffer.from(data)
  let prev = 0

  for (let i = 0; i < rawData.length; i++) {
    const cur = rawData[i]
    rawData[i] = cur ^ prev ^ encryptionKey[i & 0xf]
    prev = cur
  }

  return rawData
}

export const encrypt = (data: Buffer): Buffer => {
  const rawData = Buffer.from(data)
  let prev = 0

  for (let i = 0; i < rawData.length; i++) {
    const cur = rawData[i]
    rawData[i] = cur ^ prev ^ encryptionKey[i & 0xf]
    prev = rawData[i]
  }

  return rawData
}
