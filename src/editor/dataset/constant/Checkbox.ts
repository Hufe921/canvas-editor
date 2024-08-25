import { ICheckboxOption } from '../../interface/Checkbox'
import { VerticalAlign } from '../enum/VerticalAlign'

export const defaultCheckboxOption: Readonly<Required<ICheckboxOption>> = {
  width: 14,
  height: 14,
  gap: 5,
  lineWidth: 1,
  fillStyle: '#5175f4',
  strokeStyle: '#ffffff',
  verticalAlign: VerticalAlign.BOTTOM
}
