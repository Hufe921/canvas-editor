import { Draw } from '../../../src/editor/core/draw/Draw'
import { EventBus } from '../../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../../src/editor/core/listener/Listener'
import { Override } from '../../../src/editor/core/override/Override'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import {
  ControlIndentation,
  ControlType
} from '../../../src/editor/dataset/enum/Control'
import { EditorMode } from '../../../src/editor/dataset/enum/Editor'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { ListStyle, ListType } from '../../../src/editor/dataset/enum/List'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import type { IElement } from '../../../src/editor/interface/Element'
import type { LayoutNode } from '../../../src/editor/interface/Layout'
import {
  formatElementList,
  zipElementList
} from '../../../src/editor/utils/element'
import { mergeOption } from '../../../src/editor/utils/option'

async function run() {
  const data = await (
    await fetch('/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf')
  ).arrayBuffer()
  const rtl = new URLSearchParams(location.search).has('rtl')
  const main: IElement[] = [
    { value: 'label ' },
    {
      value: '',
      type: ElementType.CONTROL,
      controlId: 'text',
      control: {
        type: ControlType.TEXT,
        value: null,
        placeholder: 'name',
        minWidth: 190,
        prefix: '[',
        postfix: ']',
        rowFlex: RowFlex.CENTER,
        indentation: ControlIndentation.VALUE_START,
        border: true,
        underline: true,
        noValueBackgroundColor: '#ffe0e0',
        existValueBackgroundColor: '#ddffdd'
      }
    },
    { value: '\n' },
    {
      value: 'label مرحبا',
      type: ElementType.LABEL,
      label: { padding: [5, 13, 9, 7], backgroundColor: '#ff00ff' }
    },
    { value: 'link', type: ElementType.HYPERLINK, url: 'https://example.com' },
    { value: '2026-10-17', type: ElementType.DATE },
    {
      value: ' decorated',
      underline: true,
      strikeout: true,
      highlight: '#ffff00'
    },
    { value: '\n' },
    {
      value: '',
      type: ElementType.CONTROL,
      controlId: 'check',
      control: {
        type: ControlType.CHECKBOX,
        value: null,
        code: 'a',
        minWidth: 140,
        valueSets: [
          { code: 'a', value: 'one' },
          { code: 'b', value: 'two' }
        ]
      }
    }
  ]
  for (let i = 0; i < 12; i++)
    main.push(
      {
        value: '\n',
        listId: 'list',
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL,
        listLevel: i % 3
      },
      {
        value: `item ${i}`,
        listId: 'list',
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL,
        listLevel: i % 3
      }
    )
  main.push({
    value: '',
    type: ElementType.TABLE,
    colgroup: [{ width: 180 }],
    trList: [
      {
        height: 40,
        tdList: [
          {
            colspan: 1,
            rowspan: 1,
            value: [
              {
                value: '',
                type: ElementType.CONTROL,
                controlId: 'nested',
                control: {
                  type: ControlType.TEXT,
                  value: null,
                  placeholder: 'name',
                  minWidth: 140
                }
              }
            ]
          }
        ]
      }
    ]
  })
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: [{ family: 'Arabic', data }],
    defaultDirection: rtl ? TextDirection.RTL : TextDirection.LTR,
    scale: 1.5,
    width: 440,
    height: 1800,
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
  draw.render({ isLazy: false, isSetCursor: false })
  const set = (value: string | null, isOverwrite = true) =>
    draw
      .getControl()
      .setValueListById([
        { id: 'text', value, isOverwrite, isSubmitHistory: false }
      ])
  const native = () => {
    const nodes: LayoutNode[] = []
    draw.computeRowList({
      elementList: draw.getOriginalMainElementList(),
      innerWidth: 600,
      nativeNodes: nodes
    })
    return nodes
  }
  const forbidLegacyText = () => {
    for (const name of ['measureText', 'fillText', 'strokeText'] as const)
      CanvasRenderingContext2D.prototype[name] = () => {
        throw new Error('Browser text API reached')
      }
  }
  Object.assign(window, {
    nativeChrome: {
      draw,
      get main() {
        return draw.getOriginalMainElementList()
      },
      set,
      native,
      forbidLegacyText,
      persisted: () => zipElementList(draw.getOriginalMainElementList()),
      readonly: () => draw.setMode(EditorMode.READONLY)
    }
  })
  document.querySelector('#status')!.textContent = 'ready'
}
await run().catch(error => {
  document.querySelector('#status')!.textContent = String(error)
  throw error
})
