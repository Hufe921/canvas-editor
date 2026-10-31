import { BackendType } from '../../src/editor/dataset/enum/Editor'
import { Draw } from '../../src/editor/core/draw/Draw'
import { EventBus } from '../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../src/editor/core/listener/Listener'
import { Override } from '../../src/editor/core/override/Override'
import { ElementType } from '../../src/editor/dataset/enum/Element'
import { TraceType } from '../../src/editor/dataset/enum/Trace'
import type { IElement } from '../../src/editor/interface/Element'
import { formatElementList } from '../../src/editor/utils/element'
import { mergeOption } from '../../src/editor/utils/option'

/** Independent browser reproductions; failed expectations remain explicit. */
export function reviewParagraphFlowEdgesInBrowser(scale = 1, backend = BackendType.CANVAS) {
  const context = document.createElement('canvas').getContext('2d')
  if (!context) throw new Error('Missing canvas')
  context.font = '16px monospace'
  const letters = Math.floor(80 / context.measureText('x').width)
  const line = { rule: 'exact', value: 20 } as const
  const prefix = (n: number): IElement[] =>
    Array.from({ length: n }, () => ({ value: '\npre', lineHeight: line }))
  function inspect(main: IElement[]) {
    const options = mergeOption({
      backend,
      width: 120,
      height: 200,
      scale,
      margins: [20, 20, 20, 20],
      preserveLeadingParagraph: true,
      header: { disabled: true },
      footer: { disabled: true },
      defaultFont: 'monospace',
      defaultSize: 16,
      defaultRowMargin: 0,
      defaultBasicRowMarginHeight: 0
    })
    formatElementList(main, {
      editorOptions: options,
      isForceCompensation: true
    })
    const host = document.createElement('div')
    document.body.appendChild(host)
    let draw: Draw | undefined
    try {
      draw = new Draw(
        host,
        options,
        { main, header: [], footer: [] },
        new Listener(),
        new EventBus(),
        new Override()
      )
      draw.render({ isLazy: false })
      const rows = draw.getPageRowList()
      const positions = draw.getPosition().getPositionList()
      const original = draw.getOriginalElementList()
      const inBounds = (position: (typeof positions)[number]) =>
        position.coordinate.leftTop[1] >= 20 * scale - 0.01 &&
        position.coordinate.leftBottom[1] <= 180 * scale + 0.01
      return {
        error: '',
        tableFragments: draw.getPosition().getTablePagingPositionList().length,
        withinBounds:
          positions.length === original.length &&
          positions.every(
            position =>
              original[position.index]?.type === ElementType.TABLE ||
              inBounds(position)
          ) &&
          draw.getPosition().getTablePagingPositionList().every(inBounds),
        links: rows.map(
          page =>
            page.filter(row =>
              row.elementList.some(
                element => element.type === ElementType.HYPERLINK
              )
            ).length
        ),
        areaPage: rows.findIndex(page =>
          page.some(row => row.elementList.some(element => element.areaId))
        ),
        pageRows: rows.map(page => page.length)
      }
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : String(error),
        tableFragments: 0,
        withinBounds: false,
        links: [],
        areaPage: -1,
        pageRows: []
      }
    } finally {
      draw?.destroy()
      host.remove()
    }
  }
  const linked = (style: Partial<IElement>): IElement[] => [
    { value: '\n', ...style, lineHeight: line },
    {
      type: ElementType.HYPERLINK,
      value: '',
      valueList: [{ value: 'x'.repeat(4 * letters - 1), lineHeight: line }],
      url: 'https://example.test',
      lineHeight: line
    }
  ]
  const hyperlink = inspect([...prefix(5), ...linked({ keepTogether: true })])
  const widow = inspect([...prefix(5), ...linked({ widowControl: true })])
  const orphan = inspect([...prefix(7), ...linked({ widowControl: true })])
  const chain = inspect([
    ...prefix(5),
    { value: '\nHeading', keepWithNext: true, lineHeight: line },
    ...linked({})
  ])
  const area = (enabled: boolean): IElement[] => [
    { value: '\npre', keepTogether: enabled, lineHeight: line },
    ...prefix(2),
    {
      type: ElementType.AREA,
      value: '',
      areaId: 'panel',
      area: { minHeight: 200 },
      valueList: [{ value: '\narea', lineHeight: line }]
    },
    ...prefix(1)
  ]
  const baselineArea = inspect(area(false))
  const enabledArea = inspect(area(true))
  const table = (): IElement => ({
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 80 }],
    trList: [
      {
        height: 0,
        tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
      }
    ]
  })
  const hidden = inspect([
    ...prefix(1),
    { value: '\nhidden', hide: true, keepWithNext: true, lineHeight: line },
    table()
  ])
  const empty = inspect([
    ...prefix(1),
    {
      value: '\n',
      hide: true,
      keepWithNext: true,
      pageBreakBefore: true,
      lineHeight: line
    },
    table()
  ])
  const deleted = inspect([
    ...prefix(1),
    {
      value: '\ndeleted',
      trace: [{ type: TraceType.DELETED }],
      keepWithNext: true,
      pageBreakBefore: true,
      lineHeight: line
    },
    table()
  ])
  const protectedTarget = inspect([
    ...prefix(1),
    { value: '\nHeading', keepWithNext: true, lineHeight: line },
    { value: '\nhidden', hide: true, keepWithNext: false, lineHeight: line },
    table()
  ])
  const afterMove = (following: 'text' | 'table') =>
    inspect([
      ...prefix(5),
      ...linked({ keepTogether: true }),
      {
        type: ElementType.AREA,
        value: '',
        areaId: 'after-move',
        area: { minHeight: following === 'table' ? 160 : 200 },
        valueList: [{ value: '\narea', lineHeight: line }]
      },
      ...(following === 'text'
        ? prefix(6)
        : [
            {
              type: ElementType.TABLE,
              value: '',
              colgroup: [{ width: 80 }],
              trList: Array.from({ length: 8 }, () => ({
                height: 30,
                minHeight: 30,
                tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'cell' }] }]
              }))
            }
          ])
    ])
  const afterMoveText = afterMove('text')
  const afterMoveTable = afterMove('table')
  return [
    {
      name: 'hyperlink-keeps',
      passed:
        hyperlink.error === '' &&
        hyperlink.links[0] === 0 &&
        hyperlink.links[1] === 4,
      expected: 'four linked lines together on the next page',
      actual: hyperlink
    },
    {
      name: 'unrelated-area',
      passed:
        enabledArea.error === '' &&
        enabledArea.areaPage === baselineArea.areaPage,
      expected: baselineArea,
      actual: enabledArea
    },
    {
      name: 'hidden-keep',
      passed: hidden.error === '',
      expected: 'render without an unsupported-target error',
      actual: hidden
    },
    {
      name: 'hyperlink-widow',
      passed: widow.error === '' && JSON.stringify(widow.links) === '[2,2]',
      expected: '[2,2]',
      actual: widow
    },
    {
      name: 'hyperlink-orphan',
      passed: orphan.error === '' && JSON.stringify(orphan.links) === '[0,4]',
      expected: '[0,4]',
      actual: orphan
    },
    {
      name: 'hyperlink-chain',
      passed: chain.error === '' && JSON.stringify(chain.pageRows) === '[5,5]',
      expected: '[5,5]',
      actual: chain
    },
    {
      name: 'hidden-empty-keep',
      passed: empty.error === '' && empty.pageRows.length === 1,
      expected: 'one page without an exception',
      actual: empty
    },
    {
      name: 'deleted-keep',
      passed: deleted.error === '' && deleted.pageRows.length === 1,
      expected: 'one page without an exception',
      actual: deleted
    },
    {
      name: 'visible-object-target',
      passed: /following object/u.test(protectedTarget.error),
      expected: 'visible keep still rejects an object after hidden text',
      actual: protectedTarget
    },
    {
      name: 'area-after-keep-text',
      passed:
        afterMoveText.error === '' &&
        afterMoveText.areaPage === 1 &&
        afterMoveText.withinBounds,
      expected:
        'area stays after the kept paragraph; all text remains in bounds',
      actual: afterMoveText
    },
    {
      name: 'area-after-keep-table',
      passed:
        afterMoveTable.error === '' &&
        afterMoveTable.areaPage === 1 &&
        afterMoveTable.tableFragments > 1 &&
        afterMoveTable.withinBounds,
      expected:
        'area stays after the kept paragraph; table fragments remain in bounds',
      actual: afterMoveTable
    }
  ]
}
