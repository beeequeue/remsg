import { Buffer } from "node:buffer"

import { expect, it } from "vitest"

import { decrypt, encrypt } from "./crypto"

it("should encrypt and decrypt data", () => {
  const str = "Hello, World!"
  const buffer = Buffer.from(str, "utf8")

  const encrypted = encrypt(buffer)
  const decrypted = decrypt(encrypted)

  expect(decrypted.toString("utf8")).toEqual(str)
})

it("should encrypt and decrypt data 2", () => {
  const strs = ["Hello, World!", "Test 1, 2, 3..."]
  const buffer = Buffer.concat(
    strs.map((str) => Buffer.concat([Buffer.from(str, "utf16le"), Buffer.alloc(2)])),
  )

  const encrypted = encrypt(buffer)
  const decrypted = decrypt(encrypted)

  expect(decrypted.toString("utf16le").split("\x00")).toEqual([...strs, ""])
})
