import { RowFlex } from '../dataset/enum/Row'
import { IElement, IElementMetrics } from './Element'

export type IRowElement = IElement & {
  metrics: IElementMetrics;
  style: string;
}

export interface IRow {
  width: number;
  height: number;
  ascent: number;
  rowFlex?: RowFlex;
  startIndex: number;
  isPageBreak?: boolean;
  elementList: IRowElement[];
}
