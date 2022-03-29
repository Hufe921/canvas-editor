import { ControlType } from '../dataset/enum/Control'

export interface IValueSet {
  value: string;
  code: string;
}

export interface IControl {
  type: ControlType;
  value: string;
  conceptId: string;
  prefix?: string;
  postfix?: string;
  valueSets?: IValueSet[]
}