/**
 * Native layout protocol. All geometry uses CSS pixels in the owning scope,
 * before page placement, zoom or DPR transforms. Models contain no IElement
 * references or mutable rendering caches.
 */
export type LayoutScopeId = string

export interface LayoutRevision {
  documentRevision: number
  fontRevision: number
}

/** Half-open host element interval in logical order, never visual order. */
export interface LayoutSource {
  scope: LayoutScopeId
  nodeId: string
  start: number
  end: number
}

export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

/** Refers to the actual registered face/fragment, not a CSS family fallback. */
export interface LayoutFontRef {
  faceId: string
  family: string
  weight: number
  style: 'normal' | 'italic'
  fontRevision: number
}

/** An insertion position within an element; offset counts UTF-16 code units. */
export interface LayoutTextPosition {
  elementIndex: number
  offset: number
}

export interface LayoutCaret {
  position: LayoutTextPosition
  /** Same logical insertion point can have two visual BiDi positions. */
  affinity: 'upstream' | 'downstream'
  x: number
  y: number
  height: number
  bidiLevel: number
}

export interface LayoutGlyph {
  glyphId: number
  fontSize: number
  font: LayoutFontRef
  /** Position relative to the line origin/baseline; Y is positive down. */
  x: number
  y: number
  advance: number
  offsetX: number
  offsetY: number
  /** Index into TextLine.clusters, independent of visual glyph order. */
  clusterIndex: number
  color: string
}

export interface LayoutCluster {
  /** Half-open UTF-16 interval in paragraph text, at scalar boundaries. */
  textStart: number
  textEnd: number
  /** All host elements covered by this cluster, including ligatures. */
  logicalIndices: number[]
  /** Half-open interval into TextLine.glyphs (visual order). */
  glyphStart: number
  glyphEnd: number
  font: LayoutFontRef
  rect: LayoutRect
  /** Legal grapheme/cluster caret stops; never split a surrogate pair. */
  carets: LayoutCaret[]
}

export interface LayoutNodeBase {
  placement?: { pageNo: number; columnIndex: number }
  id: string
  source: LayoutSource
  revision: LayoutRevision
  /** Content box in scope coordinates; excludes paragraph spacing. */
  rect: LayoutRect
  /** Hidden nodes retain source identity but consume no space or ink. */
  hidden: boolean
}

export interface TextLine extends LayoutNodeBase {
  kind: 'textLine'
  /** Generated list chrome, source-linked to the logical paragraph anchor. */
  marker?: TextLine
  labels?: { source: LayoutSource; rect: LayoutRect; baseline: number }[]
  paragraphId: string
  direction: 'ltr' | 'rtl'
  /** Baseline relative to rect.y; contentHeight equals rect.height. */
  baseline: number
  contentHeight: number
  /** Applied once to the first/last line of a paragraph, respectively. */
  spacingBefore: number
  spacingAfter: number
  glyphs: LayoutGlyph[]
  clusters: LayoutCluster[]
  /** Objects/placeholders are typed boxes, never fake text glyphs. */
  inlines: Array<InlineObject | MissingGlyphBox>
  /** Carets and clusters use the owning scope coordinates. */
  carets: LayoutCaret[]
  /** Empty paragraphs still have a content box and an insertion caret. */
  empty: boolean
}

export interface InlineObject extends LayoutNodeBase {
  kind: 'inlineObject'
  objectType: 'image' | 'latex' | 'checkbox' | 'radio' | 'tab' | 'controlSpace'
  advance: number
  ascent: number
  descent: number
  anchor: LayoutCaret
}

export interface BlockBox extends LayoutNodeBase {
  anchor?: LayoutCaret
  outOfFlow?: boolean
  spacingBefore?: number
  spacingAfter?: number
  areaId?: string
  backgroundColor?: string
  borderColor?: string
  objectType?: 'image' | 'latex'
  floatPosition?: { x: number; y: number; pageNo?: number }
  kind: 'block'
  blockType: 'iframe' | 'video' | 'area' | 'float' | 'separator'
  children: LayoutNode[]
}

export interface TableCellLayout {
  clip?: LayoutRect
  repeated?: boolean
  verticalAlign?: 'top' | 'middle' | 'bottom'
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderTypes?: string[]
  slashTypes?: string[]
  id: string
  /** Scope for cell-local children, with origin at the content box. */
  scope: LayoutScopeId
  row: number
  column: number
  rowspan: number
  colspan: number
  /** Cell border/content boxes are expressed in the table's owning scope. */
  rect: LayoutRect
  contentRect: LayoutRect
  children: LayoutNode[]
}

export interface TableFragment extends LayoutNodeBase {
  spacingAfter?: number
  borderColor?: string
  borderWidth?: number
  borderType?: string
  kind: 'tableFragment'
  tableId: string
  pageNo: number
  /** Half-open logical row interval; repeated headers do not extend it. */
  startRow: number
  endRow: number
  /** First row: skipped height. Last row: exclusive cutoff, null = full row. */
  startRowOffset: number
  endRowOffset: number | null
  repeatedRows: number[]
  cells: TableCellLayout[]
}

export interface BreakNode extends LayoutNodeBase {
  kind: 'break'
  breakType: 'page' | 'column' | 'paragraph'
  /** Takes effect after this break. */
  paperDirection?: 'vertical' | 'horizontal'
  caret: LayoutCaret
}

export interface MissingGlyphBox extends LayoutNodeBase {
  kind: 'missingGlyph'
  /** Original text is preserved; this is never a replacement document value. */
  text: string
  diagnosticId: string
  /** Explicit placeholder geometry, not an estimate of the missing text. */
  advance: number
  carets: LayoutCaret[]
}

export type LayoutNode =
  | TextLine
  | InlineObject
  | BlockBox
  | TableFragment
  | BreakNode
  | MissingGlyphBox

export interface LayoutScope {
  id: LayoutScopeId
  kind: 'main' | 'header' | 'footer' | 'cell' | 'block'
  parentId?: LayoutScopeId
  /** Placement in parent scope (or page), with child-local origin at 0,0. */
  rect: LayoutRect
  children: LayoutNode[]
}

export interface LayoutPage {
  pageNo: number
  direction: 'vertical' | 'horizontal'
  rect: LayoutRect
  /** Multiple placements allow repeated header/footer scopes across pages. */
  placements: { scope: LayoutScopeId; rect: LayoutRect; columnIndex: number }[]
}

export interface DocumentLayout {
  revision: LayoutRevision
  scopes: LayoutScope[]
  pages: LayoutPage[]
}
