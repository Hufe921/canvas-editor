export interface ILineHeight {
  /** Multiple of the font line box, or an absolute size in document pixels. */
  value: number
  rule: 'multiple' | 'exact' | 'atLeast'
}
