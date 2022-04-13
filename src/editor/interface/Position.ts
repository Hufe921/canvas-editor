import { IElement } from '..'
import { IElementPosition } from './Element'
import { ITd } from './table/Td'

export interface ICurrentPosition {
  index: number;
  isCheckbox?: boolean;
  isControl?: boolean;
  isImage?: boolean;
  isTable?: boolean;
  isDirectHit?: boolean;
  trIndex?: number;
  tdIndex?: number;
  tdValueIndex?: number;
  tdId?: string;
  trId?: string;
  tableId?: string;
}

export interface IGetPositionByXYPayload {
  x: number;
  y: number;
  isTable?: boolean;
  td?: ITd;
  tablePosition?: IElementPosition;
  elementList?: IElement[];
  positionList?: IElementPosition[];
}

export interface IPositionContext {
  isTable: boolean;
  isControl?: boolean;
  index?: number;
  trIndex?: number;
  tdIndex?: number;
  tdId?: string;
  trId?: string;
  tableId?: string;
}