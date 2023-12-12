import { IPageNumber } from '../../interface/PageNumber'
import { NumberType } from '../enum/Common'
import { RowFlex } from '../enum/Row'

export const FORMAT_PLACEHOLDER = {
  PAGE_NO: '{pageNo}',
  PAGE_COUNT: '{pageCount}'
}

export const defaultPageNumberOption: Readonly<Required<IPageNumber>> = {
  bottom: 60,
  size: 12,
  font: 'Microsoft YaHei',
  color: '#000000',
  rowFlex: RowFlex.CENTER,
  format: FORMAT_PLACEHOLDER.PAGE_NO,
  numberType: NumberType.ARABIC,
  disabled: false,
  startPageNo: 1,
  fromPageNo: 0
}
