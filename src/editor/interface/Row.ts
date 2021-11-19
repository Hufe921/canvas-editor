import { RowFlex } from "../dataset/enum/Row"
import { IElement } from "./Element"

export type IRowElement = IElement & {
  metrics: TextMetrics
}

export interface IRow {
  width: number;
  height: number;
  ascent: number;
  rowFlex?: RowFlex
  elementList: IRowElement[];
}
