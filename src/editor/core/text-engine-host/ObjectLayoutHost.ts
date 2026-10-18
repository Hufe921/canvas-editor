import { BlockType } from '../../dataset/enum/Block'
import { ElementType } from '../../dataset/enum/Element'
import { RowFlex } from '../../dataset/enum/Row'
import type { DeepRequired } from '../../interface/Common'
import type { IEditorOption } from '../../interface/Editor'
import type { IElement } from '../../interface/Element'
import type { LayoutRevision, LayoutSource } from '../../interface/Layout'
import type { LayoutRow } from '../../interface/LayoutRow'
import { layoutObject } from '../layout/ObjectLayout'
import { getLayoutFlowHeight } from '../text-engine/layout/layoutProtocol'

/** A native object node with container-flow bookkeeping. */
export function layoutHostObject(input: {
  element: IElement
  source: LayoutSource
  revision: LayoutRevision
  options: DeepRequired<IEditorOption>
  availableWidth: number
  margin: number
  rowIndex: number
  hidden: boolean
}) {
  const {
    element,
    options: { scale },
    hidden
  } = input
  const kind =
    element.type === ElementType.PAGE_BREAK
      ? 'page'
      : element.type === ElementType.SEPARATOR
        ? 'separator'
        : element.type === ElementType.BLOCK
          ? element.block?.type === BlockType.VIDEO
            ? 'video'
            : 'iframe'
          : 'float'
  const node = layoutObject({
    kind,
    align:
      element.rowFlex === RowFlex.CENTER
        ? 'center'
        : element.rowFlex === RowFlex.RIGHT
          ? 'right'
          : 'left',
    source: input.source,
    revision: input.revision,
    availableWidth: input.availableWidth / scale,
    width: kind === 'separator' || kind === 'page' ? undefined : element.width,
    height:
      kind === 'separator'
        ? element.lineWidth || input.options.separator.lineWidth
        : element.height || 0,
    margin: input.margin / scale,
    hidden,
    paperDirection: element.paperDirection,
    objectType: element.type === ElementType.LATEX ? 'latex' : 'image',
    floatPosition: element.imgFloatPosition
  })
  const floating = kind === 'float'
  const before = node.kind === 'block' ? node.spacingBefore || 0 : 0
  const row: LayoutRow = {
    width: hidden || floating ? 0 : node.rect.width * scale,
    height: getLayoutFlowHeight(node) * scale,
    ascent: before * scale,
    startIndex: input.source.start,
    rowIndex: input.rowIndex,
    rowFlex: element.rowFlex,
    isPageBreak: kind === 'page' && !hidden,
    ...(element.paperDirection
      ? { paperDirection: element.paperDirection }
      : {}),
    node,
    sourceIndices: [input.source.start],
    elementList: [element]
  }
  return { node, row }
}
