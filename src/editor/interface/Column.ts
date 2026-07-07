export interface IColumnOption {
  count: number
  gap?: number
  separator?: boolean
  separatorColor?: string
  separatorWidth?: number
}

export interface IColumnLayout {
  count: number
  width: number
  gap: number
  separator: boolean
  offsets: number[]
}
