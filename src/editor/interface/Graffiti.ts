export interface IGraffitiStroke {
  lineWidth?: number
  lineColor?: string
  points: number[]
}

export interface IGraffitiData {
  pageNo: number
  strokes: IGraffitiStroke[]
}

export interface IGraffitiOption {
  defaultLineWidth?: number
  defaultLineColor?: string
}
