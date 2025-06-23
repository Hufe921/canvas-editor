import { IWatermark } from '../../interface/Watermark'
import { NumberType } from '../enum/Common'
import { WatermarkType } from '../enum/Watermark'

export const defaultWatermarkOption: Readonly<Required<IWatermark>> = {
  data: '',
  type: WatermarkType.TEXT,
  width: 0,
  height: 0,
  color: '#AEB5C0',
  opacity: 0.3,
  size: 200,
  font: 'Microsoft YaHei',
  repeat: false,
  gap: [10, 10],
  numberType: NumberType.ARABIC
}
