import type { ITablePositionContext } from './Position'

export interface ISpellcheckOption {
  disabled?: boolean
  color?: string
}

export interface ISpellcheckContext {
  tableId?: string
  tableIndex?: number
  trIndex?: number
  tdIndex?: number
  tablePath?: ITablePositionContext[]
}

export interface ISpellcheckWord extends ISpellcheckContext {
  word: string
  startIndex: number
  endIndex: number
}

// 拼写检查错词区间（叠加层渲染，不修改文档数据）
export interface ISpellcheckRange extends ISpellcheckContext {
  startIndex: number
  endIndex: number
  // 插件自定义数据，点击事件原样回传
  data?: unknown
}

export interface ISpellcheckClickPayload {
  evt: MouseEvent
  range: ISpellcheckRange
}

export type ISpellcheckClick = (payload: ISpellcheckClickPayload) => void
