import { ShapedGlyph, StyleRun } from '../types'

export interface ITextShaper {
  shape(run: StyleRun): ShapedGlyph[]
}
