import { IElement } from '../../interface/Element'
import { ElementType } from '../../dataset/enum/Element'
import { ControlType } from '../../dataset/enum/Control'
import { titleOrderNumberMapping } from '../../dataset/constant/Title'
import { ICascadeAction, IControlCascadeRule } from '../../interface/Control'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { Draw } from '../draw/Draw'
import { Control } from '../draw/control/Control'
import { tokenize } from './expression/tokenizer'
import { parse, IAstNode } from './expression/parser'
import { evaluate, evaluateValue, IResolvedValue } from './expression/evaluator'

interface ICompiledRule {
  rule: IControlCascadeRule
  ast: IAstNode | null
  hostControlId?: string // 规则所在控件（getValue(@self) 解析用）
}

// 计算字段：control.compute 表达式，结果回写该控件值
interface ICompiledCompute {
  controlId: string
  expression: string
  ast: IAstNode | null
}

// 控件索引：一次全文扫描建立，pass 内所有目标查找均为 O(1)
// 控件成员元素在 elementList 中连续且 controlId 唯一，
// conceptId 可命中多个，两者一次扫描同时收集
interface IControlIndex {
  byControlId: Map<string, IElement[]>
  byConceptId: Map<string, IElement[]>
}

// 计算结果格式化：整数原样；小数消除浮点噪声
function formatComputeText(result: string | number): string {
  if (typeof result === 'string') return result
  if (Number.isInteger(result)) return String(result)
  return String(parseFloat(result.toPrecision(12)))
}

// 链式计算迭代上限（防 a=b+1;b=a+1 震荡）
const MAX_COMPUTE_ITERATIONS = 10

const EFFECT_PROPS = ['hide', 'required', 'disabled', 'deletable'] as const
type EffectProp = (typeof EFFECT_PROPS)[number]

// 级联引擎：控件值变化时按 control.cascade 规则自动控制其他控件/标题的
// 显隐、必填、可编辑、可删除，并按 control.compute 表达式回写计算字段
//
// 触发模型：
// - contentChange（输入/粘贴/undo/redo 后的渲染批次）→ 下一宏任务执行一次
// - 初始化 / setValue / executeValidate 前 → 显式同步执行
// - 规则与计算结果持久化在控件对象上，随 getValue 序列化
export class CascadeManager {
  private draw: Draw
  private control: Control
  private eventBus: EventBus<EventBusMap>
  // 标题 hide 基线（元素级）
  private baselines: WeakMap<
    IElement,
    Partial<Record<EffectProp | 'elementHide', unknown>>
  >
  // 控件属性基线（controlId 级）：成员元素会随编辑增删、
  // control 对象会被逐元素替换（发散），按元素/对象记录都会丢失
  private controlBaselines: Map<string, Partial<Record<EffectProp, unknown>>>
  // 单次 executeAll 内的标识符取值缓存（效果不改值，pass 内值不变）
  private valueCache: Map<string, IResolvedValue | undefined>
  // 重入守卫：compute 回写值会再次触发 contentChange / 显式调用，
  // 执行中仅置 dirty 标记，结束后补跑，避免递归
  private isExecuting: boolean
  private needsRerun: boolean

  constructor(draw: Draw) {
    this.draw = draw
    this.control = draw.getControl()
    this.eventBus = draw.getEventBus()
    this.baselines = new WeakMap()
    this.controlBaselines = new Map()
    this.valueCache = new Map()
    this.isExecuting = false
    this.needsRerun = false
    // 唯一触发源：真实内容变更（输入/粘贴/undo/redo）后的 render 批次
    // composition（IME 组合）期间不发射，组合结束后随提交渲染触发，
    // 正好避免对拼音中间态求值；级联自身的效果渲染不触发此事件
    this.eventBus.on('contentChange', () => {
      this.executeAll()
    })
  }

  private getZoneElementLists(): IElement[][] {
    return [
      this.draw.getHeaderElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooterElementList()
    ]
  }

