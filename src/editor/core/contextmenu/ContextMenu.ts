import { NAME_PLACEHOLDER } from '../../dataset/constant/ContextMenu'
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { EditorComponent } from '../../dataset/enum/Editor'
import { DeepRequired } from '../../interface/Common'
import { IEditorOption } from '../../interface/Editor'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../interface/contextmenu/ContextMenu'
import { findParent } from '../../utils'
import { Command } from '../command/Command'
import { Draw } from '../draw/Draw'
import { I18n } from '../i18n/I18n'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { controlMenus } from './menus/controlMenus'
import { globalMenus } from './menus/globalMenus'
import { hyperlinkMenus } from './menus/hyperlinkMenus'
import { imageMenus } from './menus/imageMenus'
import { tableMenus } from './menus/tableMenus'

interface IRenderPayload {
  contextMenuList: IRegisterContextMenu[]
  left: number
  top: number
  parentMenuContainer?: HTMLDivElement
}

export class ContextMenu {
  private options: DeepRequired<IEditorOption>
  private draw: Draw
  private command: Command
  private range: RangeManager
  private position: Position
  private i18n: I18n
  private container: HTMLDivElement
  private contextMenuList: IRegisterContextMenu[]
  private contextMenuContainerList: HTMLDivElement[]
  private contextMenuRelationShip: Map<HTMLDivElement, HTMLDivElement>
  private context: IContextMenuContext | null

  constructor(draw: Draw, command: Command) {
    this.options = draw.getOptions()
    this.draw = draw
    this.command = command
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.i18n = draw.getI18n()
    this.container = draw.getContainer()
    this.context = null
    // 内部菜单
    this.contextMenuList = [
      ...globalMenus,
      ...tableMenus,
      ...imageMenus,
      ...controlMenus,
      ...hyperlinkMenus
    ]
    this.contextMenuContainerList = []
    this.contextMenuRelationShip = new Map()
    this._addEvent()
  }

  public getContextMenuList(): IRegisterContextMenu[] {
    return this.contextMenuList
  }

  private _addEvent() {
    // 菜单权限
    this.container.addEventListener('contextmenu', this._proxyContextMenuEvent)
    // 副作用处理
    document.addEventListener('mousedown', this._handleSideEffect)
  }

  public removeEvent() {
    this.container.removeEventListener(
      'contextmenu',
      this._proxyContextMenuEvent
    )
    document.removeEventListener('mousedown', this._handleSideEffect)
  }

  private _filterMenuList(
    menuList: IRegisterContextMenu[]
  ): IRegisterContextMenu[] {
    const { contextMenuDisableKeys } = this.options
    const renderList: IRegisterContextMenu[] = []
    for (let m = 0; m < menuList.length; m++) {
      const menu = menuList[m]
      if (
        menu.disable ||
        (menu.key && contextMenuDisableKeys.includes(menu.key))
      ) {
        continue
      }
      if (menu.isDivider) {
        renderList.push(menu)
      } else {
        if (menu.when?.(this.context!)) {
          renderList.push(menu)
        }
      }
    }
    return renderList
  }

  private _proxyContextMenuEvent = (evt: MouseEvent) => {
    this.context = this._getContext()
    const renderList = this._filterMenuList(this.contextMenuList)
    const isRegisterContextMenu = renderList.some(menu => !menu.isDivider)
    if (isRegisterContextMenu) {
      this.dispose()
      this._render({
        contextMenuList: renderList,
        left: evt.x,
        top: evt.y
      })
    }
    evt.preventDefault()
  }

  private _handleSideEffect = (evt: MouseEvent) => {
    if (this.contextMenuContainerList.length) {
      // 点击非右键菜单内
      const target = <Element>(evt?.composedPath()[0] || evt.target)
      const contextMenuDom = findParent(
        target,
        (node: Node & Element) =>
          !!node &&
          node.nodeType === 1 &&
          node.getAttribute(EDITOR_COMPONENT) === EditorComponent.CONTEXTMENU,
        true
      )
      if (!contextMenuDom) {
        this.dispose()
      }
    }
  }

