import { VerticalAlign } from '../../dataset/enum/VerticalAlign'
import { IElement, IElementPosition } from '../Element'
import { IRow } from '../Row'

export interface ITd {
  id?: string
  x?: number
  y?: number
  width?: number
  height?: number
  colspan: number
  rowspan: number
  value: IElement[]
  isLastRowTd?: boolean
  isLastColTd?: boolean
  isLastTd?: boolean
  rowIndex?: number
  colIndex?: number
  rowList?: IRow[]
  positionList?: IElementPosition[]
  verticalAlign?: VerticalAlign
  backgroundColor?: string
  mainHeight?: number // 内容 + 内边距高度
  realHeight?: number // 真实高度（包含跨列）
  realMinHeight?: number // 真实最小高度（包含跨列）
  borderBgTop?: string
  borderBgBottom?: string
  borderBgRight?: string
  borderBgLeft?: string
  borderWidthTop?: number
  borderWidthBottom?: number
  borderWidthLeft?: number
  borderWidthRight?: number
}
