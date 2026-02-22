import { ZERO } from '../dataset/constant/Common'
import { IElement } from '../interface/Element'

/**
 * 获取段落索引
 * @param elementList - 元素列表
 * @param index - 目标索引
 * @returns 段落索引
 */
export function getParagraphNo(elementList: IElement[], index: number): number {
  let paragraphNo = 0
  // 初始换行占位符不计算
  for (let i = 1; i < index; i++) {
    const curElement = elementList[i]
    const preElement = elementList[i - 1]
    // 正常换行（非列表） || 列表导致的段落变化 || 标题导致的段落变化
    if (
      (curElement.value === ZERO &&
        !curElement.listWrap &&
        !curElement.listId) ||
      (curElement.listId !== preElement?.listId && preElement.value !== ZERO) ||
      (curElement.titleId !== preElement?.titleId && preElement.value !== ZERO)
    ) {
      paragraphNo++
    }
  }
  return paragraphNo
}
