import { Buffer } from "node:buffer"

const encryptionKey = [
  0xCF, 0xCE, 0xFB, 0xF8, 0xEC, 0x0A, 0x33, 0x66, 0x93, 0xA9, 0x1D, 0x93, 0x50, 0x39,
  0x5F, 0x09,
] as const

export const decrypt = (data: Buffer): Buffer => {
  const rawData = Buffer.from(data)
  let prev = 0

  for (let i = 0; i < rawData.length; i++) {
    const cur = rawData[i]
    rawData[i] = cur ^ prev ^ encryptionKey[i & 0xF]
    prev = cur
  }

  return rawData
}

export const encrypt = (data: Buffer): Buffer => {
  const rawData = Buffer.from(data)
  let prev = 0

  for (let i = 0; i < rawData.length; i++) {
    const cur = rawData[i]
    rawData[i] = cur ^ prev ^ encryptionKey[i & 0xF]
    prev = rawData[i]
  }

  return rawData
}
