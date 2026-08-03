import bidiFactory from 'bidi-js'

type BidiApi = ReturnType<typeof bidiFactory>

let api: BidiApi | null = null

export function getBidiApi(): BidiApi {
  if (!api) {
    api = bidiFactory()
  }
  return api
}
