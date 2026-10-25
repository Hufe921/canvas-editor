import { afterEach, describe, expect, it } from 'vitest'
import { ElementType } from '@/editor/dataset/enum/Element'
import { createTestEditor } from '../../factories/editor'
import { setRange } from '../../helpers/range'

describe('页面鼠标指针', () => {
  let ctx: ReturnType<typeof createTestEditor>

  afterEach(() => ctx?.destroy())

  it('mousedown 可从 SVG 子元素命中第二页并设置页码', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          { value: '一' },
          { value: '\n' },
          { type: ElementType.PAGE_BREAK, value: '\n' },
          { value: '二' },
          { value: '\n' }
        ],
        footer: []
      }
    })
    setRange(ctx.editor, 4, 4)
    const secondPagePosition = ctx.editor.command.getCursorPosition()!
    expect(secondPagePosition.pageNo).toBe(1)
    setRange(ctx.editor, 0, 0)

    const page = ctx.container.querySelector<HTMLCanvasElement>(
      'canvas[data-index="1"]'
    )!
    Object.defineProperties(page, {
      clientWidth: { value: 794 },
      clientHeight: { value: 1123 }
    })
    page.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 794,
        height: 1123
      }) as DOMRect
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    svg.append(path)
    page.append(svg)

    const [x, y] = secondPagePosition.coordinate.leftTop
    path.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        clientX: x + 1,
        clientY: y + 1
      })
    )

    const cursorPosition = ctx.editor.command.getCursorPosition()
    expect(cursorPosition?.pageNo).toBe(1)
    expect(cursorPosition?.index).toBe(secondPagePosition.index)
  })
})
