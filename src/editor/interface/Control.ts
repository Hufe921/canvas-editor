import { ControlType } from '../dataset/enum/Control'
import { IElement } from './Element'

export interface IValueSet {
  value: string;
  code: string;
}

export interface IControl {
  type: ControlType;
  value: IElement[] | null;
  placeholder: string;
  conceptId?: string;
  prefix?: string;
  postfix?: string;
  valueSets?: IValueSet[];
}

export interface IControlOption {
  placeholderColor?: string;
  bracketColor?: string;
}