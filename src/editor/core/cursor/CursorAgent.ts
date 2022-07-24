import { ElementType } from '../../dataset/enum/Element'
import { debounce } from '../../utils'
import { getElementListByHTML } from '../../utils/clipboard'
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
    agentCursorDom.classList.add('inputarea')
    agentCursorDom.innerText = ''
    this.container.append(agentCursorDom)
    this.agentCursorDom = agentCursorDom
    // 事件
    agentCursorDom.onkeydown = (evt: KeyboardEvent) => this._keyDown(evt)
    agentCursorDom.oninput = debounce(this._input.bind(this), 0)
    agentCursorDom.onpaste = (evt: ClipboardEvent) => this._paste(evt)
    agentCursorDom.addEventListener('compositionstart', this._compositionstart.bind(this))
    agentCursorDom.addEventListener('compositionend', this._compositionend.bind(this))
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
    const clipboardData = evt.clipboardData
    if (!clipboardData) return
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
            const elementList = getElementListByHTML(htmlText)
            this.draw.insertElementList(elementList)
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
                this.draw.insertElementList([{
                  value,
                  type: ElementType.IMAGE,
                  width: image.width,
                  height: image.height
                }])
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

  private _compositionend() {
    this.canvasEvent.compositionend()
  }

}