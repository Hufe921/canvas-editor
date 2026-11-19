import { IElementPosition } from '../../../interface/Element'
import type { BidiCaretAffinity } from '../../../interface/Range'

export interface IBidiCaret {
  index: number
  affinity: BidiCaretAffinity
  hitLineStartIndex?: number
  x: number
}

export function getBidiCaretX(
  position: IElementPosition,
  affinity: BidiCaretAffinity = 'after',
  nextPosition?: IElementPosition
): number {
  if (affinity === 'before') {
    const target = nextPosition || position
    return (target.bidiLevel || 0) % 2 === 1
      ? target.coordinate.rightTop[0]
      : target.coordinate.leftTop[0]
  }
  return (position.bidiLevel || 0) % 2 === 1
    ? position.coordinate.leftTop[0]
    : position.coordinate.rightTop[0]
}

export function getBidiCaretList(
  rowPositionList: IElementPosition[]
): IBidiCaret[] {
  const caretList: IBidiCaret[] = []
  for (let i = 0; i < rowPositionList.length; i++) {
    const position = rowPositionList[i]
    caretList.push({
      index: position.index - 1,
      affinity: 'before',
      hitLineStartIndex: position.isFirstLetter ? position.index : undefined,
      x: getBidiCaretX(position, 'before')
    })
    caretList.push({
      index: position.index,
      affinity: 'after',
      x: getBidiCaretX(position)
    })
  }
  return caretList.sort((a, b) => a.x - b.x)
}

export function getNearestBidiCaret(
  rowPositionList: IElementPosition[],
  x: number
): IBidiCaret | null {
  const caretList = getBidiCaretList(rowPositionList)
  let nearest: IBidiCaret | null = null
  for (const caret of caretList) {
    if (!nearest || Math.abs(caret.x - x) < Math.abs(nearest.x - x)) {
      nearest = caret
    }
  }
  return nearest
}

export function getVisualBidiCaret(
  positionList: IElementPosition[],
  cursorPosition: IElementPosition,
  step: -1 | 1,
  affinity: BidiCaretAffinity = 'after',
  hitLineStartIndex?: number
): IBidiCaret | null {
  const rowPositionList = positionList.filter(
    position =>
      position.pageNo === cursorPosition.pageNo &&
      position.rowNo === cursorPosition.rowNo
  )
  if (!rowPositionList.length) return null
  const caretList = getBidiCaretList(rowPositionList)
  const currentIndex = hitLineStartIndex !== undefined
    ? hitLineStartIndex - 1
    : cursorPosition.index
  const currentAffinity = hitLineStartIndex !== undefined ? 'before' : affinity
  let currentCaretIndex = caretList.findIndex(
    caret => caret.index === currentIndex && caret.affinity === currentAffinity
  )
  if (currentCaretIndex < 0) {
    const x = getBidiCaretX(
      cursorPosition,
      currentAffinity,
      rowPositionList.find(position => position.index === currentIndex + 1)
    )
    let distance = Infinity
    caretList.forEach((caret, index) => {
      const nextDistance = Math.abs(caret.x - x)
      if (nextDistance < distance) {
        distance = nextDistance
        currentCaretIndex = index
      }
    })
  }
  const currentCaret = caretList[currentCaretIndex]
  if (!currentCaret) return null
  let targetIndex = currentCaretIndex + step
  while (
    caretList[targetIndex] &&
    Math.abs(caretList[targetIndex].x - currentCaret.x) < 0.5
  ) {
    targetIndex += step
  }
  return caretList[targetIndex] || null
}
