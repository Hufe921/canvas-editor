import { EditorComponent, EDITOR_COMPONENT } from '../../editor'
import './dialog.css'

export interface IDialogForm {
  type: string
  label?: string
  labelPosition?: string
  labelDirection?: string
  id?: string
  name: string
  value?: string
  options?: { label: string; value: string }[]
  placeholder?: string
  width?: number
  height?: number
  required?: boolean
}

export interface IDialogTab {
  data?: IDialogForm[]
  name: string
}

export interface IDialogTabbar {
  tabs: IDialogTab[]
  tabsPosition?: string
  tabsDirection?: string
}

export interface IDialogData {
  type?: string
  form?: IDialogForm[]
  tab?: IDialogTabbar
}

export interface IDialogConfirm {
  name: string
  value: string
}

export interface IDialogOptions {
  onClose?: () => void
  onCancel?: () => void
  onConfirm?: (payload: IDialogConfirm[]) => void
  title: string
  data: IDialogData
  textCancel?: string
  textConfirm?: string
}

export class Dialog {
  private options: IDialogOptions
  private mask: HTMLDivElement | null
  private container: HTMLDivElement | null
  private inputList: (
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
  )[]

  constructor(options: IDialogOptions) {
    this.options = options
    this.mask = null
    this.container = null
    this.inputList = []
    this._render()
  }

