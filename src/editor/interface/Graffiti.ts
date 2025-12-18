export interface IGraffitiStroke {
  isBegin?: boolean
  lineWidth?: number
  lineColor?: string
  linePoints: [x: number, y: number]
}

export interface IGraffitiData {
  pageNo: number
  strokes: IGraffitiStroke[]
}

export interface IGraffitiOption {
  defaultLineWidth?: number
  defaultLineColor?: string
}
