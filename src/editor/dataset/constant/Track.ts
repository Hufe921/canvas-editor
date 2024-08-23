import {ITrackStyleOption} from '../../interface/Track'
import {TrackType} from '../enum/Track'

export const defaultTrackStyleOptions: Readonly<Required<ITrackStyleOption>> = {
  insertColor:'#0000ff',
  deleteColor:'#ff0000'
}

export const trackTypeStr: Record<TrackType, string> = {
  [TrackType.INSERT]: '新增',
  [TrackType.DELETE]: '删除'
}