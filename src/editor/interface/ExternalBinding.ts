import { EditorZone } from '../dataset/enum/Editor'

export interface IExternalElementContainer {
  zone: EditorZone
  tablePath?: Array<{ tableId: string; rowId: string; cellId: string }>
}

/** Indices/counts address runtime grapheme elements, not UTF-16 characters.
 * Applications retain their own identities and revalidate captured source text. */
export interface IExternalElementBinding {
  container: IExternalElementContainer
  startIndex: number
  count: number
  expectedText: string
  externalId: string
  extension: unknown
}
