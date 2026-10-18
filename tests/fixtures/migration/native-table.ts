import { Draw } from '../../../src/editor/core/draw/Draw'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { VerticalAlign } from '../../../src/editor/dataset/enum/VerticalAlign'
import type { IElement } from '../../../src/editor/interface/Element'
import { formatElementList } from '../../../src/editor/utils/element'
import { mergeOption } from '../../../src/editor/utils/option'

async function run() {
  const direction =
    new URLSearchParams(location.search).get('direction') === 'rtl'
      ? TextDirection.RTL
      : TextDirection.LTR
  const data = await (
    await fetch('/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf')
  ).arrayBuffer()
  const nested: IElement = {
    type: ElementType.TABLE,
    value: '',
    direction,
    borderColor: '#ff0000',
    borderWidth: 3,
    colgroup: [{ width: 200 }, { width: 200 }],
    trList: [
      {
        height: 42,
        tdList: [
          { rowspan: 1, colspan: 1, value: [{ value: 'مرحبا Hello' }] },
          { rowspan: 1, colspan: 1, value: [{ value: ZERO }] }
        ]
      }
    ]
  }
  const outer: IElement = {
    type: ElementType.TABLE,
    value: '',
    direction,
    borderColor: '#0000ff',
    borderWidth: 2,
    colgroup: [{ width: 200 }, { width: 180 }],
    trList: [
      {
        height: 240,
        minHeight: 240,
        tdList: [
          {
            rowspan: 1,
            colspan: 1,
            verticalAlign: VerticalAlign.MIDDLE,
            value: [nested]
          },
          {
            rowspan: 1,
            colspan: 1,
            value: [
              { value: 'first', spacingAfter: 11 },
              { value: '\n', spacingBefore: 17 },
              { value: 'second' }
            ]
          }
        ]
      }
    ]
  }
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    width: 500,
    height: 800,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true },
    table: { overflow: false, tdPadding: [4, 8, 4, 8] }
  })
  const main = [outer]
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(
    document.querySelector<HTMLDivElement>('#editor')!,
    options,
    { main, header: [{ value: ZERO }], footer: [{ value: ZERO }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  await draw.ready
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  const rootIndex = main.indexOf(outer)
  const parent = outer.trList![0].tdList[0]
  const innerIndex = parent.value.indexOf(nested)
  const select = () => {
    draw.getPosition().setPositionContext({
      isTable: true,
      index: rootIndex,
      trIndex: 0,
      tdIndex: 0,
      tablePath: [
        { index: rootIndex, trIndex: 0, tdIndex: 0 },
        { index: innerIndex, trIndex: 0, tdIndex: 0 }
      ]
    })
    draw.getRange().setRange(0, 0)
    draw.getTableTool().render()
  }
  Object.assign(window, { nativeTable: { draw, outer, nested, select } })
  select()
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = 'failed: ' + error.message
  console.error(error)
})
