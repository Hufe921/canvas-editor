import type { LayoutRow } from './LayoutRow'
import { IElement, IElementMetrics } from './Element'

/** Minimal line handle from text-engine (avoid interface→core cycle at runtime) */
export interface IEngineLayoutLine {
  glyphs: Array<{
    missing?: import('../core/text-engine/types').ShapedGlyph['missing']
    font?: import('./Layout').LayoutFontRef
    left: number
    right: number
    ax: number
    dx: number
    dy: number
    pathData?: string
    charStart: number
    charEnd: number
    logicalIndexStart: number
    logicalIndexEnd: number
    logicalIndices?: number[]
    bidiLevel: number
    style: {
      fontFamily: string
      fontSize: number
      bold?: boolean
      italic?: boolean
      color?: string
    }
  }>
  width: number
  height: number
  ascent: number
  direction: 'ltr' | 'rtl'
}

export type IRowElement = IElement & {
  metrics: IElementMetrics
  style: string
  left?: number
  /** Absolute x within the row content box (text-engine visual placement) */
  visualLeft?: number
  bidiLevel?: number
  visualIndex?: number
  clusterStart?: number
  clusterEnd?: number
  /** Original element index; unlike visual order, this remains stable. */
  sourceIndex?: number
}

/** Detached compatibility output only; native layout uses LayoutRow. */
export interface IRow extends LayoutRow {
  elementList: IRowElement[]
  missingGlyphs?: import('./Layout').MissingGlyphBox[]
  engineLine?: IEngineLayoutLine
  engineParagraphText?: string
}
