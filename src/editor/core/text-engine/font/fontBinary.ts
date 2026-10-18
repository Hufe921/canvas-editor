import type { FontBinaryFormat } from '../../../interface/TextEngine'

export const MAX_FONT_BYTES = 30 * 1024 * 1024

export class FontBinaryError extends Error {
  constructor(
    public reason: 'invalidData' | 'unsupportedFormat' | 'decodeFailed',
    message: string
  ) {
    super(message)
    this.name = 'FontBinaryError'
  }
}

export function fontBinaryFormat(data: ArrayBuffer): FontBinaryFormat {
  const magic = data.byteLength >= 4 ? new DataView(data).getUint32(0) : 0
  return magic === 0x00010000
    ? 'ttf'
    : magic === 0x4f54544f
      ? 'otf'
      : magic === 0x774f4646
        ? 'woff'
        : magic === 0x774f4632
          ? 'woff2'
          : 'unknown'
}

function invalid(message: string): never {
  throw new FontBinaryError('invalidData', message)
}

function checkSize(size: number) {
  if (size <= 0 || size > MAX_FONT_BYTES)
    invalid('Font size exceeds limits or is empty')
}

/** Preserve all SFNT tables, including unknown tables and GSUB/GPOS/GDEF. */
function validateSfnt(data: ArrayBuffer) {
  checkSize(data.byteLength)
  if (!['ttf', 'otf'].includes(fontBinaryFormat(data)) || data.byteLength < 12)
    invalid('Expected a TrueType or OpenType SFNT font')
  const view = new DataView(data)
  const count = view.getUint16(4)
  if (!count || 12 + count * 16 > data.byteLength)
    invalid('Invalid SFNT directory')
  const tags = new Set<number>()
  for (let i = 0; i < count; i++) {
    const offset = 12 + i * 16
    const tag = view.getUint32(offset)
    const start = view.getUint32(offset + 8)
    const length = view.getUint32(offset + 12)
    if (
      tags.has(tag) ||
      start < 12 + count * 16 ||
      start + length > data.byteLength
    )
      invalid('Invalid SFNT table bounds or duplicate tag')
    tags.add(tag)
  }
}

function abort(signal?: AbortSignal) {
  if (signal?.aborted)
    throw new DOMException('Font operation aborted', 'AbortError')
}

async function inflate(data: Uint8Array<ArrayBuffer>, size: number) {
  if (typeof DecompressionStream === 'undefined')
    throw new FontBinaryError(
      'unsupportedFormat',
      'WOFF requires DecompressionStream(deflate)'
    )
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(data)
      controller.close()
    }
  }).pipeThrough(new DecompressionStream('deflate'))
  const reader = stream.getReader()
  const output = new Uint8Array(size)
  let length = 0
  try {
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      if (length + chunk.value.length > size)
        invalid('WOFF table expands beyond declared length')
      output.set(chunk.value, length)
      length += chunk.value.length
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  if (length !== size) invalid('WOFF table length mismatch')
  return output
}

