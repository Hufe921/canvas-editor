import { IPageNumber } from '../../interface/PageNumber'
import { RowFlex } from '../enum/Row'

export const defaultPageNumberOption: Readonly<Required<IPageNumber>> = {
  bottom: 60,
  size: 12,
  font: 'Yahei',
  color: '#000000',
  rowFlex: RowFlex.CENTER
}