  private _render() {
    const { title, data, onClose, onCancel, onConfirm, textCancel, textConfirm } = this.options
    // 渲染遮罩层
    const mask = document.createElement('div')
    mask.classList.add('dialog-mask')
    mask.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    document.body.append(mask)
    // 渲染容器
    const container = document.createElement('div')
    container.classList.add('dialog-container')
    container.setAttribute(EDITOR_COMPONENT, EditorComponent.COMPONENT)
    // 弹窗
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('dialog')
    container.append(dialogContainer)
    // 标题容器
    const titleContainer = document.createElement('div')
    titleContainer.classList.add('dialog-title')
    // 标题&关闭按钮
    const titleSpan = document.createElement('span')
    titleSpan.append(document.createTextNode(title))
    const titleClose = document.createElement('i')
    titleClose.onclick = () => {
      if (onClose) {
        onClose()
      }
      this._dispose()
    }
    titleContainer.append(titleSpan)
    titleContainer.append(titleClose)
    dialogContainer.append(titleContainer)
    // 选项容器
    const optionContainer = document.createElement('div')
    optionContainer.classList.add('dialog-option')
    // 选项
    if (!data.type || data.type === 'form') {
      const { form } = data
      if (form) {
        for (let i = 0; i < form.length; i++) {
          const option = form[i]
          this.appendOptionItemOnContainer(optionContainer, option, this.inputList)
        }
      }
    } else {
      const tabbar = data.tab
      if (tabbar && tabbar.tabs) {
        const { tabs } = tabbar
        const optionTabHeaderContainer = document.createElement('div')
        const optionListHeader = document.createElement('ul')
        optionListHeader.classList.add('tabbar-header')
        const optionTabBodyContainer = document.createElement('div')
        optionTabBodyContainer.classList.add('tabbar-body')

        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i]
          const { name } = tab
          const optionItemListHeader = document.createElement('li')
          optionItemListHeader.innerText = name
          optionItemListHeader.classList.add('tabbar-header__title', `tab-${i}`)
          optionItemListHeader.setAttribute('data-tabindex', i.toString())
          if (i === 0) {
            optionItemListHeader.classList.add('active')
          }
          optionListHeader.append(optionItemListHeader)
        }
        optionTabHeaderContainer.append(optionListHeader)

        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i]
          const { data: form } = tab
          if (form) {
            const optionItemBody = document.createElement('div')
            optionItemBody.classList.add(`tabbar-body__form`, `tab-${i}`)
            optionItemBody.setAttribute('data-tabindex', i.toString())
            if (i === 0) {
              optionItemBody.classList.add('active')
            }

            for (let i = 0; i < form.length; i++) {
              const option = form[i]
              this.appendOptionItemOnContainer(optionItemBody, option, this.inputList)
            }
            optionTabBodyContainer.append(optionItemBody)
          }
        }
        const optionTabContainer = document.createElement('div')
        optionTabContainer.classList.add('tabbar')
        optionTabContainer.append(optionTabHeaderContainer)
        optionTabContainer.append(optionTabBodyContainer)
        optionContainer.append(optionTabContainer)
        setTimeout(() => {
          const liTitles = document.getElementsByClassName('tabbar-header__title')
          for (let i = 0; i < liTitles.length; i++) {
            const li = liTitles.item(i)
            li?.addEventListener('click', () => {
              document.querySelector('.tabbar-header .active')?.classList.remove('active')
              document.querySelector('.tabbar-body .active')?.classList.remove('active')
              const index = li.getAttribute('data-tabindex')
              document.querySelector(`.tabbar-header .tab-${index}`)?.classList.add('active')
              document.querySelector(`.tabbar-body .tab-${index}`)?.classList.add('active')
            }, false)
          }
        }, 100)
      }
    }

    dialogContainer.append(optionContainer)
    // 按钮容器
    const menuContainer = document.createElement('div')
    menuContainer.classList.add('dialog-menu')
    // 取消按钮
    const cancelBtn = document.createElement('button')
    cancelBtn.classList.add('dialog-menu__cancel')
    cancelBtn.append(document.createTextNode((textCancel ? textCancel : '取消')))
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
    confirmBtn.append(document.createTextNode((textConfirm ? textConfirm : '确定')))
    confirmBtn.type = 'submit'
    confirmBtn.onclick = () => {
      if (onConfirm) {
        const payload = this.inputList.map((input) => {
          let value = input.type === 'file' ? input.getAttribute('data-src') : input.value
          value = value || ''
          return {
            name: input.name,
            value
          }
        })
        onConfirm(payload)
      }
      this._dispose()
    }
    menuContainer.append(confirmBtn)
    dialogContainer.append(menuContainer)
    // 渲染
    document.body.append(container)
    this.container = container
    this.mask = mask
  }

  private _dispose() {
    this.mask?.remove()
    this.container?.remove()
  }

  private createOptionItemContainer(option: IDialogForm) {
    const optionItemContainer = document.createElement('div')
    optionItemContainer.classList.add('dialog-option__item')
    // 选项输入框
    let optionInput:
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement

    // 选项名称
    if (option.type === 'select') {
      optionInput = document.createElement('select')
      option.options?.forEach(item => {
        const optionItem = document.createElement('option')
        optionItem.value = item.value
        optionItem.label = item.label
        optionInput.append(optionItem)
      })
    } else if (option.type === 'textarea') {
      optionInput = document.createElement('textarea')
    } else {
      optionInput = document.createElement('input')
      optionInput.type = option.type
      if (option.type === 'file') {
        optionInput.onchange = function (event) {
          const element = event.currentTarget as HTMLInputElement
          const fileList: FileList | null = element.files
          if (fileList) {
            for (let i = 0; i < fileList.length; i++) {
              const FR = new FileReader()
              FR.onload = function (event) {
                const result = event.target?.result || ''
                optionInput.setAttribute('data-src', result.toString())
              }
              FR.readAsDataURL(fileList[i])
            }
          }
        }
      }
    }
    if (option.width) {
      optionInput.style.width = `${option.width}px`
    }
    if (option.height) {
      optionInput.style.height = `${option.height}px`
    }
    if (option.id) {
      optionInput.id = option.id
    }
    optionInput.name = option.name
    optionInput.value = option.type !== 'file' ? option.value || '' : ''
    if (!(optionInput instanceof HTMLSelectElement)) {
      optionInput.placeholder = option.placeholder || ''
    }
    optionItemContainer.append(optionInput)
    if (option.label) {
      const optionName = document.createElement('label')
      optionName.append(document.createTextNode(option.label))
      if (option.labelDirection && option.labelDirection === 'right') {
        if (option.labelPosition && option.labelPosition === 'top') {
          optionItemContainer.prepend(optionName)
        } else {
          optionItemContainer.append(optionName)
        }
        optionItemContainer.classList.add('dialog-option__item--end')
      } else {
        optionItemContainer.prepend(optionName)
      }
      if (option.id) {
        optionName.setAttribute('for', option.id)
      }
      if (option.required) {
        optionName.classList.add('dialog-option__item--require')
      }
      if (option.labelPosition && option.labelPosition === 'top') {
        optionItemContainer.classList.add('dialog-option__item--row')
      }
    }
    return {
      optionItemContainer,
      optionInput
    }
  }
  private appendOptionItemOnContainer(
    optionContainer: HTMLDivElement | HTMLUListElement,
    option: IDialogForm,
    inputList: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[]
  ) {
    const { optionItemContainer, optionInput } = this.createOptionItemContainer(option)
    optionContainer.append(optionItemContainer)
    inputList.push(optionInput)
  }
}
