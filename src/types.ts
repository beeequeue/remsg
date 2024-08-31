import type { LanguageCodes } from "./constants"

type REMsgEntry = {
  meta: {
    id: string
    crc: number
    hash: number
  }
  name: string
  attributes: Array<string | number>
  strings: Record<(typeof LanguageCodes)[number], "" | string>
}

export type REMsg = {
  meta: {
    version: number
    attributes: Array<{ type: number; name: string }>
  }
  entries: REMsgEntry[]
}
