import { ZERO } from '../../../dataset/constant/Common'
import { IRowElement } from '../../../interface/Row'

const TATWEEL = '\u0640'
const ARABIC_LETTER_REG =
  /^[\u0620-\u064A\u066E-\u06D3\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF]$/
// 只向右连接的字母不能在其后插入 Kashida，否则会产生错误的连接形态
const RIGHT_JOINING_REG =
  /^[\u0622-\u0625\u0627\u0629\u062F-\u0632\u0648\u0671-\u0673\u0675-\u0677\u0688-\u0699\u06C0-\u06CB\u06CD-\u06CF\u06D2-\u06D3]$/

function isVisibleText(element: IRowElement): boolean {
  return (
    element.value !== ZERO &&
    !element.hide &&
    !element.control?.hide &&
    !element.area?.hide
  )
}

function getLastChar(value: string): string {
  return Array.from(value).pop() || ''
}

function canInsertKashida(previous: IRowElement, next: IRowElement): boolean {
  if (!isVisibleText(previous) || !isVisibleText(next)) return false
  const previousChar = getLastChar(previous.value)
  const nextChar = next.value.charAt(0)
  return (
    ARABIC_LETTER_REG.test(previousChar) &&
    !RIGHT_JOINING_REG.test(previousChar) &&
    ARABIC_LETTER_REG.test(nextChar)
  )
}

// 返回实际增加的宽度。优先词间空格；无空格时用原生整形绘制 Kashida
export function justifyDirectionalText(
  elementList: IRowElement[],
  extraWidth: number,
  kashidaWidth: number
): number {
  if (extraWidth <= 0 || elementList.length < 2) return 0
  const spaceList = elementList.filter(
    (element, index) =>
      index < elementList.length - 1 &&
      isVisibleText(element) &&
      /^\s+$/u.test(element.value)
  )
  if (spaceList.length) {
    const gap = extraWidth / spaceList.length
    for (const space of spaceList) space.metrics.width += gap
    return extraWidth
  }
  if (kashidaWidth <= 0) return 0
  const joinIndexList: number[] = []
  for (let i = 0; i < elementList.length - 1; i++) {
    if (canInsertKashida(elementList[i], elementList[i + 1])) {
      joinIndexList.push(i)
    }
  }
  if (!joinIndexList.length) return 0
  const count = Math.floor(extraWidth / (joinIndexList.length * kashidaWidth))
  if (!count) return 0
  const addedWidth = count * kashidaWidth
  const kashida = TATWEEL.repeat(count)
  for (const index of joinIndexList) {
    const element = elementList[index]
    element.justifyValue = `${element.value}${kashida}`
    element.metrics.width += addedWidth
  }
  return addedWidth * joinIndexList.length
}
