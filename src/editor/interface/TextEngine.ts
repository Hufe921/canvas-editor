import type { FontFailureStage } from './FontCoverage'
import type { LayoutFontRef } from './Layout'
import { TextScript } from '../dataset/enum/TextScript'

export interface IEditorFontFace {
  /** Logical family name referenced by element.font / defaultFont */
  family: string
  /** Optional provider fragment/version identity; binary content also keys faces. */
  resourceId?: string
  /** Permit selection for other requested families. Defaults to true. */
  fallback?: boolean
  /** TTF/OTF/WOFF/WOFF2 font binary, or an explicit URL. */
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

export type FontBinaryFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'unknown'

export interface RegisteredFontFace {
  faceId: string
  family: string
  weight: number
  style: 'normal' | 'italic'
  scripts: TextScript[]
  fallback: boolean
  resourceId: string
  format: FontBinaryFormat
  unitsPerEm: number
}

export interface FontRegistrationFailure {
  family: string
  stage: FontFailureStage
  reason:
    | 'missingData'
    | 'fetchFailed'
    | 'invalidData'
    | 'unsupportedFormat'
    | 'unsupportedGlyphFormat'
    | 'decodeFailed'
    | 'invalidDescriptor'
    | 'browserRegistrationFailed'
  message: string
  format?: FontBinaryFormat
}

export type FontRegistrationResult =
  | {
      status: 'registered' | 'duplicate'
      face: RegisteredFontFace
      warnings: FontRegistrationFailure[]
    }
  | { status: 'failed'; failure: FontRegistrationFailure }

export interface FontPlaceholderMetrics {
  source: 'notdef' | 'box'
  font: LayoutFontRef | null
  advance: number
  ascent: number
  descent: number
}
