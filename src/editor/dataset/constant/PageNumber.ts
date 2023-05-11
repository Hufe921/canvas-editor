import { IPageNumber } from '../../interface/PageNumber'
import { NumberType } from '../enum/Common'
import { RowFlex } from '../enum/Row'

export const FORMAT_PLACEHOLDER = {
  PAGE_NO: '{pageNo}',
  PAGE_COUNT: '{pageCount}'
}

export const defaultPageNumberOption: Readonly<Required<IPageNumber>> = {
  top: 30,
  bottom: 30,
  size: 12,
  font: 'Yahei',
  color: '#000000',
  rowFlex: RowFlex.CENTER,
  format: FORMAT_PLACEHOLDER.PAGE_NO,
  numberType: NumberType.ARABIC,
  position: 'bottom-center',
  startAt: 1,
  disabled: false
}