import type { LayoutRevision, LayoutSource } from './Layout'

export type FontCoverageReason =
  | 'missingFace'
  | 'missingGlyph'
  | 'missingSequence'
  | 'loadFailed'
  | 'unsupportedGlyphFormat'
  | 'missingStyle'

export type FontDownloadStatus =
  | 'disabled'
  | 'idle'
  | 'loading'
  | 'resolved'
  | 'failed'
  | 'unsupported'

export type FontFailureStage = 'fetch' | 'decode' | 'parse' | 'register'
export type FontCodePoint = `U+${string}`

export interface FontCoverageLocation extends LayoutSource {
  /** Half-open UTF-16 range within the original source text. */
  textStart: number
  textEnd: number
}

export interface FontDownloadAttempt {
  provider: 'bunny'
  family: string
  weight: number
  style: 'normal' | 'italic'
  /** Stable fragment/version identity; never includes document text. */
  resourceId: string
  status: Exclude<FontDownloadStatus, 'disabled' | 'idle'>
  failureStage?: FontFailureStage
  failureReason?: string
}

export interface FontCoverageIssueBase {
  id: string
  /** OpenType/Unicode script identifier; Han does not imply a language. */
  script: string
  /** Stable i18n lookup key, not pretranslated text. */
  categoryLabel: string
  requestedWeight?: number
  requestedStyle?: 'normal' | 'italic'
  requestedFamily: string
  attemptedFaces: string[]
  /** Distinct Unicode scalars and distinct full grapheme/ZWJ sequences. */
  missingCharacters: string[]
  missingSequences: string[]
  codePoints: FontCodePoint[]
  /** At most 16 graphemes; never an entire document fragment. */
  samples: string[]
  uniqueCount: number
  occurrenceCount: number
  locations: FontCoverageLocation[]
  downloadFailure?: { stage?: FontFailureStage; message: string }
  downloadStatus: FontDownloadStatus
  attemptedDownloads: FontDownloadAttempt[]
}

/** A failed resource and uncovered text are independently diagnosable. */
export type FontCoverageIssue = FontCoverageIssueBase &
  (
    | {
        reason: 'loadFailed'
        failure: { stage: FontFailureStage; message: string }
      }
    | {
        reason: Exclude<FontCoverageReason, 'loadFailed'>
        failure?: never
      }
  )

/** A complete current snapshot; resolved issues are removed, not accumulated. */
export interface FontCoverageReport extends LayoutRevision {
  autoDownloadFonts: boolean
  issues: FontCoverageIssue[]
}

export type FontCoverageChange = (report: FontCoverageReport) => void
