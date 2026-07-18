import { ITraceOption } from '../../interface/Trace'

export const defaultTraceOption: Readonly<Required<ITraceOption>> = {
  disabled: true,
  insertColor: '#2B5CE6',
  deleteColor: '#E03F3F',
  author: '',
  lineWidth: 2
}
