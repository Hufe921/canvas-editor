import { describe, it, expect, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { SelectControl } from '@/editor/core/draw/control/select/SelectControl'
import type { IElement } from '@/editor/interface/Element'

const options = mergeOption({ width: 794, height: 1123 })

function createDraw(main: IElement[]): {
  draw: Draw
  container: HTMLDivElement
} {
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  return { draw, container }
}

// 与 mock 一致：无初始值、带占位符
function buildData(): IElement[] {
  return [
    { value: '有无高血压：' },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c1',
      control: {
        conceptId: 'hypertension',
        type: ControlType.SELECT,
        value: null,
        code: null,
        placeholder: '有无',
        prefix: '{',
        postfix: '}',
        valueSets: [
          { value: '有', code: '1' },
          { value: '无', code: '0' }
        ]
      } as IElement['control']
    },
    { value: '\n' }
  ]
}

describe('select 弹窗高亮（真实点击路径）', () => {
  let draw: Draw
  let container: HTMLDivElement
  afterEach(() => {
    draw?.destroy()
    container?.remove()
  })

  it('选择后重开弹窗应高亮已选项', async () => {
    ;({ draw, container } = createDraw(buildData()))
    // 激活控件并唤起弹窗
    const elementList = draw.getOriginalMainElementList()
    const controlIndex = elementList.findIndex(el => el.controlId === 'c1')
    draw.getRange().setRange(controlIndex, controlIndex)
    draw.getControl().initControl()
    const activeControl = draw.getControl().getActiveControl() as SelectControl
    activeControl.awake()
    // 点击"有"
    const li = container.querySelector<HTMLLIElement>(
      '.ce-select-control-popup li'
    )!
    li.click()
    // 等待 render nextTick（reAwakeControl）
    await new Promise(r => setTimeout(r, 0))
    // 重新唤起弹窗
    activeControl.awake()
    const actives = container.querySelectorAll(
      '.ce-select-control-popup li.active'
    )
    expect(actives.length).toBe(1)
    expect(actives[0].textContent).toBe('有')
  })
})
