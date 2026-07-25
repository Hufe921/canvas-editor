import { describe, it, expect } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IElement } from '@/editor/interface/Element'

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

function renderMain(
  main: IElement[],
  optionOverrides: Record<string, unknown> = {}
): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ ...PAGE_OPTION, ...optionOverrides })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}

describe('表格单元格高度自适应', () => {
  it('跨行合并单元格内容过多时跨及行随内容撑高', () => {
    // 第 1 行第 2 列向下合并 2 行且内容超高：增长量加在合并范围最后一行，
    // 缩减时不应因合并单元格不在该行分组内而把高度再缩回去
    const longText = Array.from({ length: 6 }, (_, i) => `内容${i + 1}`).join(
      '\n'
    )
    const table = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 277 }, { width: 277 }],
      trList: [
        {
          height: 42,
          minHeight: 42,
          tdList: [
            { colspan: 1, rowspan: 1, value: [] },
            { colspan: 1, rowspan: 2, value: [{ value: longText, size: 16 }] }
          ]
        },
        {
          height: 42,
          minHeight: 42,
          tdList: [{ colspan: 1, rowspan: 1, value: [] }]
        },
        {
          height: 42,
          minHeight: 42,
          tdList: [
            { colspan: 1, rowspan: 1, value: [] },
            { colspan: 1, rowspan: 1, value: [] }
          ]
        }
      ]
    } as unknown as IElement
    const draw = renderMain([table])
    const tableElement = draw
      .getOriginalElementList()
      .find(element => element.type === ElementType.TABLE)!
    const spanTd = tableElement.trList![0].tdList[1]
    const contentHeight = spanTd.mainHeight!
    // 内容高度超过合并范围初始行高（2*42）
    expect(contentHeight).toBeGreaterThan(84)
    // 合并范围最后一行被撑高（增长量加在该行且不被缩减）
    expect(tableElement.trList![1].height!).toBeGreaterThan(42)
    // 合并单元格高度覆盖内容高度
    expect(spanTd.height!).toBeGreaterThanOrEqual(contentHeight)
  })
})
