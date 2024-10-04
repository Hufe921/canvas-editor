import { ZERO } from '../../../../dataset/constant/Common'
import {
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement } from '../../../../interface/Element'
import { IRowElement } from '../../../../interface/Row'
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
  const rowList = draw.getRowList()
  const startElement = elementList[startIndex]
  const endElement = elementList[endIndex]
  // 最后一个列表项行首回车取消列表设置
  if (
    isCollapsed &&
    endElement.listId &&
    endElement.value === ZERO &&
    elementList[endIndex + 1]?.listId !== endElement.listId
  ) {
    draw.getListParticle().unsetList()
    return
  }
  // 列表块内换行
  const enterText: IElement = {
    value: ZERO
  }
  if (evt.shiftKey && startElement.listId) {
    enterText.listWrap = true
  }
  // 格式化上下文
  formatElementContext(elementList, [enterText], startIndex, {
    isBreakWhenWrap: true,
    editorOptions: draw.getOptions()
  })
  // 标题结尾处回车无需格式化及样式复制
  if (
    !(
      endElement.titleId &&
      endElement.titleId !== elementList[endIndex + 1]?.titleId
    )
  ) {
    // 复制样式属性
    const copyElement = getAnchorElement(elementList, endIndex)
    if (copyElement) {
      const copyAttr = [...EDITOR_ROW_ATTR]
      // 不复制控件后缀样式
      if (copyElement.controlComponent !== ControlComponent.POSTFIX) {
        copyAttr.push(...EDITOR_ELEMENT_STYLE_ATTR)
      }
      copyAttr.forEach(attr => {
        const value = copyElement[attr] as never
        if (value !== undefined) {
          enterText[attr] = value
        }
      })
    }
  }
  rowList.forEach(el => el.endIndex = (el.startIndex + (el.elementList.length - 1)))
  const currentRow = rowList.find(el => {
    return startIndex >= el.startIndex && endIndex <= el.endIndex
  })
  const nextRow = rowList[currentRow?.rowIndex! + 1]
  const countTabCurRow = getTabWidth((currentRow?.elementList || []), draw.getOptions())
  const countTabNextRow = getTabWidth((nextRow?.elementList || []), draw.getOptions())
  const { defaultTabWidth } = draw.getOptions()

  let tabsToInsertCount = 0
  // Se a posição do cursor estiver no final da linha ou em qualquer posição acima do começo da linha
  if (startIndex === currentRow?.endIndex || (currentRow && startIndex > currentRow?.startIndex)) {
    // se a linha atual tiver mais tabs que a próxima linha pega as tabs da linha atual
    // se não pega as tabs da próxima linha
    tabsToInsertCount = countTabCurRow > countTabNextRow ? (countTabCurRow / defaultTabWidth) : (countTabNextRow / defaultTabWidth)
  } else {
    // caso esteja no começo
    tabsToInsertCount = countTabCurRow / defaultTabWidth
  }

  // Criar os elementos TABs que serão inseridos na nova linha
  const tabsToInsert = Array(tabsToInsertCount).fill({
    value: '',
    type: ElementType.TAB,
    listId: enterText.listId,
    listStyle: enterText.listStyle,
    listType: enterText.listType,
  })

  // Inserir o novo elemento e os tabs calculados na nova linha
  if (isCollapsed) {
    draw.spliceElementList(elementList, startIndex + 1, 0, enterText);
    if (tabsToInsert.length > 0) {
      draw.spliceElementList(elementList, startIndex + 2, 0, ...tabsToInsert)
    }
  } else {
    draw.spliceElementList(
      elementList,
      startIndex + 1,
      endIndex - startIndex,
      enterText
    );
    if (tabsToInsert.length > 0) {
      draw.spliceElementList(elementList, startIndex + 2, 0, ...tabsToInsert)
    }
  }

  // Verifica se está na última linha e ajusta o índice corretamente
  let curIndex;
  if (startIndex === elementList.length - 2) {
    // Se for a última linha, move o cursor para a nova linha diretamente
    curIndex = startIndex + 1
  } else {
    // Caso contrário, segue a lógica original
    curIndex = startIndex + tabsToInsertCount + 1
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex });
  }
  evt.preventDefault()
}

function getTabWidth(elementList: IRowElement[], options: IEditorOption) {
  let tabWidth = 0
  const { defaultTabWidth, scale } = options
  for (let i = 1; i < elementList.length; i++) {
    const element = elementList[i]
    if (element?.type !== ElementType.TAB) break
    tabWidth += (defaultTabWidth || 32) * (scale || 1)
  }

  return tabWidth
}
