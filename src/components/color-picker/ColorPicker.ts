import { EditorComponent, EDITOR_COMPONENT } from '../../editor'
import '../signature/signature.css'

export interface IColorPickerResult {
  value: string
}

export interface IColorPickerOptions {
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: (payload: IColorPickerResult | null) => void
}

export class ColorPicker {
  private options: IColorPickerOptions
  private mask: HTMLDivElement
  private container: HTMLDivElement

  constructor(options: IColorPickerOptions) {
    this.options = options
    const { mask, container } = this._render()
    this.mask = mask
    this.container = container
  }

  private _render() {
    const { onClose, onCancel, onConfirm } = this.options
    const mask = document.createElement('div')
    mask.classList.add('signature-mask')
    mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(mask)
    const container = document.createElement('div')
    container.classList.add('signature-container')
    container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    const signatureContainer = document.createElement('div')
    signatureContainer.classList.add('signature')
    container.append(signatureContainer)
    const titleContainer = document.createElement('div')
    titleContainer.classList.add('signature-title')
    const titleSpan = document.createElement('span')
    titleSpan.append(document.createTextNode('Select color'))
    const titleClose = document.createElement('i')
    titleClose.onclick = () => {
      if (onClose) {
        onClose()
      }
      this._dispose()
    }
    titleContainer.append(titleSpan)
    titleContainer.append(titleClose)
    signatureContainer.append(titleContainer)
    // 操作区
    const operationContainer = document.createElement('div')
    operationContainer.classList.add('signature-operation')

    // 绘图区
    const canvasContainer = document.createElement('div')
    canvasContainer.classList.add('signature-canvas')
    const colorInput = document.createElement('input')
    colorInput.setAttribute('type', 'color')
    colorInput.setAttribute('id', 'td-bgcolor')
    canvasContainer.append(colorInput)
    signatureContainer.append(canvasContainer)
    // 按钮容器
    const menuContainer = document.createElement('div')
    menuContainer.classList.add('signature-menu')
    // 取消按钮
    const cancelBtn = document.createElement('button')
    cancelBtn.classList.add('signature-menu__cancel')
    cancelBtn.append(document.createTextNode('Cancel'))
    cancelBtn.type = 'button'
    cancelBtn.onclick = () => {
      if (onCancel) {
        onCancel()
      }
      this._dispose()
    }
    menuContainer.append(cancelBtn)
    // 确认按钮
    const confirmBtn = document.createElement('button')
    confirmBtn.append(document.createTextNode('Submit'))
    confirmBtn.type = 'submit'
    confirmBtn.onclick = () => {
      const element = document.getElementById('td-bgcolor') as HTMLInputElement
      if (onConfirm) onConfirm({ value: element.value })
      this._dispose()
    }
    menuContainer.append(confirmBtn)
    signatureContainer.append(menuContainer)
    document.body.append(container)
    this.container = container
    this.mask = mask
    return {
      mask,
      container
    }
  }

  private _dispose() {
    this.mask.remove()
    this.container.remove()
  }
}
