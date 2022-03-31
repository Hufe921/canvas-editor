import { ControlType } from '../dataset/enum/Control'
import { IElement } from './Element'

export interface IValueSet {
  value: string;
  code: string;
}

export interface IControlSelect {
  valueSets: IValueSet[];
}

export interface IControlBasic {
  type: ControlType;
  value: IElement[] | null;
  placeholder: string;
  conceptId?: string;
  prefix?: string;
  postfix?: string;
}

export type IControl = IControlBasic & Partial<IControlSelect>

export interface IControlOption {
  placeholderColor?: string;
  bracketColor?: string;
}