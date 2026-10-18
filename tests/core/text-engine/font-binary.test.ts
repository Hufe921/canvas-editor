import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import {
  MAX_FONT_BYTES,
  normalizeFontBinary
} from '@/editor/core/text-engine/font/fontBinary'
import { readFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import opentype from 'opentype.js'
import { describe, expect, it, vi } from 'vitest'
import { compress } from 'woff2-encoder'

function file(name = 'NotoNaskhArabic') {
  const data = readFileSync(`public/fonts/${name}-Regular.ttf`)
  return new Uint8Array(data).buffer
}
function tables(data: ArrayBuffer) {
  const view = new DataView(data)
  return Array.from({ length: view.getUint16(4) }, (_, i) => {
    const row = 12 + i * 16
    return {
      tag: view.getUint32(row),
      checksum: view.getUint32(row + 4),
      data: new Uint8Array(
        data,
        view.getUint32(row + 8),
        view.getUint32(row + 12)
      )
    }
  })
}
function woff(data: ArrayBuffer) {
  const entries = tables(data).map(table => {
    const zipped = deflateSync(table.data)
    return {
      ...table,
      zipped: zipped.length < table.data.length ? zipped : table.data
    }
  })
  const size =
    44 +
    entries.length * 20 +
    entries.reduce((s, t) => s + Math.ceil(t.zipped.length / 4) * 4, 0)
  const result = new ArrayBuffer(size)
  const view = new DataView(result)
  view.setUint32(0, 0x774f4646)
  view.setUint32(4, new DataView(data).getUint32(0))
  view.setUint32(8, size)
  view.setUint16(12, entries.length)
  view.setUint32(
    16,
    12 +
      entries.length * 16 +
      entries.reduce((s, t) => s + Math.ceil(t.data.length / 4) * 4, 0)
  )
  let offset = 44 + entries.length * 20
  entries.forEach((table, i) => {
    const row = 44 + i * 20
    view.setUint32(row, table.tag)
    view.setUint32(row + 4, offset)
    view.setUint32(row + 8, table.zipped.length)
    view.setUint32(row + 12, table.data.length)
    view.setUint32(row + 16, table.checksum)
    new Uint8Array(result).set(table.zipped, offset)
    offset += Math.ceil(table.zipped.length / 4) * 4
  })
  return result
}

describe('SFNT font normalization', () => {
  it('accepts and owns uncompressed TTF/OTF data', async () => {
    const data = file()
    const result = await normalizeFontBinary(data)
    expect(result).toMatchObject({ sourceFormat: 'ttf', format: 'ttf' })
    expect(result.data).not.toBe(data)
    expect(new Uint8Array(result.data)).toEqual(new Uint8Array(data))
  })

  it('reads a real CFF OpenType font through both SFNT and WOFF', async () => {
    const path = new opentype.Path()
    path.moveTo(0, 0)
    path.lineTo(500, 0)
    path.lineTo(250, 700)
    path.close()
    const data = new opentype.Font({
      familyName: 'CFF Test',
      styleName: 'Regular',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: [
        new opentype.Glyph({ name: '.notdef', advanceWidth: 600, path }),
        new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 600, path })
      ]
    }).toArrayBuffer()
    const result = await normalizeFontBinary(data)
    expect(result.format).toBe('otf')
    const restored = await normalizeFontBinary(woff(data))
    expect(restored.format).toBe('otf')
    const manager = new FontManager()
    try {
      await manager.init([{ family: 'CFF', data: restored.data }])
      expect(
        manager.resolve({ fontFamily: 'CFF', fontSize: 20 }, 'A').covered
      ).toBe(true)
    } finally {
      manager.destroy()
    }
  })

  it('returns a recoverable WOFF capability error without native deflate', async () => {
    vi.stubGlobal('DecompressionStream', undefined)
    try {
      await expect(normalizeFontBinary(woff(file()))).rejects.toMatchObject({
        reason: 'unsupportedFormat'
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('restores every WOFF table without serializing away layout data', async () => {
    const original = file()
    const { data } = await normalizeFontBinary(woff(original))
    const restored = tables(data)
    for (const table of tables(original)) {
      const actual = restored.find(value => value.tag === table.tag)!
      // SFNT checksumAdjustment is the only field normalization may change.
      if (table.tag === 0x68656164) {
        expect(actual.data.slice(0, 8)).toEqual(table.data.slice(0, 8))
        expect(actual.data.slice(12)).toEqual(table.data.slice(12))
      } else expect(actual.data).toEqual(table.data)
    }
    let checksum = 0
    const view = new DataView(data)
    for (let i = 0; i < data.byteLength; i += 4)
      checksum = (checksum + view.getUint32(i)) >>> 0
    expect(checksum).toBe(0xb1b0afba)
    const manager = new FontManager()
    try {
      await manager.init([])
      expect(
        (await manager.registerFace({ family: 'WOFF', data: woff(original) }))
          .status
      ).toBe('registered')
      expect(manager.getFaces()[0].format).toBe('woff')
      expect(
        manager.resolve({ fontFamily: 'WOFF', fontSize: 20 }, 'مرحبا').covered
      ).toBe(true)
    } finally {
      manager.destroy()
    }
  })

  it.each([
    ['NotoNaskhArabic', 'مرحبا'],
    ['NotoSansDevanagari', 'नमस्ते'],
    ['NotoSansThai', 'สวัสดี']
  ])(
    'decodes real WOFF2 and retains shaping tables for %s',
    async (name, text) => {
      const original = file(name)
      const encoded = new Uint8Array(await compress(original)).buffer
      const result = await normalizeFontBinary(encoded)
      expect(result.sourceFormat).toBe('woff2')
      for (const tag of [0x47535542, 0x47504f53, 0x47444546]) {
        const before = tables(original).find(t => t.tag === tag)
        if (before)
          expect(tables(result.data).find(t => t.tag === tag)?.data).toEqual(
            before.data
          )
      }
      const manager = new FontManager()
      try {
        await manager.init([])
        const registered = await manager.registerFace({
          family: 'Test',
          data: encoded
        })
        expect(registered.status).toBe('registered')
        expect(
          manager.resolve({ fontFamily: 'Test', fontSize: 20 }, text).covered
        ).toBe(true)
        expect(
          (await manager.registerFace({ family: 'Test', data: encoded })).status
        ).toBe('duplicate')
        expect(manager.getRevision()).toBe(1)
      } finally {
        manager.destroy()
      }
    }
  )

  it('rejects invalid signatures, truncated headers, bounds and expansion bombs', async () => {
    await expect(normalizeFontBinary(new ArrayBuffer(4))).rejects.toMatchObject(
      { reason: 'invalidData' }
    )
    const truncated = new Uint8Array([0x77, 0x4f, 0x46, 0x32]).buffer
    await expect(normalizeFontBinary(truncated)).rejects.toThrow('Truncated')
    const malformed = woff(file())
    new DataView(malformed).setUint32(16, MAX_FONT_BYTES + 1)
    await expect(normalizeFontBinary(malformed)).rejects.toThrow('size')
    const overflow = woff(file())
    new DataView(overflow).setUint32(48, overflow.byteLength + 100)
    await expect(normalizeFontBinary(overflow)).rejects.toThrow('bounds')
  })

  it('limits decoder initialization time and removes abort subscriptions', async () => {
    const encoded = new Uint8Array(await compress(file())).buffer
    vi.doMock('woff2-encoder/decompress', () => ({
      default: () => new Promise(() => {})
    }))
    vi.useFakeTimers()
    const controller = new AbortController()
    const remove = vi.spyOn(controller.signal, 'removeEventListener')
    try {
      const pending = normalizeFontBinary(encoded, controller.signal)
      const assertion = expect(pending).rejects.toMatchObject({
        reason: 'decodeFailed'
      })
      await vi.advanceTimersByTimeAsync(15001)
      await assertion
      expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
    } finally {
      vi.useRealTimers()
      vi.doUnmock('woff2-encoder/decompress')
    }
  })

  it('honors cancellation before decoding', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      normalizeFontBinary(file(), controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
