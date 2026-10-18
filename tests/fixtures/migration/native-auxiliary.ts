import { CommandAdapt } from '../../../src/editor/core/command/CommandAdapt'
import { Draw } from '../../../src/editor/core/draw/Draw'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import {
  measurePlainText,
  truncatePlainText
} from '../../../src/editor/core/text-engine-host/drawPlainText'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
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
  const rtl = params.has('rtl')
  // Every canvas, including offscreen watermark tiles, must use glyph outlines.
  for (const name of ['measureText', 'fillText', 'strokeText'] as const)
    CanvasRenderingContext2D.prototype[name] = () => {
      throw new Error('Unexpected browser text: ' + name)
    }
  const tiles: { width: number; height: number; matrix?: number[] }[] = []
  const createPattern = CanvasRenderingContext2D.prototype.createPattern
  CanvasRenderingContext2D.prototype.createPattern = function (image, repeat) {
    const pattern = createPattern.call(this, image, repeat)
    if (image instanceof HTMLCanvasElement && pattern) {
      const tile = {
        width: image.width,
        height: image.height
      } as (typeof tiles)[number]
      const setTransform = pattern.setTransform
      pattern.setTransform = function (matrix) {
        tile.matrix = [matrix?.a || 0, matrix?.d || 0]
        setTransform.call(this, matrix)
      }
      tiles.push(tile)
    }
    return pattern
  }
  const image: IElement = {
    type: ElementType.IMAGE,
    value:
      'data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="red"/></svg>'
      ),
    width: 80,
    height: 40,
    imgCaption: {
      value: 'Fig {imageNo} é👩‍👩‍👧‍👦 مرحبا Caption',
      font: 'Arabic',
      size: 14
    }
  }
  const table: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 140 }, { width: 140 }],
    trList: [
      {
        height: 30,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: 'Auto مرحبا' }] },
          { colspan: 1, rowspan: 1, value: [{ value: 'width' }] }
        ]
      }
    ]
  }
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    width: 320,
    height: 500,
    margins: [30, 30, 30, 30],
    scale: params.has('zoom') ? 1.75 : 1,
    defaultDirection: rtl ? TextDirection.RTL : TextDirection.LTR,
    direction: rtl ? TextDirection.RTL : TextDirection.LTR,
    pageNumber: { font: 'Arabic', format: 'Page {pageNo}/{pageCount} مرحبا' },
    lineNumber: { disabled: false, font: 'Arabic' },
    watermark: {
      data: 'Watermark مرحبا',
      font: 'Arabic',
      size: 20,
      repeat: true,
      gap: [12, 16]
    },
    ruler: { disabled: false },
    placeholder: { data: 'Placeholder مرحبا', font: 'Arabic' },
    header: { disabled: true },
    footer: { disabled: true },
    pageBreak: { font: 'Arabic' }
  })
  const content = {
    main: params.has('empty')
      ? []
      : [
          { value: 'body مرحبا' },
          image,
          table,
          {
            value: '',
            type: ElementType.PAGE_BREAK,
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: 'tail مرحبا' }
        ],
    header: [{ value: ZERO }],
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
  draw.setPagePixelRatio(2)
  await draw.getDataURL()
  const command = new CommandAdapt(draw)
  Object.assign(window, {
    nativeAuxiliary: {
      draw,
      command,
      tiles,
      table,
      truncatePlainText,
      measurePlainText
    }
  })
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = String(error)
  throw error
})
