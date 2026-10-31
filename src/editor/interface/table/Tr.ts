import { ITd } from './Td'

export interface ITr {
  id?: string
  extension?: unknown
  externalId?: string
  height: number
  tdList: ITd[]
  minHeight?: number
  pagingRepeat?: boolean // 在各页顶端以标题行的形式重复出现
  /** Keep the row in one page/column when it fits an empty slot. */
  keepTogether?: boolean
}
