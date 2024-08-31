# remsg

[![npm](https://img.shields.io/npm/v/remsg)](https://www.npmjs.com/package/remsg)
![npm bundle size](https://deno.bundlejs.com/?q=remsg&badge)
![node-current](https://img.shields.io/node/v/remsg)

A library for parsing and serializing MSG files for the RE Engine, more specifically for Monster Hunter: Rise.

This library pretty much a port of [REMSG_Converter](https://github.com/dtlnor/REMSG_Converter) which is based on the work in [mhrice](https://github.com/wwylele/mhrice).

## Usage

```typescript
import { encodeMsg, decodeMsg } from "remsg"

const data = /* load a msg file */
const json = decodeMsg(data)
const msg = encodeMsg(json)
```
