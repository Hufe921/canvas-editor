import type { EditorZone } from '../../../../dataset/enum/Editor'

export interface IRowKeyPayload {
  zoneKey: string
  containerKey: string
  occurrence: number
}

export interface ITableFragmentKeyPayload {
  containerKey: string
  tableId?: string
  tablePath: string[]
  startTrIndex: number
  endTrIndex: number
  startSplitTrOffset?: number
  endSplitTrHeight?: number
}

export interface IRepeatHeaderKeyPayload {
  fragmentKey: string
  trIndex: number
  tdIndex: number
  tdId?: string
}

export function buildSourceTextKey(sourceKeyId: number): string {
  return `source-text:${sourceKeyId}`
}

export function buildPageKey(pageNo: number): string {
  return `page:${pageNo}`
}

export function buildLayerKey(pageNo: number, layer: string): string {
  return `${buildPageKey(pageNo)}:layer:${layer}`
}

export function buildZoneKey(zone: EditorZone, pageNo: number): string {
  return `zone:${pageNo}:${zone}`
}

export function buildRowKey(payload: IRowKeyPayload): string {
  const { zoneKey, containerKey, occurrence } = payload
  return `row:${zoneKey}:${containerKey}:${occurrence}`
}

export function buildTableFragmentKey(
  payload: ITableFragmentKeyPayload
): string {
  const {
    containerKey,
    tableId,
    tablePath,
    startTrIndex,
    endTrIndex,
    startSplitTrOffset,
    endSplitTrHeight
  } = payload
  const identity = JSON.stringify([
    tableId ?? '',
    tablePath,
    startTrIndex,
    endTrIndex,
    startSplitTrOffset ?? 0,
    endSplitTrHeight ?? 0
  ])
  return `fragment:${containerKey}:${identity}`
}

export function buildRepeatHeaderKey(payload: IRepeatHeaderKeyPayload): string {
  const { fragmentKey, trIndex, tdIndex, tdId } = payload
  return `repeat:${fragmentKey}:${trIndex}:${tdIndex}:${tdId ?? ''}`
}
