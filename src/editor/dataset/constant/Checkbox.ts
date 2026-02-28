import { ICheckboxOption } from '../../interface/Checkbox'
import { VerticalAlign } from '../enum/VerticalAlign'

export const defaultCheckboxOption: Readonly<Required<ICheckboxOption>> = {
  width: 14,
  height: 14,
  gap: 5,
  lineWidth: 1,
  fillStyle: '#ffffff', // 未选中时填充色
  strokeStyle: '#000000', // 未选中时边框色
  checkFillStyle: '#5175f4', // 选中时填充色
  checkStrokeStyle: '#5175f4', // 选中时边框色
  checkMarkColor: '#ffffff', // 选中时对勾颜色
  verticalAlign: VerticalAlign.BOTTOM
}
