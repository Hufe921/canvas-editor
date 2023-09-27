import { ZERO } from '../../dataset/constant/Common'
import { EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { VIRTUAL_ELEMENT_TYPE } from '../../dataset/constant/Element'
import { ElementType } from '../../dataset/enum/Element'
import { IElement } from '../../interface/Element'
import { debounce } from '../../utils'
import { formatElementContext, getElementListByHTML } from '../../utils/element'
import { Draw } from '../draw/Draw'
import { CanvasEvent } from '../event/CanvasEvent'

export class CursorAgent {
  private draw: Draw
  private container: HTMLDivElement
  private agentCursorDom: HTMLTextAreaElement
  private canvasEvent: CanvasEvent

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.container = draw.getContainer()
    this.canvasEvent = canvasEvent
    // 代理光标绘制
    const agentCursorDom = document.createElement('textarea')
    agentCursorDom.autocomplete = 'off'
    agentCursorDom.classList.add(`${EDITOR_PREFIX}-inputarea`)
    agentCursorDom.innerText = ''
    this.container.append(agentCursorDom)
    this.agentCursorDom = agentCursorDom
    // 事件
    agentCursorDom.onkeydown = (evt: KeyboardEvent) => this._keyDown(evt)
    agentCursorDom.oninput = debounce(this._input.bind(this), 0)
    agentCursorDom.onpaste = (evt: ClipboardEvent) => this._paste(evt)
    agentCursorDom.addEventListener(
      'compositionstart',
      this._compositionstart.bind(this)
    )
    agentCursorDom.addEventListener(
      'compositionend',
      this._compositionend.bind(this)
    )
  }

  public getAgentCursorDom(): HTMLTextAreaElement {
    return this.agentCursorDom
  }

  private _keyDown(evt: KeyboardEvent) {
    this.canvasEvent.keydown(evt)
  }

  private _input(evt: InputEvent) {
    if (!evt.data) return
    this.canvasEvent.input(evt.data)
  }

  private _paste(evt: ClipboardEvent) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const clipboardData = evt.clipboardData
    if (!clipboardData) return
    // 自定义粘贴事件
    const { paste } = this.draw.getOverride()
    if (paste) {
      paste(evt)
      return
    }
    const rangeManager = this.draw.getRange()
    const { startIndex } = rangeManager.getRange()
    const elementList = this.draw.getElementList()
    // 从粘贴板提取数据
    let isHTML = false
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i]
      if (item.type === 'text/html') {
        isHTML = true
        break
      }
    }
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i]
      if (item.kind === 'string') {
        if (item.type === 'text/plain' && !isHTML) {
          item.getAsString(plainText => {
            this.canvasEvent.input(plainText)
          })
        }
        if (item.type === 'text/html' && isHTML) {
          item.getAsString(htmlText => {
            const pasteElementList = getElementListByHTML(htmlText, {
              innerWidth: this.draw.getOriginalInnerWidth()
            })
            // 全选粘贴无需格式化上下文
            if (~startIndex && !rangeManager.getIsSelectAll()) {
              // 如果是复制到虚拟元素里，则粘贴列表的虚拟元素需扁平化处理，避免产生新的虚拟元素
              const anchorElement = elementList[startIndex]
              if (anchorElement?.titleId || anchorElement?.listId) {
                let start = 0
                while (start < pasteElementList.length) {
                  const pasteElement = pasteElementList[start]
                  if (anchorElement.titleId && /^\n/.test(pasteElement.value)) {
                    break
                  }
                  if (VIRTUAL_ELEMENT_TYPE.includes(pasteElement.type!)) {
                    pasteElementList.splice(start, 1)
                    if (pasteElement.valueList) {
                      for (let v = 0; v < pasteElement.valueList.length; v++) {
                        const element = pasteElement.valueList[v]
                        if (element.value === ZERO || element.value === '\n') {
                          continue
                        }
                        pasteElementList.splice(start, 0, element)
                        start++
                      }
                    }
                    start--
                  }
                  start++
                }
              }
              formatElementContext(elementList, pasteElementList, startIndex, {
                isBreakWhenWrap: true
              })
            }
            this.draw.insertElementList(pasteElementList)
          })
        }
      } else if (item.kind === 'file') {
        if (item.type.includes('image')) {
          const file = item.getAsFile()
          if (file) {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              // 计算宽高
              const image = new Image()
              const value = fileReader.result as string
              image.src = value
              image.onload = () => {
                const imageElement: IElement = {
                  value,
                  type: ElementType.IMAGE,
                  width: image.width,
                  height: image.height
                }
                if (~startIndex) {
                  formatElementContext(elementList, [imageElement], startIndex)
                }
                this.draw.insertElementList([imageElement])
              }
            }
          }
        }
      }
    }
    evt.preventDefault()
  }

  private _compositionstart() {
    this.canvasEvent.compositionstart()
  }

  private _compositionend(evt: CompositionEvent) {
    this.canvasEvent.compositionend(evt)
  }
}
