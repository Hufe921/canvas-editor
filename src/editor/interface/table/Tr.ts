import { ITd } from './Td'

export interface ITr {
  id?: string
  height: number
  tdList: ITd[]
  minHeight?: number
  pagingRepeat?: boolean // 在各页顶端以标题行的形式重复出现
  pagingOriginHeight?: number // 被拆分到下一页的行的原始高度
  pagingOriginId?: string // 被拆分到下一页的行的原始id
}
