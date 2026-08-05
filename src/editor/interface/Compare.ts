import { IElement } from './Element'

export interface IComparePayload {
  oldData: IElement[] // 旧版本文档数据
  newData?: IElement[] // 新版本文档数据，缺省时使用当前编辑器内容
}
