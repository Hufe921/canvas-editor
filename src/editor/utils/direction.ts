import { TextDirection } from '../dataset/enum/TextDirection'
import { IEditorOption } from '../interface/Editor'
import { IElement } from '../interface/Element'

export type UiDirection = TextDirection.LTR | TextDirection.RTL

/**
 * LTR/RTL 模式（options.direction，默认 LTR）。
 * 只描述编辑器 UI 组件方向；不参与正文排版/光标碰撞。
 */
export function resolveUiDirection(
  options: Pick<IEditorOption, 'direction'> | null | undefined
): UiDirection {
  return options?.direction === TextDirection.RTL
    ? TextDirection.RTL
    : TextDirection.LTR
}

export function isUiRtl(
  options: Pick<IEditorOption, 'direction'> | null | undefined
): boolean {
  return resolveUiDirection(options) === TextDirection.RTL
}

/**
 * 新建行/表时写入的默认 element.direction（与当前 LTR/RTL 模式一致）。
 * 仅创建时落盘；不参与存量正文解析，切换模式不改已有数据。
 */
export function resolveNewContentDirection(
  options: Pick<IEditorOption, 'direction'> | null | undefined
): UiDirection {
  return resolveUiDirection(options)
}

/**
 * 表格外壳是否镜像：只看元素自身 direction。
 * LTR/RTL 模式不得改写未声明表格的既有布局；新表创建时写入 direction。
 */
export function isTableMirrored(
  element: Pick<IElement, 'direction'> | null | undefined,
  options?: Pick<IEditorOption, 'direction'> | null | undefined
): boolean {
  // 第二参保留兼容调用方；镜像只看 element.direction，与 UI 模式无关
  void options
  return element?.direction === TextDirection.RTL
}
