import { IRulerOption } from '../../interface/Ruler'
import { RulerUnit } from '../enum/Ruler'

export const defaultRulerOption: Readonly<Required<IRulerOption>> = {
  disabled: true,
  size: 22,
  font: 'Microsoft YaHei',
  fontSize: 9,
  color: '#999999',
  textColor: '#666666',
  backgroundColor: '#FFFFFF',
  outsideBackgroundColor: '#EAEAEA',
  marginColor: '#666666',
  unit: RulerUnit.CM,
  enableMarginDrag: true
}
