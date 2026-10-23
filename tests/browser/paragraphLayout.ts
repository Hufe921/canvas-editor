import { Draw } from '../../src/editor/core/draw/Draw'
import { EventBus } from '../../src/editor/core/event/eventbus/EventBus'
import { Listener } from '../../src/editor/core/listener/Listener'
import { Override } from '../../src/editor/core/override/Override'
import {
  BackendType,
  EditorMode,
  PaperDirection
} from '../../src/editor/dataset/enum/Editor'
import { ElementType } from '../../src/editor/dataset/enum/Element'
import type {
  IEditorData,
  IEditorOption
} from '../../src/editor/interface/Editor'
import { formatElementList } from '../../src/editor/utils/element'
import { mergeOption } from '../../src/editor/utils/option'

/** Run through Vite in a real browser; no mocked Canvas TextMetrics. */
export function reviewParagraphLayoutInBrowser(
  backend = BackendType.CANVAS
) {
  const results: { name: string; pages: number }[] = []
  const check = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message)
  }
  function inspect(
    name: string,
    data: IEditorData,
    override: IEditorOption,
    verify: (draw: Draw) => void
  ) {
    const options = mergeOption({
      backend,
      width: 300,
      height: 500,
      margins: [10, 20, 30, 40],
      defaultFont: 'serif',
      preserveLeadingParagraph: true,
      header: { disabled: true },
      footer: { disabled: true },
      ...override
    })
    formatElementList(data.main, {
      editorOptions: options,
      isForceCompensation: true
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const draw = new Draw(
      container,
      options,
      data,
      new Listener(),
      new EventBus(),
      new Override()
    )
    try {
      draw.render({ isLazy: false })
      verify(draw)
      results.push({ name, pages: draw.getPageRowList().length })
    } finally {
      draw.destroy()
      container.remove()
    }
  }
  for (const scale of [0.5, 1, 2]) {
    inspect(
      `landscape-columns-${scale}`,
      {
        main: [
          { value: 'Portrait' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          ...Array.from(
            { length: 24 },
            (_, i) =>
              ({
                value: `\nrow ${i}`,
                lineHeight: { rule: 'exact', value: 20 }
              }) as const
          )
        ]
      },
      { scale, column: { count: 2, gap: 20 } },
      draw => {
        const positions = draw.getPosition().getPositionList()
      check(draw.getPageRowList().length === 2,
        'Page-break marker consumed space on the landscape page')
        const left = positions.find(
          p => p.pageNo === 1 && p.columnIndex === 0 && p.isLastLetter
        )
        const right = positions.find(
          p => p.pageNo === 1 && p.columnIndex === 1 && p.isFirstLetter
        )
        if (!left || !right) throw new Error('Both landscape columns required')
        const portrait = draw.getColumnLayout(PaperDirection.VERTICAL)
        const landscape = draw.getColumnLayout(PaperDirection.HORIZONTAL)
        if (!portrait || !landscape) throw new Error('Column layout required')
        const margins = draw.getMargins(PaperDirection.HORIZONTAL)
        const hit = draw.getPosition().getPositionByXY({
          x: margins[3] + (portrait.offsets[1] + landscape.offsets[1]) / 2,
          y: (left.coordinate.leftTop[1] + left.coordinate.leftBottom[1]) / 2,
          pageNo: 1
        })
        check(
          hit.index === left.index,
          'Landscape whitespace selects wrong row'
        )
        check(
          Math.abs(
            right.coordinate.leftTop[0] - margins[3] - landscape.offsets[1]
          ) < 0.01,
          'Landscape column has wrong origin'
        )
        draw.setPageNo(1)
        check(
          Math.abs(draw.getContextInnerWidth() - landscape.width / scale) <
            0.01,
          'Context width was scaled twice'
        )
        check(
          draw
            .getPageRowList()[0]
            .every(row =>
              row.elementList.every(element => !element.lineHeight)
            ),
          'Explicit page break left landscape content on portrait page'
        )
      }
    )
  }
  inspect(
    'actual-font-line-box',
    {
      main: [
        {
          value: '\nLatin text',
          lineHeight: { rule: 'multiple', value: 1.5 }
        }
      ]
    },
    {},
    draw => {
      const row = draw.getRowList()[0]
      if (!row) throw new Error('Expected text row')
      const ascent = Math.max(
        ...row.elementList.map(el => el.metrics.boundingBoxAscent)
      )
      const descent = Math.max(
        ...row.elementList.map(el => el.metrics.boundingBoxDescent)
      )
      check(ascent + descent > 0, 'Font line box must be available')
      check(
        Math.abs(row.height - (ascent + descent) * 1.5) < 0.01,
        'Multiple did not use actual font line box'
      )
    }
  )
  inspect(
    'design-mode-hidden-text',
    {
      main: [
        {
          value: '\nVisible in design mode',
          hide: true,
          lineHeight: { rule: 'multiple', value: 1 }
        }
      ]
    },
    { mode: EditorMode.DESIGN },
    draw => {
      check(draw.getRowList()[0].height > 0, 'Design-mode text collapsed')
    }
  )
  inspect(
    'blank-paragraph-reopen',
    {
      main: [
        {
          value: '\n',
          lineHeight: { rule: 'exact', value: 2 },
          spacingBefore: 3,
          spacingAfter: 7
        }
      ]
    },
    {},
    draw => {
      const saved = draw.getValue()
      inspect('reopened-blank', saved.data, saved.options, reopened => {
        check(reopened.getRowList().length === 1, 'Extra blank paragraph added')
        check(reopened.getRowList()[0].height === 9, 'Blank spacing changed')
        check(reopened.getRowList()[0].offsetY === 3, 'Before spacing changed')
      })
    }
  )
  return results
}
