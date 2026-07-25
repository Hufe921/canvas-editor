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

const selectControl = (
  controlId: string,
  conceptId: string,
  valueSets: { value: string; code: string }[],
  extra: Record<string, unknown> = {}
): IElement => ({
  type: ElementType.CONTROL,
  value: '',
  controlId,
  control: {
    conceptId,
    type: ControlType.SELECT,
    value: null,
    code: null,
    placeholder: '选择',
    prefix: '{',
    postfix: '}',
    valueSets,
    ...extra
  } as IElement['control']
})

function buildData(): IElement[] {
  // 与 mock 一致：表格单元格内放触发控件和目标控件
  return [
    {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 680 }],
      trList: [
        {
          height: 42,
          tdList: [
            {
              colspan: 1,
              rowspan: 1,
              value: [
                { value: '有无高血压：' },
                selectControl(
                  'c1',
                  'hypertension',
                  [
                    { value: '有', code: '1' },
                    { value: '无', code: '0' }
                  ],
                  {
                    cascade: [
                      {
                        expression: "getValue(@self) == '1'",
                        actions: [
                          {
                            conceptId: 'detail',
                            effects: { hide: false, required: true }
                          }
                        ]
                      }
                    ]
                  }
                ),
                {
                  type: ElementType.CONTROL,
                  value: '',
                  controlId: 'c2',
                  control: {
                    preText: '，高血压分级：',
                    conceptId: 'detail',
                    type: ControlType.SELECT,
                    value: null,
                    code: null,
                    placeholder: '分级',
                    prefix: '{',
                    postfix: '}',
                    hide: true,
                    valueSets: [
                      { value: 'Ⅰ级', code: '1' },
                      { value: 'Ⅱ级', code: '2' }
                    ]
                  } as IElement['control']
                }
              ]
            }
          ]
        }
      ]
    } as IElement,
    { value: '\n' }
  ]
}

const tick = () => new Promise(r => setTimeout(r, 0))

describe('UI 路径二次联动', () => {
  let draw: Draw
  let container: HTMLDivElement
  afterEach(() => {
    draw?.destroy()
    container?.remove()
  })

  function activateAndPick(controlId: string, liText: string) {
    const elementList = draw.getOriginalMainElementList()
    const tableIndex = elementList.findIndex(el => el.type === 'table')
    const tableElement = elementList[tableIndex]
    const td = tableElement.trList![0].tdList[0]
    draw.getPosition().setPositionContext({
      isTable: true,
      isControl: false,
      index: tableIndex,
      trIndex: 0,
      tdIndex: 0
    })
    const index = td.value.findIndex(el => el.controlId === controlId)
    draw.getRange().setRange(index, index)
    draw.getControl().initControl()
    const active = draw.getControl().getActiveControl() as SelectControl
    active.awake()
    const li = [
      ...container.querySelectorAll<HTMLLIElement>(
        '.ce-select-control-popup li'
      )
    ].find(li => li.textContent === liText)!
    li.click()
  }

  // 从活列表的表格单元格中读取目标控件
  function c2() {
    const elementList = draw.getOriginalMainElementList()
    const table = elementList.find(el => el.type === 'table')
    return table?.trList?.[0].tdList[0].value.find(
      el => el.control?.conceptId === 'detail'
    )
  }

  it('有→Ⅰ级→无：分级应隐藏', async () => {
    ;({ draw, container } = createDraw(buildData()))
    // 1. 选"有" → 分级显示
    activateAndPick('c1', '有')
    await tick()
    expect(c2()?.control?.hide).toBe(false)
    // 2. 分级选"Ⅰ级"
    activateAndPick('c2', 'Ⅰ级')
    await tick()
    expect(c2()?.control?.code).toBe('1')
    expect(c2()?.control?.hide).toBe(false)
    // 3. 再选"无" → 分级应隐藏
    activateAndPick('c1', '无')
    await tick()
    console.log(
      'c1Code:',
      draw
        .getOriginalMainElementList()
        .find(el => el.type === 'table')
        ?.trList?.[0].tdList[0].value.find(
          el => el.control?.conceptId === 'hypertension'
        )?.control?.code,
      'c2Hide:',
      c2()?.control?.hide,
      'c2Required:',
      c2()?.control?.required
    )
    expect(c2()?.control?.hide).toBe(true)
    // 全成员隐藏（基线逐元素记录：共享对象去重写入、发散后逐元素还原）
    const td = draw.getOriginalMainElementList().find(el => el.type === 'table')
      ?.trList?.[0].tdList[0]
    const members = td!.value.filter(el => el.control?.conceptId === 'detail')
    expect(members.length).toBeGreaterThan(0)
    for (const m of members) {
      expect(m.control?.hide).toBe(true)
    }
  })
})
