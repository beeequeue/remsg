# remsg

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/remsg)](https://npmx.dev/package/remsg)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/remsg)](https://npmx.dev/package/remsg)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/remsg)](https://npmx.dev/package/remsg)
[![npm bundle size](https://img.shields.io/badge/bundled%20size-11.9%20kB-blue?labelColor=000)](https://teardown.kelinci.dev/?q=npm%3Aremsg)

A library for parsing and serializing MSG files for the RE Engine, more specifically for Monster Hunter: Rise.

This library pretty much a port of [REMSG_Converter](https://github.com/dtlnor/REMSG_Converter) which is based on the work in [mhrice](https://github.com/wwylele/mhrice).

## Usage

```typescript
import { readFileSync } from "fs"
import { encodeMsg, decodeMsg } from "remsg"

const data = readFileSync("./somefile.msg.23")
const json = decodeMsg(data)
const msg = encodeMsg(json)
```