async function decodeWoff(data: ArrayBuffer, signal?: AbortSignal) {
  if (data.byteLength < 44) invalid('Truncated WOFF header')
  const input = new DataView(data)
  const count = input.getUint16(12)
  const size = input.getUint32(16)
  checkSize(size)
  if (
    input.getUint32(8) !== data.byteLength ||
    !count ||
    input.getUint16(14) !== 0 ||
    44 + count * 20 > data.byteLength
  )
    invalid('Invalid WOFF directory')
  const output = new ArrayBuffer(size)
  const bytes = new Uint8Array(output)
  const view = new DataView(output)
  if (size < 12 + count * 16) invalid('Invalid WOFF SFNT size')
  view.setUint32(0, input.getUint32(4))
  view.setUint16(4, count)
  const power = 2 ** Math.floor(Math.log2(count))
  view.setUint16(6, power * 16)
  view.setUint16(8, Math.log2(power))
  view.setUint16(10, count * 16 - power * 16)
  let position = 12 + count * 16
  let head = -1
  const tags = new Set<number>()
  const intervals: [number, number][] = []
  for (let i = 0; i < count; i++) {
    abort(signal)
    const row = 44 + i * 20
    const tag = input.getUint32(row)
    const offset = input.getUint32(row + 4)
    const compressed = input.getUint32(row + 8)
    const original = input.getUint32(row + 12)
    if (
      tags.has(tag) ||
      offset < 44 + count * 20 ||
      offset % 4 ||
      offset + compressed > data.byteLength ||
      compressed > original ||
      position + Math.ceil(original / 4) * 4 > size ||
      intervals.some(
        ([start, end]) => offset < end && offset + compressed > start
      )
    )
      invalid('Invalid WOFF table bounds')
    tags.add(tag)
    intervals.push([offset, offset + compressed])
    const contents = new Uint8Array(data, offset, compressed)
    bytes.set(
      compressed < original ? await inflate(contents, original) : contents,
      position
    )
    const target = 12 + i * 16
    view.setUint32(target, tag)
    view.setUint32(target + 4, input.getUint32(row + 16))
    view.setUint32(target + 8, position)
    view.setUint32(target + 12, original)
    if (tag === 0x68656164 && original >= 12) head = position
    position += Math.ceil(original / 4) * 4
  }
  if (position !== size) invalid('WOFF SFNT size mismatch')
  if (head >= 0) {
    view.setUint32(head + 8, 0)
    let checksum = 0
    for (let i = 0; i < size; i += 4)
      checksum = (checksum + view.getUint32(i)) >>> 0
    view.setUint32(head + 8, (0xb1b0afba - checksum) >>> 0)
  }
  return output
}

function decodeWoff2(
  data: ArrayBuffer,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', cancel)
    }
    const cancel = () => {
      cleanup()
      reject(new DOMException('Font operation aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(
        new FontBinaryError(
          'decodeFailed',
          'WOFF2 decoder initialization timed out'
        )
      )
    }, 15000)
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) {
      cancel()
      return
    }
    // Cancellation stops waiting; synchronous WASM work itself is not interruptible.
    Promise.resolve()
      .then(async () => {
        abort(signal)
        const { default: decompress } = await import('woff2-encoder/decompress')
        abort(signal)
        return new Uint8Array(await decompress(data)).buffer
      })
      .then(
        value => {
          cleanup()
          resolve(value)
        },
        error => {
          cleanup()
          reject(error)
        }
      )
  })
}

/** Decompression only: never round-trip through a font editor/serializer. */
export async function normalizeFontBinary(
  input: ArrayBuffer,
  signal?: AbortSignal
) {
  abort(signal)
  checkSize(input.byteLength)
  const sourceFormat = fontBinaryFormat(input)
  let data = input.slice(0)
  try {
    if (sourceFormat === 'woff') data = await decodeWoff(data, signal)
    else if (sourceFormat === 'woff2') {
      if (data.byteLength < 48) invalid('Truncated WOFF2 header')
      const header = new DataView(data)
      checkSize(header.getUint32(16))
      if (
        header.getUint32(8) !== data.byteLength ||
        !header.getUint16(12) ||
        header.getUint16(14) ||
        header.getUint32(20) > data.byteLength - 48
      )
        invalid('Invalid WOFF2 header')
      data = await decodeWoff2(data, signal)
    } else if (sourceFormat === 'unknown') invalid('Unknown font signature')
    abort(signal)
    validateSfnt(data)
    return {
      data,
      sourceFormat,
      format: fontBinaryFormat(data) as 'ttf' | 'otf'
    }
  } catch (error) {
    if (error instanceof FontBinaryError || signal?.aborted) throw error
    throw new FontBinaryError(
      'decodeFailed',
      `Font decompression failed: ${String(error)}`
    )
  }
}
