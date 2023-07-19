import { BlockType } from '../dataset/enum/Block'

export interface IIFrameBlock {
  src: string
}

export interface IVideoBlock {
  src: string
}

export interface IBlock {
  type: BlockType
  iframeBlock?: IIFrameBlock
  videoBlock?: IVideoBlock
}
