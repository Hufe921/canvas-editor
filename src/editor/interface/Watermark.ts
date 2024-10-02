export interface IWatermark {
  data: string
  color?: string
  opacity?: number
  size?: number
  font?: string
  repeat?: boolean
  gap?: [horizontal: number, vertical: number]
}