  // 一次全文扫描同时完成三件事：收集 cascade 规则、收集 compute 表达式、
  // 建立控件索引（pass 内目标查找均为 O(1)）
  // 同一控件的各组成元素共享 control 对象，规则需按对象去重避免重复收集
  private collectAll(): {
    rules: ICompiledRule[]
    computes: ICompiledCompute[]
    index: IControlIndex
  } {
    const rules: ICompiledRule[] = []
    const computes: ICompiledCompute[] = []
    const index: IControlIndex = {
      byControlId: new Map(),
      byConceptId: new Map()
    }
    const seen = new Set<object>()
    const walk = (elementList: IElement[]) => {
      for (const element of elementList) {
        if (element.type === ElementType.TABLE) {
          for (const tr of element.trList || []) {
            for (const td of tr.tdList) walk(td.value)
          }
          continue
        }
        const control = element.control
        if (!control) continue
        if (element.controlId) {
          const byId = index.byControlId.get(element.controlId)
          if (byId) {
            byId.push(element)
          } else {
            index.byControlId.set(element.controlId, [element])
          }
        }
        if (control.conceptId) {
          const byConcept = index.byConceptId.get(control.conceptId)
          if (byConcept) {
            byConcept.push(element)
          } else {
            index.byConceptId.set(control.conceptId, [element])
          }
        }
        // 规则与计算表达式（每个逻辑控件只收集一次）
        if (seen.has(control)) continue
        seen.add(control)
        if (control.cascade?.length) {
          for (const rule of control.cascade) {
            let ast: IAstNode | null = null
            try {
              ast = parse(tokenize(rule.expression))
            } catch (e) {
              console.warn(`[cascade] 表达式解析失败: ${rule.expression}`, e)
            }
            rules.push({ rule, ast, hostControlId: element.controlId })
          }
        }
        if (control.compute && element.controlId) {
          let ast: IAstNode | null = null
          try {
            ast = parse(tokenize(control.compute))
          } catch (e) {
            console.warn(`[cascade] 计算表达式解析失败: ${control.compute}`, e)
          }
          computes.push({
            controlId: element.controlId,
            expression: control.compute,
            ast
          })
        }
      }
    }
    this.getZoneElementLists().forEach(walk)
    return { rules, computes, index }
  }

  // getValue('id') 的取值入口：controlId 精确优先，conceptId 次之
  // （多个同概念控件取第一个有值的）；pass 内缓存（效果不改值，pass 内值不变）
  private resolveIdentifier = (name: string): IResolvedValue | undefined => {
    if (this.valueCache.has(name)) return this.valueCache.get(name)
    const value = this.resolveIdentifierUncached(name)
    this.valueCache.set(name, value)
    return value
  }

  private resolveIdentifierUncached(name: string): IResolvedValue | undefined {
    let result = this.control.getValueById({ id: name })
    if (!result.length) {
      result = this.control.getValueById({ conceptId: name })
    }
    return this.normalizeGetValueResult(result)
  }

  // @self：按规则/计算所在控件的 controlId 精确取值
  private resolveByControlId(
    controlId: string | undefined
  ): IResolvedValue | undefined {
    if (!controlId) return undefined
    return this.normalizeGetValueResult(
      this.control.getValueById({ id: controlId })
    )
  }

  // getValueById 结果 → 归一化值（复用编辑器的实时取值逻辑，
  // 文本控件不读失焦才同步的 control.value）
  private normalizeGetValueResult(
    result: ReturnType<Control['getValueById']>
  ): IResolvedValue | undefined {
    if (!result.length) return
    const hit = result.find(item => item.value != null) || result[0]
    const type = hit.type
    if (type === ControlType.SELECT || type === ControlType.RADIO) {
      return { code: hit.value }
    }
    if (type === ControlType.CHECKBOX) {
      return { codes: hit.value ? hit.value.split(',') : [] }
    }
    return { text: hit.value, isDate: type === ControlType.DATE }
  }

