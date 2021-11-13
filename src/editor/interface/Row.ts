import { IElement } from "./Element"

export type IRowElement = IElement & {
  metrics: TextMetrics
}

export interface IRow {
  width: number;
  height: number;
  ascent: number;
  elementList: IRowElement[];
}
