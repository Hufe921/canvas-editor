import {
  CaretMovement,
  TextDirection,
  TextEngineMode
} from '../dataset/enum/TextDirection'
import { TextScript } from '../dataset/enum/TextScript'

export interface IEditorFontFace {
  /** Logical family name referenced by element.font / defaultFont */
  family: string
  /** Font binary (ttf/otf/woff as ArrayBuffer), or URL to fetch */
  data?: ArrayBuffer | null
  url?: string | null
  weight?: number
  style?: 'normal' | 'italic'
  /**
   * OpenType scripts this face should auto-apply to (e.g. arab, deva, thai).
   * Characters of these scripts use this family unless element.font is set.
   */
  scripts?: TextScript[]
}

export interface ITextEngineOption {
  mode?: TextEngineMode
  defaultDirection?: TextDirection
  caretMovement?: CaretMovement
  fonts?: IEditorFontFace[]
}
