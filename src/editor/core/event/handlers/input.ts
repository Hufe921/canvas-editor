import { ZERO } from '../../../dataset/constant/Common'
import { EDITOR_ELEMENT_COPY_ATTR } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { splitText } from '../../../utils'
import { formatElementContext, getAnchorElement } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

export function input(data: string, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly() || draw.isDisabled()) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!data || !cursorPosition) return
  const isComposing = host.isComposing
  // Если идет составление текста, не выполняем дополнительные действия
  if (isComposing && host.compositionInfo?.value === data) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // Удаляем составленный ввод
  removeComposingInput(host)
  if (!isComposing) {
    const cursor = draw.getCursor()
    cursor.clearAgentDomValue()
  }
  const { TEXT, HYPERLINK, SUBSCRIPT, SUPERSCRIPT, DATE } = ElementType
  const text = data.replaceAll(`\n`, ZERO)
  const { startIndex, endIndex } = rangeManager.getRange()
  // Форматирование элементов
  const elementList = draw.getElementList()
  const copyElement = getAnchorElement(elementList, endIndex)
  if (!copyElement) return
  const isDesignMode = draw.isDesignMode()
  const inputData: IElement[] = splitText(text).map(value => {
    const newElement: IElement = {
      value
    }
    if (
      isDesignMode ||
      (!copyElement.title?.disabled && !copyElement.control?.disabled)
    ) {
      const nextElement = elementList[endIndex + 1]
      if (
        !copyElement.type ||
        copyElement.type === TEXT ||
        copyElement.type === ElementType.PARAGRAPH ||
        (copyElement.type === HYPERLINK && nextElement?.type === HYPERLINK) ||
        (copyElement.type === DATE && nextElement?.type === DATE) ||
        (copyElement.type === SUBSCRIPT && nextElement?.type === SUBSCRIPT) ||
        (copyElement.type === SUPERSCRIPT && nextElement?.type === SUPERSCRIPT)
      ) {
        EDITOR_ELEMENT_COPY_ATTR.forEach(attr => {
          if (attr === 'groupIds' && !nextElement?.groupIds) return
          if (attr === 'type' && copyElement.type !== newElement.type) return

          if (attr === 'id') return
          const value = copyElement[attr] as never

          if (value !== undefined) {
            newElement[attr] = value
          }
        })
      }
      if (isComposing) {
        newElement.underline = true
      }
    }
    return newElement
  })
  // Обработка вставки новых элементов с учетом условий, аналогичных функции enter
  const control = draw.getControl()
  let curIndex = -1
  if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    curIndex = control.setValue(inputData)
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
    let currentPageHeight =
      currentPageRows.reduce((acc, current) => acc + current.height, 0) +
      marginTop
    let elementsToMove: IElement[] = []
    // let previousRowElements: IElement[] = [];

    // Поиск индекса строки с разделителем сносок на текущей странице
    const footnoteRowIndexInPage = currentPageRows.findIndex(row =>
      row.elementList.some(
        elem => elem.type === ElementType.SEPARATOR && elem.isFootnote
      )
    )
    // Определение, находится ли курсор под разделителем
    let isCursorUnderSeparator = false
    if (footnoteRowIndexInPage !== -1) {
      // Получаем индекс строки курсора на текущей странице
      const cursorRowIndexInPage =
        cursorPosition.rowIndex -
        pageRowList
          .slice(0, cursorPosition.pageNo)
          .reduce((acc, pageRows) => acc + pageRows.length, 0)

      if (cursorRowIndexInPage > footnoteRowIndexInPage) {
        isCursorUnderSeparator = true
      }
    }
    if (
      (copyElement &&
        copyElement.metrics?.width &&
        rowList[cursorPosition.rowIndex].width + copyElement.metrics.width >
          draw.getInnerWidth()) ||
      rowList[cursorPosition.rowIndex].elementList.length >= 73
    ) {
      currentPageHeight += 32
    }
    // Если страница переполнена
    if (currentPageHeight > pageHeight) {
      if (isCursorUnderSeparator && footnoteRowIndexInPage !== -1) {
        // Курсор находится под разделителем, перемещаем последнюю строку перед разделителем

        if (footnoteRowIndexInPage > 0) {
          const rowToMove = currentPageRows[footnoteRowIndexInPage - 1]

          // Получаем элементы строки для перемещения
          elementsToMove = rowToMove.elementList

          // Удаляем элементы строки из текущей позиции
          draw.spliceElementList(
            elementList,
            rowToMove.startIndex,
            elementsToMove.length
          )

          // Добавляем элементы на новую страницу (в конец elementList)
          draw.spliceElementList(
            elementList,
            elementList.length,
            0,
            elementsToMove
          )

          curIndex = cursorElementIndex

          rangeManager.setRange(curIndex, curIndex)
          draw.render({ curIndex })

          if (isComposing) {
            host.compositionInfo = {
              elementList,
              value: text,
              startIndex: curIndex - inputData.length,
              endIndex: curIndex
            }
          }

          return
        }
      } else {
        // Существующая логика обработки переполнения страницы

        // Проверяем, есть ли предыдущая строка перед разделителем
        if (footnoteRowIndexInPage !== -1 && footnoteRowIndexInPage > 0) {
          const previousRow = currentPageRows[footnoteRowIndexInPage - 1]

          // Нахождение индекса предыдущей строки в общем списке rowList
          const previousRowIndex = rowList.findIndex(row => row === previousRow)

          // previousRowElements = elementList.slice(
          //     previousRow.startIndex,
          //     previousRow.startIndex + previousRow.elementList.length,
          // );

          elementsToMove = previousRow.elementList.filter(
            el => elementList.indexOf(el) > cursorElementIndex
          )
          // Вставка новых элементов, если курсор находится в конце предыдущей строки
          if (cursorPosition.rowIndex === previousRowIndex) {
            elementsToMove.unshift(...inputData)
          }
          if (
            elementsToMove.length > 1 &&
            cursorPosition.rowIndex === previousRowIndex
          ) {
            elementsToMove = [
              previousRow.elementList[previousRow.elementList.length - 1]
            ]
          }

          // Удаление элементов, которые перемещаются на следующую страницу
          const spliceStart =
            elementsToMove.length >= 2
              ? previousRow.startIndex
              : previousRow.startIndex + previousRow.elementList.length - 1
          const spliceCount =
            elementsToMove.length >= 2
              ? elementsToMove.length
              : elementsToMove[0] ===
                previousRow.elementList[previousRow.elementList.length - 1]
              ? 1
              : 0

          draw.spliceElementList(elementList, spliceStart, spliceCount)

          // Вставка элементов в список после текущей позиции
          const lastElementOnPage =
            currentPageRows[currentPageRows.length - 1]?.elementList.at(-1)
          const lastElementIndex = lastElementOnPage
            ? elementList.lastIndexOf(lastElementOnPage)
            : -1
          cursorElementIndex =
            lastElementIndex >= 0 ? lastElementIndex : cursorElementIndex

          cursorElementIndex = elementList.lastIndexOf(lastElementOnPage!) + 1
          elementsToMove.unshift({ value: ZERO })
          draw.spliceElementList(
            elementList,
            cursorElementIndex,
            0,
            elementsToMove
          )
          // draw.spliceElementList(elementList,cursorPosition.index,0,...inputData)

          // Удаление первых элементов, если это входящие данные, чтобы избежать дублирования
          if (
            elementsToMove
              .slice(0, inputData.length)
              .every((el, idx) => el === inputData[idx])
          ) {
            elementsToMove.splice(0, inputData.length)
          }
          if (
            startIndex + 1 <=
            previousRow.startIndex + previousRow.elementList.length - 1
          ) {
            draw.spliceElementList(elementList, startIndex + 1, 0, inputData)
            curIndex = cursorPosition.index + inputData.length
            curIndex = cursorElementIndex + 1
            curIndex += inputData.length
          } else {
            curIndex = cursorElementIndex
            curIndex += inputData.length
          }
        } else {
          // Вставка новых элементов в позицию курсора
          const start = startIndex + 1
          if (startIndex !== endIndex) {
            draw.spliceElementList(elementList, start, endIndex - startIndex)
          }
          formatElementContext(elementList, inputData, startIndex, {
            editorOptions: draw.getOptions()
          })
          draw.spliceElementList(elementList, start, 0, inputData)
          curIndex = startIndex + inputData.length
        }
      }
    } else {
      // Страница не переполнена, обычная вставка
      const start = startIndex + 1
      if (startIndex !== endIndex) {
        draw.spliceElementList(elementList, start, endIndex - startIndex)
      }
      formatElementContext(elementList, inputData, startIndex, {
        editorOptions: draw.getOptions()
      })
      draw.spliceElementList(elementList, start, 0, inputData)
      curIndex = startIndex + inputData.length
    }
  }

  if (~curIndex !== -1) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex,
      isSubmitHistory: !isComposing
    })
  }
  if (isComposing) {
    host.compositionInfo = {
      elementList,
      value: text,
      startIndex: curIndex - inputData.length,
      endIndex: curIndex
    }
  }
}

export function removeComposingInput(host: CanvasEvent) {
  if (!host.compositionInfo) return
  const { elementList, startIndex, endIndex } = host.compositionInfo
  elementList.splice(startIndex + 1, endIndex - startIndex)
  const rangeManager = host.getDraw().getRange()
  rangeManager.setRange(startIndex, startIndex)
  host.compositionInfo = null
}
