import { Draw } from '../../../src/editor/core/draw/Draw'
import { LaTexParticle } from '../../../src/editor/core/draw/particle/latex/LaTexParticle'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { BlockType } from '../../../src/editor/dataset/enum/Block'
import { ImageDisplay } from '../../../src/editor/dataset/enum/Common'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import type { IElement } from '../../../src/editor/interface/Element'
import { formatElementList } from '../../../src/editor/utils/element'
import { mergeOption } from '../../../src/editor/utils/option'

async function run() {
  const data = await (
    await fetch('/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf')
  ).arrayBuffer()
  const red =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="red"/></svg>'
    )
  const image: IElement = {
    type: ElementType.IMAGE,
    value: red,
    width: 120,
    height: 60,
    imgDisplay: ImageDisplay.INLINE,
    imgCaption: {
      value: 'caption مرحبا',
      font: 'Arabic',
      size: 14,
      color: '#0000ff',
      top: 7
    }
  }
  const converted = LaTexParticle.convertLaTextToSVG('x^2 + y^2')
  const formula: IElement = {
    type: ElementType.LATEX,
    value: 'x^2 + y^2',
    width: converted.width,
    height: converted.height,
    laTexSVG: converted.svg
  }
  const block: IElement = {
    type: ElementType.BLOCK,
    value: '',
    width: 600,
    height: 70,
    block: {
      type: BlockType.IFRAME,
      iframeBlock: {
        srcdoc:
          '<html><body style="margin:0;background:#8800ff">block</body></html>'
      }
    }
  }
  const table: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 180 }],
    trList: [
      { height: 42, tdList: [{ colspan: 1, rowspan: 1, value: [block] }] }
    ]
  }
  const main: IElement[] = [
    { value: 'before ' },
    image,
    { value: ' after' },
    { value: '\n' },
    formula,
    { value: '\n' },
    table
  ]
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    scale: 1.5,
    width: 500,
    height: 1400,
    margins: [20, 20, 20, 20],
    header: { disabled: true },
    footer: { disabled: true }
  })
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
  await draw.getDataURL()
  const select = () => {
    const index = main.indexOf(image)
    const position = draw.getPosition().getOriginalMainPositionList()[index]
    draw.getRange().setRange(index, index)
    draw.getPreviewer().drawResizer(image, position)
  }
  Object.assign(window, {
    nativeObject: { draw, image, formula, block, table, select }
  })
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = 'failed: ' + error.message
  console.error(error)
})
