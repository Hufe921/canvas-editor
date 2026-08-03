import {
  Blob as HbBlob,
  Face as HbFace,
  Font as HbFont
} from 'harfbuzzjs'
import opentype, { Font as OtFont } from 'opentype.js'
import { IEditorFontFace } from '../../../interface/TextEngine'
import { TextStyleProps } from '../types'

export interface FontInstance {
  key: string
  hbFont: HbFont
  otFont: OtFont | null
  unitsPerEm: number
  size: number
  /** Pixel scale: px = hbUnit * (size / unitsPerEm) when hb scale = upem */
  pxPerUnit: number
}

export class FontManager {
  private fonts = new Map<string, FontInstance>()
  private faceCache = new Map<
    string,
    { face: HbFace; ot: OtFont | null; buffer: ArrayBuffer }
  >()
  private ready = false
  private defaultFamily = 'sans-serif'

  isReady(): boolean {
    return this.ready && this.faceCache.size > 0
  }

  async init(faces: IEditorFontFace[], defaultFamily?: string): Promise<void> {
    if (defaultFamily) this.defaultFamily = defaultFamily
    for (const face of faces) {
      await this.registerFace(face)
    }
    this.ready = true
  }

  async registerFace(face: IEditorFontFace): Promise<void> {
    let buffer = face.data
    if (!buffer && face.url) {
      const res = await fetch(face.url)
      buffer = await res.arrayBuffer()
    }
    if (!buffer) return
    const weight = face.weight ?? 400
    const style = face.style ?? 'normal'
    const cacheKey = `${face.family}_${weight}_${style}`
    if (this.faceCache.has(cacheKey)) return
    const blob = new HbBlob(buffer)
    const hbFace = new HbFace(blob, 0)
    let ot: OtFont | null = null
    try {
      ot = opentype.parse(buffer)
    } catch {
      ot = null
    }
    this.faceCache.set(cacheKey, { face: hbFace, ot, buffer })
    // Register with document so canvas fillText can join Arabic with this family
    try {
      if (typeof FontFace !== 'undefined' && typeof document !== 'undefined') {
        const ff = new FontFace(face.family, buffer, {
          weight: String(weight),
          style
        })
        await ff.load()
        document.fonts.add(ff)
      }
    } catch (e) {
      console.warn('[text-engine] FontFace register failed', face.family, e)
    }
  }

  private resolveFaceKey(style: TextStyleProps): string | null {
    const weight = style.bold ? 700 : 400
    const italic = style.italic ? 'italic' : 'normal'
    const family = style.fontFamily || this.defaultFamily
    const exact = `${family}_${weight}_${italic}`
    if (this.faceCache.has(exact)) return exact
    for (const key of this.faceCache.keys()) {
      if (key.startsWith(`${family}_`)) return key
    }
    // Do not fall back to an unrelated face (e.g. Arabic for CJK)
    return null
  }

  getFont(style: TextStyleProps): FontInstance | null {
    if (!this.faceCache.size) return null
    const faceKey = this.resolveFaceKey(style)
    if (!faceKey) return null
    const cached = this.faceCache.get(faceKey)
    if (!cached) return null
    const size = style.fontSize
    const key = `${faceKey}_${size}`
    let inst = this.fonts.get(key)
    if (!inst) {
      const hbFont = new HbFont(cached.face)
      const upem = cached.ot?.unitsPerEm || 1000
      // Keep HB in font units; convert advances to px via pxPerUnit
      hbFont.setScale(upem, upem)
      inst = {
        key,
        hbFont,
        otFont: cached.ot,
        unitsPerEm: upem,
        size,
        pxPerUnit: size / upem
      }
      this.fonts.set(key, inst)
    }
    return inst
  }
}
