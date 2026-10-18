import { CommandAdapt } from '../../../src/editor/core/command/CommandAdapt'
import { Draw } from '../../../src/editor/core/draw/Draw'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import {
  lineCarets,
  textRangeRects
} from '../../../src/editor/core/layout/InteractionGeometry'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { PaperDirection } from '../../../src/editor/dataset/enum/Editor'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import {
  CaretMovement,
  TextDirection
} from '../../../src/editor/dataset/enum/TextDirection'
import { TextScript } from '../../../src/editor/dataset/enum/TextScript'
import type { IElement } from '../../../src/editor/interface/Element'
import { formatElementList } from '../../../src/editor/utils/element'
import { mergeOption } from '../../../src/editor/utils/option'

async function run() {
  const arabic = await (
    await fetch('/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf')
  ).arrayBuffer()
  const latin = await (
    await fetch(
      '/canvas-editor/tests/fixtures/fonts/NotoSans-Latin-Regular.woff2'
    )
  ).arrayBuffer()
  const params = new URLSearchParams(location.search)
  const rtl = params.has('rtl')
  const direction = rtl ? TextDirection.RTL : TextDirection.LTR
  const table: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 130 }, { width: 130 }],
    trList: [
      {
        height: 35,
        pagingRepeat: true,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: 'cell one', direction }] },
          { colspan: 1, rowspan: 1, value: [{ value: 'cell two', direction }] }
        ]
      },
      ...Array.from({ length: 6 }, () => ({
        height: 40,
        tdList: [
          {
            colspan: 2,
            rowspan: 1,
            value: [{ value: 'table مرحبا '.repeat(12), direction }]
          }
        ]
      }))
    ]
  }
  const main: IElement[] = params.has('tables')
    ? [table]
    : [
        {
          value: 'office é مرحبا 👩‍👩‍👧‍👦 sample '.repeat(5),
          direction,
          spacingAfter: 35
        },
        { value: ZERO, direction },
        { value: 'second paragraph مرحبا '.repeat(10), direction },
        {
          value: '',
          type: ElementType.PAGE_BREAK,
          paperDirection: PaperDirection.HORIZONTAL
        },
        { value: 'wide page office مرحبا '.repeat(8), direction }
      ]
  const options = mergeOption({
    autoDownloadFonts: false,
    lab: { incrementalCompute: params.has('incremental') },
    defaultFont: 'Latin',
    fonts: [
      { family: 'Latin', data: latin },
      { family: 'Arabic', data: arabic, scripts: [TextScript.ARAB] }
    ],
    width: 340,
    height: 430,
    margins: [25, 25, 25, 25],
    scale: 1.25,
    defaultDirection: direction,
    direction,
    caretMovement: CaretMovement.VISUAL,
    pageNumber: { disabled: true },
    header: { disabled: false, top: 4 },
    footer: { disabled: true },
    spellcheck: { disabled: false }
  })
  const content = {
    main,
    header: [{ value: 'header مرحبا' }],
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
  draw.render({ isLazy: false, isSetCursor: false, isSubmitHistory: false })
  for (const name of ['measureText', 'fillText', 'strokeText'] as const)
    CanvasRenderingContext2D.prototype[name] = () => {
      throw new Error('Unexpected Canvas text: ' + name)
    }
  function mouse(
    type: string,
    stop: { pageNo: number; x: number; y: number; height: number },
    shiftKey = false
  ) {
    draw.setPageNo(stop.pageNo)
    const page = draw.getPage(),
      rect = page.getBoundingClientRect()
    page.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + stop.x,
        clientY: rect.top + stop.y + stop.height / 2,
        buttons: type === 'mouseup' ? 0 : 1,
        button: 0,
        shiftKey
      })
    )
  }
  function place(index: number) {
    draw.getPosition().setNativeCaretHint(null)
    draw.getRange().setRange(index, index)
    draw.render({ curIndex: index, isCompute: false, isSubmitHistory: false })
  }
  Object.assign(window, {
    nativeInteraction: {
      draw,
      command: new CommandAdapt(draw),
      lineCarets,
      textRangeRects,
      mouse,
      place
    }
  })
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = String(error)
  throw error
})