  // 标题 + 其下区间（到下一个同级/上级标题），算法参考 CommandAdapt.getTitleValue
  private findTitleRangeElements(target: string): IElement[] {
    const matched: IElement[] = []
    const walk = (elementList: IElement[]) => {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        if (element.type === ElementType.TABLE) {
          for (const tr of element.trList || []) {
            for (const td of tr.tdList) walk(td.value)
          }
          continue
        }
        if (element.title?.conceptId !== target) continue
        matched.push(element)
        let j = i
        while (j < elementList.length) {
          const next = elementList[j]
          // 同一标题行的其余字符元素也属于隐藏范围
          if (element.titleId === next.titleId) {
            matched.push(next)
            j++
            continue
          }
          if (
            next.level &&
            titleOrderNumberMapping[next.level] <=
              titleOrderNumberMapping[element.level!]
          ) {
            break
          }
          matched.push(next)
          j++
        }
        i = j
      }
    }
    this.getZoneElementLists().forEach(walk)
    return matched
  }

  // 把元素某属性的原值记入基线快照（已记录过则不覆盖）
  private recordBaseline(
    element: IElement,
    key: EffectProp | 'elementHide',
    get: () => unknown
  ): void {
    let baseline = this.baselines.get(element)
    if (!baseline) {
      baseline = {}
      this.baselines.set(element, baseline)
    }
    if (!(key in baseline)) {
      baseline[key] = get()
    }
  }

  // 写入效果属性，首次写入前把原值记入基线快照；
  // 返回是否有实际变更（值相同不重复写）
  private writeWithBaseline(
    element: IElement,
    key: EffectProp | 'elementHide',
    get: () => unknown,
    set: (value: unknown) => void,
    value: unknown
  ): boolean {
    this.recordBaseline(element, key, get)
    if (get() === value) return false
    set(value)
    return true
  }

  // 表达式为 false 且无 elseActions 时调用：把属性还原为基线快照值，
  // 不会丢文档原始配置（如目标本来就 required: true）
  private restoreBaseline(
    element: IElement,
    key: EffectProp | 'elementHide'
  ): boolean {
    const baseline = this.baselines.get(element)
    if (!baseline || !(key in baseline)) return false
    const oldValue = baseline[key]
    if (key === 'elementHide') {
      if (element.hide === oldValue) return false
      element.hide = oldValue as boolean
    } else {
      if (element.control?.[key] === oldValue) return false
      const control = element.control as Record<string, unknown> | undefined
      if (control) {
        control[key] = oldValue
      }
    }
    return true
  }

  // 控件属性基线记录（controlId 级，首次记录后不覆盖）
  private recordControlBaseline(element: IElement, prop: EffectProp): void {
    const controlId = element.controlId
    if (!controlId) return
    let baseline = this.controlBaselines.get(controlId)
    if (!baseline) {
      baseline = {}
      this.controlBaselines.set(controlId, baseline)
    }
    if (!(prop in baseline)) {
      baseline[prop] = element.control?.[prop]
    }
  }

  // 控件属性基线还原：新增成员（级联生效期间插入的值元素）
  // 也能按 controlId 拿到控件级基线
  private restoreControlBaseline(element: IElement, prop: EffectProp): boolean {
    const baseline = this.controlBaselines.get(element.controlId!)
    if (!baseline || !(prop in baseline)) return false
    const oldValue = baseline[prop]
    if (element.control?.[prop] === oldValue) return false
    const control = element.control as Record<string, unknown> | undefined
    if (control) {
      control[prop] = oldValue
    }
    return true
  }

  // 应用一条 action：matched 时写 effects，否则还原基线
  // 目标按 action.controlId（唯一）+ action.conceptId（批量）合并命中；
  // 标题目标（conceptId 未命中控件时）隐藏标题及其下整段区间
  private applyAction(
    action: ICascadeAction,
    matched: boolean,
    index: IControlIndex
  ): boolean {
    const effects = matched ? action.effects : null
    // 目标：controlId（唯一）与 conceptId（批量）可同时配置，合并生效
    // 同一目标被重复命中时由下方 seen 按 control 对象去重
    const controlElements: IElement[] = []
    if (action.controlId) {
      const byId = index.byControlId.get(action.controlId)
      if (byId?.length) controlElements.push(...byId)
    }
    if (action.conceptId) {
      const byConcept = index.byConceptId.get(action.conceptId)
      if (byConcept?.length) controlElements.push(...byConcept)
    }
    const targetType =
      action.targetType || (controlElements.length ? 'control' : 'title')
    let changed = false
    if (targetType === 'control') {
      const elements = controlElements
      if (matched && effects) {
        // 写入：同一控件的成员共享 control 对象时按对象去重；
        // 基线按 controlId 记录（成员后续增删/对象发散都不受影响）
        const seen = new Set<object>()
        for (const element of elements) {
          const control = element.control as Record<string, unknown> | undefined
          if (!control) continue
          const isFirstForObject = !seen.has(control)
          for (const prop of EFFECT_PROPS) {
            if (!(prop in effects)) continue
            this.recordControlBaseline(element, prop)
            if (isFirstForObject && control[prop] !== effects[prop]) {
              control[prop] = effects[prop]
              changed = true
            }
          }
          seen.add(control)
        }
      } else {
        // 还原：逐元素按 controlId 基线恢复
        for (const element of elements) {
          for (const prop of EFFECT_PROPS) {
            changed = this.restoreControlBaseline(element, prop) || changed
          }
        }
      }
    } else {
      const elements = this.findTitleRangeElements(action.conceptId || '')
      for (const element of elements) {
        if (matched && effects && 'hide' in effects) {
          changed =
            this.writeWithBaseline(
              element,
              'elementHide',
              () => element.hide,
              v => {
                element.hide = v as boolean
              },
              effects.hide
            ) || changed
        } else {
          changed = this.restoreBaseline(element, 'elementHide') || changed
        }
      }
    }
    return changed
  }

  // compute 表达式求值并批量回写控件值（结果与当前值不同才写）
  // 历史处理：setValueListById 的 isSubmitHistory:false 路径会 recovery()
  // 清空全部 undo 栈（HistoryManager.recovery），故按默认提交历史写入后
  // popUndo 弹出——净效果：值写入但不产生用户可撤销的记录
  private applyComputes(computes: ICompiledCompute[]): boolean {
    const payload: { id: string; value: string | null }[] = []
    for (const compute of computes) {
      if (!compute.ast) continue
      let result: string | number | null = null
      try {
        result = evaluateValue(compute.ast, {
          resolve: this.resolveIdentifier,
          resolveSelf: () => this.resolveByControlId(compute.controlId)
        })
      } catch (e) {
        console.warn(`[cascade] 计算表达式求值失败: ${compute.expression}`, e)
        continue
      }
      const text = result === null ? null : formatComputeText(result)
      const current =
        this.control.getValueById({ id: compute.controlId })[0]?.value ?? null
      if (current === text) continue
      payload.push({ id: compute.controlId, value: text })
    }
    if (!payload.length) return false
    this.control.setValueListById(payload)
    this.draw.getHistoryManager().popUndo()
    return true
  }

  // 级联主入口（可重入安全）：事件触发与显式调用都走这里
  public executeAll() {
    // 重入：compute 回写值引发的再次触发仅置标记，由下方循环补跑
    if (this.isExecuting) {
      this.needsRerun = true
      return
    }
    this.isExecuting = true
    try {
      let iterations = 0
      do {
        this.needsRerun = false
        this.executePass()
        iterations++
      } while (this.needsRerun && iterations < MAX_COMPUTE_ITERATIONS)
      if (this.needsRerun) {
        console.warn('[cascade] 级联执行超过最大迭代次数，可能存在循环计算')
      }
    } finally {
      this.isExecuting = false
      this.needsRerun = false
    }
  }

  // 单轮执行：先算 compute（保证级联条件取到最新计算结果），再算 cascade
  private executePass() {
    const { rules, computes, index } = this.collectAll()
    if (!rules.length && !computes.length) return
    this.valueCache.clear()
    // 1. compute 先算：保证 cascade 条件取到最新计算结果
    // 有值回写时直接补跑一轮（链式计算收敛，不依赖事件重入）
    let changed = this.applyComputes(computes)
    if (changed) this.needsRerun = true
    // 2. cascade 条件规则
    for (const { rule, ast, hostControlId } of rules) {
      let matched = false
      if (ast) {
        try {
          matched = evaluate(ast, {
            resolve: this.resolveIdentifier,
            resolveSelf: () => this.resolveByControlId(hostControlId)
          })
        } catch (e) {
          console.warn(`[cascade] 表达式求值失败: ${rule.expression}`, e)
        }
      }
      const actions = matched ? rule.actions : rule.elseActions || null
      if (actions) {
        for (const action of actions) {
          changed = this.applyAction(action, true, index) || changed
        }
      } else {
        // 无 elseActions：还原 actions 涉及目标的基线
        for (const action of rule.actions) {
          changed = this.applyAction(action, false, index) || changed
        }
      }
    }
    if (changed) {
      // 保持光标：render 的 recoveryCursor 会隐藏光标，
      // 用户已有光标时按当前 range 重新锚定，避免级联触发后光标消失
      const hasCursor = Boolean(this.draw.getPosition().getCursorPosition())
      this.draw.render({
        isSubmitHistory: false,
        isSetCursor: hasCursor,
        curIndex: hasCursor
          ? this.draw.getRange().getRange().startIndex
          : undefined
      })
    }
  }
}