  private _getContext(): IContextMenuContext {
    // 是否是只读模式
    const isReadonly = this.draw.isReadonly()
    const {
      isCrossRowCol: crossRowCol,
      startIndex,
      endIndex
    } = this.range.getRange()
    // 是否存在焦点
    const editorTextFocus = !!(~startIndex || ~endIndex)
    // 是否存在选区
    const editorHasSelection = editorTextFocus && startIndex !== endIndex
    // 是否在表格内
    const positionContext = this.position.getPositionContext()
    const isInTable = positionContext.isTable
    // 是否存在跨行/列
    const isCrossRowCol = isInTable && !!crossRowCol
    // 当前元素
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex] || null
    const endElement = elementList[endIndex] || null
    // 当前区域
    const zone = this.draw.getZone().getZone()
    return {
      startElement,
      endElement,
      isReadonly,
      editorHasSelection,
      editorTextFocus,
      isInTable,
      isCrossRowCol,
      zone
    }
  }

  private _createContextMenuContainer(): HTMLDivElement {
    const contextMenuContainer = document.createElement('div')
    contextMenuContainer.classList.add(`${EDITOR_PREFIX}-contextmenu-container`)
    contextMenuContainer.setAttribute(
      EDITOR_COMPONENT,
      EditorComponent.CONTEXTMENU
    )
    this.container.append(contextMenuContainer)
    return contextMenuContainer
  }

  private _render(payload: IRenderPayload): HTMLDivElement {
    const { contextMenuList, left, top, parentMenuContainer } = payload
    const contextMenuContainer = this._createContextMenuContainer()
    const contextMenuContent = document.createElement('div')
    contextMenuContent.classList.add(`${EDITOR_PREFIX}-contextmenu-content`)
    // 直接子菜单
    let childMenuContainer: HTMLDivElement | null = null
    // 父菜单添加子菜单映射关系
    if (parentMenuContainer) {
      this.contextMenuRelationShip.set(
        parentMenuContainer,
        contextMenuContainer
      )
    }
    for (let c = 0; c < contextMenuList.length; c++) {
      const menu = contextMenuList[c]
      if (menu.isDivider) {
        // 分割线相邻 || 首尾分隔符时不渲染
        if (
          c !== 0 &&
          c !== contextMenuList.length - 1 &&
          !contextMenuList[c - 1]?.isDivider
        ) {
          const divider = document.createElement('div')
          divider.classList.add(`${EDITOR_PREFIX}-contextmenu-divider`)
          contextMenuContent.append(divider)
        }
      } else {
        const menuItem = document.createElement('div')
        menuItem.classList.add(`${EDITOR_PREFIX}-contextmenu-item`)
        // 菜单事件
        if (menu.childMenus) {
          const childMenus = this._filterMenuList(menu.childMenus)
          const isRegisterContextMenu = childMenus.some(menu => !menu.isDivider)
          if (isRegisterContextMenu) {
            menuItem.classList.add(`${EDITOR_PREFIX}-contextmenu-sub-item`)
            menuItem.onmouseenter = () => {
              this._setHoverStatus(menuItem, true)
              this._removeSubMenu(contextMenuContainer)
              // 子菜单
              const subMenuRect = menuItem.getBoundingClientRect()
              const left = subMenuRect.left + subMenuRect.width
              const top = subMenuRect.top
              childMenuContainer = this._render({
                contextMenuList: childMenus,
                left,
                top,
                parentMenuContainer: contextMenuContainer
              })
            }
            menuItem.onmouseleave = evt => {
              // 移动到子菜单选项选中状态不变化
              if (
                !childMenuContainer ||
                !childMenuContainer.contains(evt.relatedTarget as Node)
              ) {
                this._setHoverStatus(menuItem, false)
              }
            }
          }
        } else {
          menuItem.onmouseenter = () => {
            this._setHoverStatus(menuItem, true)
            this._removeSubMenu(contextMenuContainer)
          }
          menuItem.onmouseleave = () => {
            this._setHoverStatus(menuItem, false)
          }
          menuItem.onclick = () => {
            if (menu.callback && this.context) {
              menu.callback(this.command, this.context)
            }
            this.dispose()
          }
        }
        // 图标
        const icon = document.createElement('i')
        menuItem.append(icon)
        if (menu.icon) {
          icon.classList.add(`${EDITOR_PREFIX}-contextmenu-${menu.icon}`)
        }
        // 文本
        const span = document.createElement('span')
        const name = menu.i18nPath
          ? this._formatName(this.i18n.t(menu.i18nPath))
          : this._formatName(menu.name || '')
        span.append(document.createTextNode(name))
        menuItem.append(span)
        // 快捷方式提示
        if (menu.shortCut) {
          const span = document.createElement('span')
          span.classList.add(`${EDITOR_PREFIX}-shortcut`)
          span.append(document.createTextNode(menu.shortCut))
          menuItem.append(span)
        }
        contextMenuContent.append(menuItem)
      }
    }
    contextMenuContainer.append(contextMenuContent)
    contextMenuContainer.style.display = 'block'
    // 右侧空间不足时，以菜单右上角作为起始点
    const innerWidth = window.innerWidth
    const contextmenuRect = contextMenuContainer.getBoundingClientRect()
    const contextMenuWidth = contextmenuRect.width
    const adjustLeft =
      left + contextMenuWidth > innerWidth ? left - contextMenuWidth : left
    contextMenuContainer.style.left = `${adjustLeft}px`
    // 下侧空间不足时，以菜单底部作为起始点
    const innerHeight = window.innerHeight
    const contextMenuHeight = contextmenuRect.height
    const adjustTop =
      top + contextMenuHeight > innerHeight ? top - contextMenuHeight : top
    contextMenuContainer.style.top = `${adjustTop}px`
    this.contextMenuContainerList.push(contextMenuContainer)
    return contextMenuContainer
  }

  private _removeSubMenu(payload: HTMLDivElement) {
    const childMenu = this.contextMenuRelationShip.get(payload)
    if (childMenu) {
      this._removeSubMenu(childMenu)
      childMenu.remove()
      this.contextMenuRelationShip.delete(payload)
    }
  }

  private _setHoverStatus(payload: HTMLDivElement, status: boolean) {
    if (status) {
      payload.parentNode
        ?.querySelectorAll(`${EDITOR_PREFIX}-contextmenu-item`)
        .forEach(child => child.classList.remove('hover'))
      payload.classList.add('hover')
    } else {
      payload.classList.remove('hover')
    }
  }

  private _formatName(name: string): string {
    const placeholderValues = Object.values(NAME_PLACEHOLDER)
    const placeholderReg = new RegExp(`${placeholderValues.join('|')}`)
    let formatName = name
    if (placeholderReg.test(formatName)) {
      // 选区名称
      const selectedReg = new RegExp(NAME_PLACEHOLDER.SELECTED_TEXT, 'g')
      if (selectedReg.test(formatName)) {
        const selectedText = this.range.toString()
        formatName = formatName.replace(selectedReg, selectedText)
      }
    }
    return formatName
  }

  public registerContextMenuList(payload: IRegisterContextMenu[]) {
    this.contextMenuList.push(...payload)
  }

  public dispose() {
    this.contextMenuContainerList.forEach(child => child.remove())
    this.contextMenuContainerList = []
    this.contextMenuRelationShip.clear()
  }
}
