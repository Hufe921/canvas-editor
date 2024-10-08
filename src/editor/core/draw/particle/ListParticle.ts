import { ZERO } from '../../../dataset/constant/Common'
import { ulStyleMapping, ulStyleIndexMapping } from '../../../dataset/constant/List'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { ListStyle, ListType, UlStyle } from '../../../dataset/enum/List'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow, IRowElement, IRowRef } from '../../../interface/Row'
import { getUUID } from '../../../utils'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'

const UN_COUNT_STYLE_WIDTH = 20
const MEASURE_BASE_TEXT = '0'
const LIST_GAP = 10

export class ListParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions()
  }

  public setList(listType: ListType | null, listStyle?: ListStyle): void {
    if (this.draw.isReadonly()) return

    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return

    const changeElementList = this.range.getRangeParagraphElementList()
    if (!changeElementList || !changeElementList.length) return

    const isUnsetList = changeElementList.find(
      el => el.listType === listType && el.listStyle === listStyle
    )

    if (isUnsetList || !listType) {
      this.unsetList()
      return
    }

    const listId = getUUID()
    changeElementList.forEach(el => {
      el.listId = listId
      el.listType = listType
      el.listStyle = listStyle
    })

    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public unsetList(): void {
    if (this.draw.isReadonly()) return

    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return

    const changeElementList = this.range
      .getRangeParagraphElementList()
      ?.filter(el => el.listId)
    if (!changeElementList || !changeElementList.length) return

    const elementList = this.draw.getElementList()
    const endElement = elementList[endIndex]
    if (endElement.listId) {
      this.insertNewLineIfNeeded(elementList, endIndex, endElement.listId)
    }

    changeElementList.forEach(el => {
      delete el.listId
      delete el.listType
      delete el.listStyle
      delete el.listWrap
    })

    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  private insertNewLineIfNeeded(elementList: IElement[], endIndex: number, listId: string): void {
    let start = endIndex + 1
    while (start < elementList.length) {
      const element = elementList[start]
      if (element.value === ZERO && !element.listWrap) break
      if (element.listId !== listId) {
        this.draw.spliceElementList(elementList, start, 0, {
          value: ZERO
        })
        break
      }
      start++
    }
  }

  public computeListStyle(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[]
  ): Map<string, number> {
    const listStyleMap = new Map<string, number>()
    let curListId: string | null = null
    let curElementList: IElement[] = []

    elementList.forEach((element, index) => {
      if (element.listId && element.listId !== curListId) {
        if (curElementList.length) {
          const width = this.getListStyleWidth(ctx, curElementList)
          listStyleMap.set(curListId!, width)
        }
        curListId = element.listId
        curElementList = [element]
      } else if (element.listId === curListId) {
        curElementList.push(element)
      }

      if (index === elementList.length - 1 && curElementList.length) {
        const width = this.getListStyleWidth(ctx, curElementList)
        listStyleMap.set(curListId!, width)
      }
    })

    return listStyleMap
  }

  public drawListStyle(
    ctx: CanvasRenderingContext2D,
    row: IRow,
    position: IElementPosition
  ) {
    const { elementList, offsetX, ascent } = row
    const { listIndex } = row
    // listIndex = listIndex! + 1
    const startElement = elementList[0]
    if (startElement.value !== ZERO || startElement.listWrap) return
    // tab width
    const tabWidth = this.draw.getTabWidth(elementList)
    const { defaultTabWidth, scale, defaultFont, defaultSize } = this.options
    // 列表样式渲染
    const {
      coordinate: {
        leftTop: [startX, startY]
      }
    } = position
    const x = startX - offsetX! + tabWidth
    const y = startY + ascent
    // 复选框样式特殊处理
    if (startElement.listStyle === ListStyle.CHECKBOX) {
      const { width, height, gap } = this.options.checkbox
      const checkboxRowElement: IRowElement = {
        ...startElement,
        checkbox: {
          value: !!startElement.checkbox?.value
        },
        metrics: {
          ...startElement.metrics,
          width: (width + gap * 2) * scale,
          height: height * scale
        }
      }
      this.draw.getCheckboxParticle().render({
        ctx,
        x: x - gap * scale,
        y,
        index: 0,
        row: {
          ...row,
          elementList: [checkboxRowElement, ...row.elementList]
        }
      })
    } else {
      let text = ''
      let subCount = ''
      const originalRowList = startElement.tableId
        ? this.draw.getTableRowListByElement(this.draw.getOriginalElementList(), startElement)
        : this.draw.getOriginalRowList()
      const rowListOfList = originalRowList.filter((iRow) => {
        if (iRow.elementList.length > 0) {
          return iRow.elementList[0].listId === row.elementList[0].listId
        }
        return false
      })
      if (rowListOfList.length > 0) {
        const firstRow = rowListOfList[0]
        const firstElementOfList = originalRowList[firstRow.rowIndex - 1]
        rowListOfList.splice(0, 0, firstElementOfList)
      }

      let discountX = 0
      if (startElement.listType === ListType.UL) {
        const countTab = (tabWidth / defaultTabWidth)
        if (countTab > 0) {
          const totalTypes = Object.keys(ulStyleIndexMapping).length - 1
          let indexListStyle = parseInt((Object.keys(ulStyleIndexMapping)).find((key) => {
            return ulStyleIndexMapping[parseInt(key, 10)] === (startElement.listStyle || UlStyle.DISC)
          }) || '0', 10)
          if (listIndex && listIndex > 0) {
            for (let i = 0; i < listIndex; i++) {
              if (indexListStyle < totalTypes) {
                indexListStyle++
              } else {
                indexListStyle = 0
              }
            }
            if (countTab > totalTypes) {
              indexListStyle -= 1
              for (let i = totalTypes; i < countTab; ++i) {
                if (i > 0) {
                  if (indexListStyle < totalTypes) {
                    indexListStyle++
                  } else {
                    indexListStyle = 0
                  }
                }
              }
            } else {
              for (let i = 0; i < countTab; i++) {
                if (indexListStyle < totalTypes) {
                  indexListStyle++
                } else {
                  indexListStyle = 0
                }
              }
            }
          }
          text = ulStyleMapping[ulStyleIndexMapping[indexListStyle]]
        } else {
          text =
            ulStyleMapping[<UlStyle>(<unknown>startElement.listStyle)] ||
            ulStyleMapping[UlStyle.DISC]
        }

      } else {
        let updateListIndex = listIndex
        const currentLevel = (tabWidth / defaultTabWidth)
        const calculateIndexes = this.calculateListsIndex(rowListOfList, defaultTabWidth)
        const calculatedRow = calculateIndexes[row.listIndex!]
        if (calculatedRow) {
          if (currentLevel > 0) {
            const parents = calculatedRow.parents
            parents.forEach((row: any) => {
              subCount += (calculateIndexes[row].listIndex + 1)
              if (subCount.endsWith('')) {
                subCount += KeyMap.PERIOD
              }
            })
            subCount += (calculatedRow.listIndex + 1) + KeyMap.PERIOD
          }
          if (calculatedRow.level === 0) {
            updateListIndex = calculatedRow.listIndex + 1
          }
        }
        discountX = subCount.length * 7
        if (subCount === '') {
          text = `${updateListIndex}${KeyMap.PERIOD}${subCount}`
        } else {
          text = `${subCount}`
        }
      }
      if (!text) return
      ctx.save()
      if (row.elementList.length > 1 + (tabWidth / defaultTabWidth) && row.elementList[1 + (tabWidth / defaultTabWidth)].style) {
        ctx.font = row.elementList[1 + (tabWidth / defaultTabWidth)].style
      } else {
        ctx.font = `${defaultSize * scale}px ${defaultFont}`
      }
      ctx.fillText(text, x - discountX, y)
      ctx.restore()
    }
  }

  private findChildren(rowList: IRowRef[], rowIndex: number, levelFind: number): number[] {
    const row = rowList[rowIndex]
    const children: number[] = []
    let currentLevel = 1
    for (let i = rowIndex + 1; i < rowList.length; i++) {
      const nextRow = rowList[i]
      if (nextRow) {
        if (row.level < nextRow.level) {
          currentLevel = nextRow.level - row.level
          if (currentLevel <= levelFind) {
            children.push(i)
            currentLevel += 1
          }
        } else {
          break
        }
      }
    }
    return children
  }

  private generateChildrenAndParents(rows: IRowRef[]): void {
    const getLevelMax = ((rows: IRowRef[]) => {
      return rows.reduce((accum, row) => {
        return accum > row.level ? accum : row.level
      }, 0)
    })
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      row.children = this.findChildren(rows, i, 1)
      row.subChildren = this.findChildren(rows, i, getLevelMax(rows))

      if (row.children.length < row.subChildren.length) {
        this.setParentsForSubChildren(row, rows)
      } else {
        this.setParentsForChildren(row, rows)
      }
    }
  }

  private setParentsRecursively(childrenIndexes: number[], parentIndex: number, rows: IRowRef[]): void {
    for (const childIndex of childrenIndexes) {
      const rowChild = rows[childIndex]
      rowChild.parents.push(parentIndex)
      const children = rowChild.children.length < rowChild.subChildren.length ? rowChild.subChildren : rowChild.children
      if (children.length > 0) {
        this.setParentsRecursively(children, rowChild.originalIndex, rows)
      }
    }
  }

  private setParentsForSubChildren(row: IRowRef, rows: IRowRef[]): void {
    row.subChildren.forEach((childIndex, index) => {
      const rowChild = rows[childIndex]
      rowChild.parents.push(row.originalIndex)
      rowChild.listIndex = index
      this.setParentsRecursively(rowChild.subChildren, row.originalIndex, rows)
    })
  }

  private setParentsForChildren(row: IRowRef, rows: IRowRef[]): void {
    row.children.forEach((childIndex, index) => {
      const rowChild = rows[childIndex]
      rowChild.parents.push(row.originalIndex)
      rowChild.listIndex = index
      this.setParentsRecursively(rowChild.children, row.originalIndex, rows)
    })
  }

  public getListStyleWidth(
    ctx: CanvasRenderingContext2D,
    listElementList: IElement[]
  ): number {
    const { scale, checkbox } = this.options
    const startElement = listElementList[0]

    if (startElement.listStyle && startElement.listStyle !== ListStyle.DECIMAL) {
      if (startElement.listStyle === ListStyle.CHECKBOX) {
        return (checkbox.width + LIST_GAP) * scale
      }
      return UN_COUNT_STYLE_WIDTH * scale
    }

    const count = listElementList.reduce((pre, cur) => cur.value === ZERO ? pre + 1 : pre, 0)
    if (!count) return 0

    const text = `${MEASURE_BASE_TEXT.repeat(String(count).length)}${KeyMap.PERIOD}`
    const textMetrics = ctx.measureText(text)
    return Math.ceil((textMetrics.width + LIST_GAP) * scale)
  }

  private generateListIndexes(rows: IRowRef[]): void {
    let countIndex = 0
    rows.forEach(row => {
      if (row.level === 0) {
        row.listIndex = countIndex++
      } else {
        const sameLevel = rows.filter(elem =>
          elem.level === row.level && elem.parents.includes(row.parents[row.parents.length - 1])
        )
        const indexElem = rows.findIndex(elem => elem.originalIndex === row.originalIndex)
        row.listIndex = sameLevel.findIndex(elem => elem.originalIndex === indexElem) + (row.majorSubLevel || 0)
      }
    })
  }

  private calculateListsIndex(rowList: IRow[], defaultTabWidth: number): IRowRef[] {
    const rows: IRowRef[] = rowList.slice(1).map((row, index) => ({
      level: this.draw.getTabWidth(row.elementList) / defaultTabWidth,
      originalIndex: index,
      children: [],
      subChildren: [],
      parents: [],
      listIndex: -1,
      majorSubLevel: 0
    }))

    this.generateChildrenAndParents(rows)
    this.generateListIndexes(rows)
    return rows
  }
}