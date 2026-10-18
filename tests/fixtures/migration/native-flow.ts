import { Draw } from '../../../src/editor/core/draw/Draw'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ImageDisplay } from '../../../src/editor/dataset/enum/Common'
import { PaperDirection } from '../../../src/editor/dataset/enum/Editor'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import type { IElement } from '../../../src/editor/interface/Element'
import { formatElementList } from '../../../src/editor/utils/element'
import { mergeOption } from '../../../src/editor/utils/option'
async function run() {
  const data = await (
    await fetch('/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf')
  ).arrayBuffer()
  const params = new URLSearchParams(location.search)
  const rtl = params.has('rtl'),
    tables = params.has('tables'),
    limited = params.has('limited')
  const red =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="red"/></svg>'
    )
  const table: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 240 }],
    trList: Array.from({ length: 16 }, (_, index) => ({
      height: 40,
      pagingRepeat: index === 0,
      tdList: [
        {
          colspan: 1,
          rowspan: 1,
          value: [{ value: index === 0 ? 'HEADER' : 'row مرحبا '.repeat(18) }]
        }
      ]
    }))
  }
  const main: IElement[] = tables
    ? [table, { value: 'after table '.repeat(50) }]
    : [
        {
          type: ElementType.IMAGE,
          value: red,
          width: 80,
          height: 90,
          imgDisplay: ImageDisplay.SURROUND,
          imgFloatPosition: { x: 20, y: 20, pageNo: 0 }
        },
        {
          type: ElementType.IMAGE,
          value: red,
          width: 65,
          height: 140,
          imgDisplay: ImageDisplay.SURROUND,
          imgFloatPosition: { x: 85, y: 20, pageNo: 0 }
        },
        { value: (rtl ? 'مرحبا بالعالم ' : 'words sample ').repeat(70) },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'wide section مرحبا '.repeat(120) }
      ]
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    width: 320,
    height: 500,
    margins: [20, 20, 20, 20],
    defaultDirection: rtl ? TextDirection.RTL : TextDirection.LTR,
    column: { count: 2, gap: 20 },
    scale: 1.25,
    header: { disabled: false, top: 5, disabledPages: [1] },
    footer: { disabled: true },
    pageNumber: limited ? { maxPageNo: 0 } : undefined
  })
  const content = {
    main,
    header: [{ value: 'header '.repeat(12) }],
    footer: [{ value: ZERO }]
  }
  Object.values(content).forEach(elements =>
    formatElementList(elements, {
      editorOptions: options,
      isForceCompensation: true
    })
  )
  const draw = new Draw(
    document.querySelector<HTMLDivElement>('#editor')!,
    options,
    content,
    new Listener(),
    new EventBus(),
    new Override()
  )
  await draw.ready
  await draw.getDataURL()
  Object.assign(window, { nativeFlow: { draw, table } })
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = String(error)
  throw error
})
