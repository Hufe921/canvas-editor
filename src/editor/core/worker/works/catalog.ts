import { ICatalog, ICatalogItem } from '../../../interface/Catalog'
import { IElement } from '../../../interface/Element'

enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  TABLE = 'table',
  HYPERLINK = 'hyperlink',
  SUPERSCRIPT = 'superscript',
  SUBSCRIPT = 'subscript',
  SEPARATOR = 'separator',
  PAGE_BREAK = 'pageBreak',
  CONTROL = 'control',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  LATEX = 'latex',
  TAB = 'tab',
  DATE = 'date',
  BLOCK = 'block',
  TITLE = 'title',
  LIST = 'list'
}

enum TitleLevel {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FOURTH = 'fourth',
  FIFTH = 'fifth',
  SIXTH = 'sixth'
}

const titleOrderNumberMapping: Record<TitleLevel, number> = {
  [TitleLevel.FIRST]: 1,
  [TitleLevel.SECOND]: 2,
  [TitleLevel.THIRD]: 3,
  [TitleLevel.FOURTH]: 4,
  [TitleLevel.FIFTH]: 5,
  [TitleLevel.SIXTH]: 6
}

const TEXTLIKE_ELEMENT_TYPE: ElementType[] = [
  ElementType.TEXT,
  ElementType.HYPERLINK,
  ElementType.SUBSCRIPT,
  ElementType.SUPERSCRIPT,
  ElementType.CONTROL,
  ElementType.DATE
]

const ZERO = '\u200B'

function isTextLikeElement(element: IElement): boolean {
  return !element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)
}

function getCatalog(elementList: IElement[]): ICatalog | null {
  // 筛选标题
  const titleElementList: IElement[] = []
  let t = 0
  while (t < elementList.length) {
    const element = elementList[t]
    if (element.titleId) {
      const titleId = element.titleId
      const level = element.level
      const titleElement: IElement = {
        type: ElementType.TITLE,
        value: '',
        level,
        titleId
      }
      const valueList: IElement[] = []
      while (t < elementList.length) {
        const titleE = elementList[t]
        if (titleId !== titleE.titleId) {
          t--
          break
        }
        valueList.push(titleE)
        t++
      }
      titleElement.value = valueList
        .filter(el => isTextLikeElement(el))
        .map(el => el.value)
        .join('')
        .replace(new RegExp(ZERO, 'g'), '')
      titleElementList.push(titleElement)
    }
    t++
  }
  if (!titleElementList.length) return null
  // 查找到比最新元素大的标题时终止
  const recursiveInsert = (title: IElement, catalogItem: ICatalogItem) => {
    const subCatalogItem =
      catalogItem.subCatalog[catalogItem.subCatalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[subCatalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (subCatalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, subCatalogItem)
    } else {
      catalogItem.subCatalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        subCatalog: []
      })
    }
  }
  // 循环标题组
  // 如果当前列表级别小于标题组最新标题级别：则递归查找最小级别并追加
  // 如果大于：则直接追加至当前标题组
  const catalog: ICatalog = []
  for (let e = 0; e < titleElementList.length; e++) {
    const title = titleElementList[e]
    const catalogItem = catalog[catalog.length - 1]
    const catalogItemLevel = titleOrderNumberMapping[catalogItem?.level]
    const titleLevel = titleOrderNumberMapping[title.level!]
    if (catalogItem && titleLevel > catalogItemLevel) {
      recursiveInsert(title, catalogItem)
    } else {
      catalog.push({
        id: title.titleId!,
        name: title.value,
        level: title.level!,
        subCatalog: []
      })
    }
  }
  return catalog
}

onmessage = evt => {
  const elementList = <IElement[]>evt.data
  const catalog = getCatalog(elementList)
  postMessage(catalog)
}
