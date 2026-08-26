import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import type { DeepRequired } from '../../../interface/Common'
import type { IEditorOption } from '../../../interface/Editor'
import type { IElement, IElementPosition } from '../../../interface/Element'
import type { ITablePositionContext } from '../../../interface/Position'
import type {
  ISpellcheckContext,
  ISpellcheckRange,
  ISpellcheckWord
} from '../../../interface/Spellcheck'
import { isNumber } from '../../../utils'
import type { Position } from '../../position/Position'
import type { Draw } from '../Draw'

export class Spellcheck {
  private options: DeepRequired<IEditorOption>
  private draw: Draw
  private position: Position
  private segmenter: Intl.Segmenter | null
  private spellcheckRangeList: ISpellcheckRange[]

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.position = draw.getPosition()
    this.segmenter = null
    this.spellcheckRangeList = []
  }

  private _isElementHidden(element: IElement): boolean {
    return !!(
      element.hide ||
      element.control?.hide ||
      element.area?.hide ||
      this.draw.getTraceParticle().isTraceHidden(element)
    )
  }

  public getSpellcheckRangeList(): ISpellcheckRange[] {
    if (this.options.spellcheck.disabled) {
      this.spellcheckRangeList = []
    }
    return this.spellcheckRangeList
  }

  private _appendWordList(
    elementList: IElement[],
    offset: number,
    endIndex: number,
    wordList: ISpellcheckWord[],
    context?: ISpellcheckContext
  ) {
    if (!this.segmenter) return
    const textList: string[] = []
    const elementEndOffsetList: number[] = []
    let textLength = 0
    for (let i = offset; i < endIndex; i++) {
      const element = elementList[i]
      const value =
        !this._isElementHidden(element) &&
        (!element.type ||
          (element.type !== ElementType.CONTROL &&
            TEXTLIKE_ELEMENT_TYPE.includes(element.type)))
          ? element.value
          : ZERO
      textList.push(value)
      textLength += value.length
      elementEndOffsetList.push(textLength - 1)
    }
    const text = textList.join('')
    let elementIndex = 0
    for (const { segment, index, isWordLike } of this.segmenter.segment(text)) {
      if (!isWordLike) continue
      while (elementEndOffsetList[elementIndex] < index) {
        elementIndex++
      }
      const wordStartIndex = elementIndex
      const endOffset = index + segment.length - 1
      while (elementEndOffsetList[elementIndex] < endOffset) {
        elementIndex++
      }
      wordList.push({
        word: segment,
        startIndex: offset + wordStartIndex,
        endIndex: offset + elementIndex,
        ...context
      })
    }
  }

  private _collectWordList(
    elementList: IElement[],
    wordList: ISpellcheckWord[],
    context?: ISpellcheckContext
  ) {
    let groupStartIndex = 0
    for (let i = 0; i < elementList.length; i++) {
      const element = elementList[i]
      if (element.type !== ElementType.TABLE) continue
      this._appendWordList(elementList, groupStartIndex, i, wordList, context)
      if (!this._isElementHidden(element)) {
        const trList = element.trList || []
        for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tablePath = [
              ...(context?.tablePath || []),
              {
                index: i,
                trIndex: r,
                tdIndex: d,
                tdId: td.id,
                trId: tr.id,
                tableId: element.id
              }
            ]
            this._collectWordList(td.value, wordList, {
              tableId: element.id,
              tableIndex: tablePath[0].index,
              trIndex: r,
              tdIndex: d,
              tablePath
            })
          }
        }
      }
      groupStartIndex = i + 1
    }
    this._appendWordList(
      elementList,
      groupStartIndex,
      elementList.length,
      wordList,
      context
    )
  }

  public getSpellcheckWordList(): ISpellcheckWord[] {
    if (this.options.spellcheck.disabled) return []
    if (!this.segmenter && Intl.Segmenter) {
      this.segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
    }
    if (!this.segmenter) return []
    const elementList = this.draw.getOriginalMainElementList()
    const wordList: ISpellcheckWord[] = []
    this._collectWordList(elementList, wordList)
    return wordList
  }

  public setSpellcheckRangeList(payload: ISpellcheckRange[] | null): boolean {
    const nextRangeList =
      !this.options.spellcheck.disabled && payload
        ? payload.filter(range => {
            const hasTableContext =
              range.tableId !== undefined ||
              range.tableIndex !== undefined ||
              range.trIndex !== undefined ||
              range.tdIndex !== undefined
            const isValidTableContext =
              !hasTableContext ||
              (typeof range.tableId === 'string' &&
                Number.isInteger(range.tableIndex) &&
                Number.isInteger(range.trIndex) &&
                Number.isInteger(range.tdIndex))
            return (
              Number.isInteger(range.startIndex) &&
              Number.isInteger(range.endIndex) &&
              range.startIndex >= 0 &&
              range.startIndex <= range.endIndex &&
              isValidTableContext
            )
          })
        : []
    if (!nextRangeList.length && !this.spellcheckRangeList.length) return false
    this.spellcheckRangeList = nextRangeList
    return true
  }

  // 命中检测：光标元素索引所在的错词区间
  private _isSameTablePath(
    source?: ITablePositionContext[],
    target?: ITablePositionContext[]
  ): boolean {
    if (!source) return true
    if (!target || source.length !== target.length) return false
    for (let i = 0; i < source.length; i++) {
      const sourceItem = source[i]
      const targetItem = target[i]
      if (sourceItem.index !== targetItem.index) return false
      if (sourceItem.trIndex !== targetItem.trIndex) return false
      if (sourceItem.tdIndex !== targetItem.tdIndex) return false
      if (sourceItem.tableId !== targetItem.tableId) return false
    }
    return true
  }

  public getRangeByIndex(
    index: number,
    context?: ISpellcheckContext
  ): ISpellcheckRange | null {
    if (this.options.spellcheck.disabled) return null
    for (const range of this.spellcheckRangeList) {
      if (range.tableId !== context?.tableId) continue
      if (range.tableIndex !== context?.tableIndex) continue
      if (range.trIndex !== context?.trIndex) continue
      if (range.tdIndex !== context?.tdIndex) continue
      if (!this._isSameTablePath(range.tablePath, context?.tablePath)) continue
      if (index < range.startIndex || index > range.endIndex) continue
      return range
    }
    return null
  }

  // 波浪线
  private _drawWave(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    width: number
  ) {
    if (width <= 0) return
    const { scale } = this.options
    const AMPLITUDE = 1.2 * scale // 振幅
    const adjustY = startY + AMPLITUDE
    const halfWaveWidth = 2 * scale
    const endX = startX + width
    let x = startX
    let direction = 1
    ctx.beginPath()
    ctx.moveTo(x, adjustY)
    while (x < endX) {
      const nextX = Math.min(x + halfWaveWidth, endX)
      ctx.quadraticCurveTo(
        (x + nextX) / 2,
        adjustY + AMPLITUDE * direction,
        nextX,
        adjustY
      )
      direction *= -1
      x = nextX
    }
    ctx.stroke()
  }

  public render(ctx: CanvasRenderingContext2D, pageIndex: number) {
    if (this.options.spellcheck.disabled || !this.spellcheckRangeList.length) {
      return
    }
    const mainPositionList = this.position.getOriginalMainPositionList()
    const elementList = this.draw.getOriginalMainElementList()
    ctx.save()
    ctx.strokeStyle = this.options.spellcheck.color
    ctx.lineWidth = this.options.scale
    for (const range of this.spellcheckRangeList) {
      let positionList: IElementPosition[] = mainPositionList
      if (range.tableIndex !== undefined) {
        positionList =
          this.position.getTableTdByContext(elementList, {
            isTable: true,
            index: range.tableIndex,
            tableId: range.tableId,
            trIndex: range.trIndex,
            tdIndex: range.tdIndex,
            tablePath: range.tablePath
          })?.positionList || []
      }
      if (range.startIndex >= positionList.length) {
        continue
      }
      const endIndex = Math.min(range.endIndex, positionList.length - 1)
      const startPageNo = positionList[range.startIndex]?.pageNo
      const endPageNo = positionList[endIndex]?.pageNo
      if (
        isNumber(startPageNo) &&
        isNumber(endPageNo) &&
        (pageIndex < startPageNo || pageIndex > endPageNo)
      ) {
        continue
      }
      // 错词可能换行，按行分段绘制
      let segmentX = -1
      let segmentY = 0
      let segmentEndX = 0
      const drawSegment = () => {
        if (!~segmentX) return
        this._drawWave(ctx, segmentX, segmentY, segmentEndX - segmentX)
        segmentX = -1
      }
      for (let i = range.startIndex; i <= endIndex; i++) {
        const position = positionList[i]
        if (!position) continue
        const {
          pageNo,
          ascent,
          metrics: { boundingBoxDescent },
          coordinate: { leftTop, rightTop }
        } = position
        if (pageNo !== pageIndex) {
          drawSegment()
          continue
        }
        const baselineY = leftTop[1] + ascent + boundingBoxDescent
        if (!~segmentX) {
          segmentX = leftTop[0]
          segmentY = baselineY
          segmentEndX = rightTop[0]
        } else if (baselineY !== segmentY) {
          drawSegment()
          segmentX = leftTop[0]
          segmentY = baselineY
          segmentEndX = rightTop[0]
        } else {
          segmentEndX = rightTop[0]
        }
      }
      drawSegment()
    }
    ctx.restore()
  }
}
