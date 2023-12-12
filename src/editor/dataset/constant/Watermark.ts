import { IWatermark } from '../../interface/Watermark'

export const defaultWatermarkOption: Readonly<Required<IWatermark>> = {
  data: '',
  color: '#AEB5C0',
  opacity: 0.3,
  size: 200,
  font: 'Microsoft YaHei'
}
