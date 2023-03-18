import { EditorZone } from '../dataset/enum/Editor'

export interface IRange {
  startIndex: number;
  endIndex: number;
  isCrossRowCol?: boolean;
  tableId?: string;
  startTdIndex?: number;
  endTdIndex?: number;
  startTrIndex?: number;
  endTrIndex?: number;
  zone?: EditorZone;
}

export type RangeRowMap = Map<number, Set<number>>
