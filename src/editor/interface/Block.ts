import { BlockType } from '../dataset/enum/Block'

export interface IIFrameBlock {
  src?: string
  srcdoc?: string
  sandbox?: string[]
  allow?: string[]
}

export interface IVideoBlock {
  src: string
}

export interface IBlock {
  type: BlockType
  iframeBlock?: IIFrameBlock
  videoBlock?: IVideoBlock
}

export interface IIframeInfo {
  x: number
  y: number
  width: number
  height: number
  src?: string
  srcdoc?: string
}
