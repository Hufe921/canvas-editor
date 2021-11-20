import { RowFlex } from "../dataset/enum/Row"
import { IElement, IElementMetrics } from "./Element"

export type IRowElement = IElement & {
  metrics: IElementMetrics
}

export interface IRow {
  width: number;
  height: number;
  ascent: number;
  rowFlex?: RowFlex
  elementList: IRowElement[];
}
