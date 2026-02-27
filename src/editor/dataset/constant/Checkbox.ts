import { ICheckboxOption } from '../../interface/Checkbox'
import { VerticalAlign } from '../enum/VerticalAlign'

export const defaultCheckboxOption: Readonly<Required<ICheckboxOption>> = {
  width: 14,
  height: 14,
  gap: 5,
  lineWidth: 1,
  fillStyle: '#fff',//勾选框填充色
  strokeStyle: '#000',//勾选框边框色
  checkMarkColor: '#000',//勾选图标颜色
  verticalAlign: VerticalAlign.BOTTOM
}
