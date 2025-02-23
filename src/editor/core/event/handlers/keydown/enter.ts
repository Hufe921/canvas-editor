import { ZERO } from '../../../../dataset/constant/Common'
import {
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { IElement } from '../../../../interface/Element'
import { getUUID } from '../../../../utils'
import {
  formatElementContext,
  getAnchorElement
} from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function enter(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return

  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return

  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
  const startElement = elementList[startIndex]
  const endElement = elementList[endIndex]

  if (
    isCollapsed &&
    endElement.listId &&
    endElement.value === ZERO &&
    elementList[endIndex + 1]?.listId !== endElement.listId
  ) {
    draw.getListParticle().unsetList()
    const enterText: IElement = { value: ZERO, id: getUUID() }
    draw.spliceElementList(elementList, endIndex, 1, [enterText])
    return
  }

  const enterText: IElement = { value: ZERO }

  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }

  formatElementContext(elementList, [enterText], startIndex, {
    isBreakWhenWrap: true,
    editorOptions: draw.getOptions()
  })

  if (
    !(
      endElement.titleId &&
      endElement.titleId !== elementList[endIndex + 1]?.titleId
    )
  ) {
    const anchorElement = getAnchorElement(elementList, endIndex)
    if (anchorElement) {
      const attributesToCopy = [...EDITOR_ROW_ATTR]

      if (anchorElement.controlComponent !== ControlComponent.POSTFIX) {
        attributesToCopy.push(...EDITOR_ELEMENT_STYLE_ATTR)
      }

      attributesToCopy.forEach(attr => {
        const value = anchorElement[attr] as never
        if (value !== undefined) {
          enterText[attr] = value
        }
      })
    }
  }

  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  let cursorIndex = -1

  if (activeControl && control.getIsRangeWithinControl()) {
    cursorIndex = control.setValue([enterText])
  } else {
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return

    let cursorElementIndex = cursorPosition.index
    const pageHeight = draw.getHeight()
    const marginTop = draw.getMainOuterHeight()
    const rowList = draw.getRowList()

    const pageRowList = draw.getPageRowList()
    const currentPageRows = pageRowList[cursorPosition.pageNo] || []
    const currentPageHeight =
      currentPageRows.reduce((acc, current) => acc + current.height, 0) +
      marginTop +
      50

    let elementsToMove: IElement[] = []
    let previousRowElements: IElement[] = []

    const footnoteRowIndexInPage = currentPageRows.findIndex(row =>
      row.elementList.some(
        elem => elem.type === ElementType.SEPARATOR && elem.isFootnote
      )
    )

    let isCursorUnderSeparator = false
    if (footnoteRowIndexInPage !== -1) {
      const cursorRowIndexInPage =
        cursorPosition.rowIndex -
        pageRowList
          .slice(0, cursorPosition.pageNo)
          .reduce((acc, pageRows) => acc + pageRows.length, 0)

      if (cursorRowIndexInPage > footnoteRowIndexInPage) {
        isCursorUnderSeparator = true
      }
    }

    if (currentPageHeight > pageHeight) {
      if (isCursorUnderSeparator && footnoteRowIndexInPage !== -1) {
        if (footnoteRowIndexInPage > 0) {
          const rowToMove = currentPageRows[footnoteRowIndexInPage - 1]

          elementsToMove = rowToMove.elementList

          const lastElementOnPage =
            currentPageRows[currentPageRows.length - 1]?.elementList.at(-1)
          const lastElementIndex = lastElementOnPage
            ? elementList.lastIndexOf(lastElementOnPage)
            : -1
          cursorElementIndex =
            lastElementIndex >= 0 ? lastElementIndex : cursorElementIndex

          const spliceStart = cursorPosition.index + 1
          const spliceCount =
            footnoteRowIndexInPage - 1 ===
            cursorPosition.rowIndex -
              pageRowList
                .slice(0, cursorPosition.pageNo)
                .reduce((acc, pageRows) => acc + pageRows.length, 0)
              ? elementsToMove.length - 1
              : elementsToMove.length

          if (spliceCount === elementsToMove.length - 1)
            draw.spliceElementList(elementList, spliceStart, spliceCount)
          else {
            draw.spliceElementList(elementList, spliceStart, 0, [enterText])
            const previousRow = currentPageRows[footnoteRowIndexInPage - 1]
            previousRowElements = elementList.slice(
              previousRow.startIndex,
              previousRow.startIndex + previousRow.elementList.length
            )
            draw.spliceElementList(
              elementList,
              previousRow.startIndex,
              spliceCount
            )
          }
          cursorElementIndex = elementList.lastIndexOf(lastElementOnPage!) + 1
          draw.spliceElementList(
            elementList,
            cursorElementIndex + 1,
            0,
            elementsToMove
          )

          cursorIndex = cursorElementIndex

          rangeManager.setRange(cursorIndex, cursorIndex)
          draw.render({ curIndex: cursorIndex })

          evt.preventDefault()
          return
        }
      } else {
        if (footnoteRowIndexInPage !== -1 && footnoteRowIndexInPage > 0) {
          const previousRow = currentPageRows[footnoteRowIndexInPage - 1]

          const previousRowIndex = rowList.findIndex(row => row === previousRow)

          previousRowElements = elementList.slice(
            previousRow.startIndex,
            previousRow.startIndex + previousRow.elementList.length
          )

          elementsToMove = previousRow.elementList.filter(
            el => elementList.indexOf(el) > cursorElementIndex
          )

          if (cursorPosition.rowIndex === previousRowIndex) {
            elementsToMove.unshift(enterText)
          }
        }

        let temp = 0
        if (isCollapsed && elementsToMove.length > 0) {
          const lastElementOnPage =
            currentPageRows[currentPageRows.length - 1]?.elementList.at(-1)
          const lastElementIndex = lastElementOnPage
            ? elementList.lastIndexOf(lastElementOnPage)
            : -1
          cursorElementIndex =
            lastElementIndex >= 0 ? lastElementIndex : cursorElementIndex

          const spliceStart = cursorPosition.index + 1
          const spliceCount =
            footnoteRowIndexInPage - 1 ===
            cursorPosition.rowIndex -
              pageRowList
                .slice(0, cursorPosition.pageNo)
                .reduce((acc, pageRows) => acc + pageRows.length, 0)
              ? elementsToMove.length - 1
              : elementsToMove.length

          if (spliceCount === elementsToMove.length - 1)
            draw.spliceElementList(elementList, spliceStart, spliceCount)
          else {
            draw.spliceElementList(elementList, spliceStart, 0, [enterText])
            const previousRow = currentPageRows[footnoteRowIndexInPage - 1]
            previousRowElements = elementList.slice(
              previousRow.startIndex,
              previousRow.startIndex + previousRow.elementList.length
            )
            draw.spliceElementList(
              elementList,
              previousRow.startIndex + 1,
              spliceCount
            )
          }
          cursorElementIndex = elementList.lastIndexOf(lastElementOnPage!) + 1
          draw.spliceElementList(
            elementList,
            cursorElementIndex,
            0,
            elementsToMove
          )
          if (elementsToMove[0] === enterText) {
            elementsToMove.shift()
            if (elementsToMove.length === 0) {
              temp++
            }
          }

          const expectedElements = previousRowElements.filter(
            el => elementList.indexOf(el) > cursorElementIndex
          )
          if (
            JSON.stringify(expectedElements) !== JSON.stringify(elementsToMove)
          ) {
            cursorElementIndex = cursorPosition.index + 1
            // draw.spliceElementList(elementList, cursorElementIndex, 0, enterText)
          } else {
            const footnoteElement = currentPageRows[
              footnoteRowIndexInPage
            ]?.elementList.find(
              elem => elem.type === ElementType.SEPARATOR && elem.isFootnote
            )
            const footnoteElementIndex = footnoteElement
              ? elementList.lastIndexOf(footnoteElement)
              : -1
            cursorElementIndex = footnoteElementIndex
            if (!elementList.find(elem => elem?.id === enterText?.id)) {
              draw.spliceElementList(
                elementList,
                cursorElementIndex -
                  previousRowElements.length +
                  elementsToMove.length,
                1,
                [enterText]
              )
            }
            cursorElementIndex = elementList.lastIndexOf(lastElementOnPage!) + 1
          }
        } else if (isCollapsed) {
          draw.spliceElementList(elementList, cursorElementIndex + 1, 0, [
            enterText
          ])
          cursorIndex = cursorElementIndex + 1
        } else {
          draw.spliceElementList(
            elementList,
            startIndex + 1,
            endIndex - startIndex,
            [enterText]
          )
          cursorIndex = startIndex + 1
        }

        if (elementsToMove.length === 0) {
          cursorIndex = cursorElementIndex + 1 - temp
        } else {
          cursorIndex = cursorElementIndex
        }
      }
    } else if (isCollapsed) {
      const TabElementIndex = rowList[
        cursorPosition.rowIndex
      ].elementList.findIndex(el => (el.listLevel ?? 0) > 0)
      const listLevel =
        (rowList[cursorPosition.rowIndex]?.elementList?.[0]?.listLevel ?? 0) + 1
      if (
        TabElementIndex !== -1 &&
        rowList[cursorPosition.rowIndex].elementList[
          TabElementIndex + listLevel
        ]
      ) {
        enterText.listLevel =
          rowList[cursorPosition.rowIndex].elementList[0].listLevel || 0
        const tabsArray = []
        for (let i = 0; i < enterText.listLevel; i++) {
          tabsArray.push(
            rowList[cursorPosition.rowIndex].elementList[TabElementIndex + 1]
          )
        }
        draw.spliceElementList(elementList, cursorElementIndex + 1, 0, [
          enterText,
          ...tabsArray
        ])
        cursorIndex = cursorElementIndex + tabsArray.length + 1
      } else if (TabElementIndex !== -1) {
        const listLevel =
          (rowList[cursorPosition.rowIndex]?.elementList?.[0]?.listLevel ?? 0) -
          1
        enterText.listLevel = listLevel
        draw.spliceElementList(
          elementList,
          cursorElementIndex - (listLevel - 1),
          2,
          [enterText]
        )
        cursorIndex = cursorElementIndex - 1
      } else {
        draw.spliceElementList(elementList, cursorElementIndex + 1, 0, [
          enterText
        ])
        cursorIndex = cursorElementIndex + 1
      }
    } else {
      draw.spliceElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex,
        [enterText]
      )
      cursorIndex = startIndex + 1
    }

    if (cursorIndex >= 0) {
      rangeManager.setRange(cursorIndex, cursorIndex)
      draw.render({ curIndex: cursorIndex })
    }
  }

  evt.preventDefault()
}
