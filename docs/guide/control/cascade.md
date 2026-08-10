# 级联表达式

级联表达式：控件值变化时自动控制其他控件或标题的**显隐、必填、可编辑、可删除**。规则配置在触发控件的 `control.cascade` 上，随 `getValue` 持久化，编辑器内置引擎自动执行。控件验证见[控件-验证](./validate.md)。

## 数据结构

```ts
interface IControlCascadeRule {
  expression: string // DSL 表达式，如 "getValue(@self) == '1'"
  actions: ICascadeAction[] // 表达式为 true 时应用
  elseActions?: ICascadeAction[] // 可选；缺省时还原目标基线值
}

interface ICascadeAction {
  controlId?: string // 目标控件 id（唯一，精确控制）
  conceptId?: string // 目标控件/标题 conceptId（可多个，批量控制）
  // 两个字段可同时配置，合并命中全部应用
  targetType?: 'control' | 'title' // conceptId 消歧用，缺省自动探测：先控件后标题
  effects: {
    hide?: boolean // 显隐（控件/标题通用）
    required?: boolean // 必填（仅控件）
    disabled?: boolean // 可编辑（仅控件）
    deletable?: boolean // 可删除（仅控件）
  }
}
```

级联效果中的 `required` 对应控件的必填状态（校验语义见[控件-验证](./validate.md)）；`compute?: string` 为计算表达式字段（见下文）。

## DSL 语法

```
getValue(@self) == '1'
getValue('gender') == '2' && getValue('age') >= 15 && getValue('age') <= 49
contains(getValue('allergy'), '1') && count(getValue('allergy')) >= 2
getValue('operationDate') > 'today'
getValue('dischargeDate') < getValue('admissionDate')
round(getValue('weight') / (getValue('height') * getValue('height')), 1)
getValue('endTime') < now()
datediff(getValue('end'), getValue('start')) > 7
round(datediff('today', getValue('birthdate')) / 365)
if(getValue('bmi') < 18.5, '偏瘦', if(getValue('bmi') < 28, '正常', '肥胖'))
```

### 取值函数 getValue

控件值一律通过 `getValue()` 获取（不能直接书写标识符）：

- `getValue('conceptId或controlId')`：按 id 取实时值，controlId 精确优先，conceptId 批量命中时取第一个有值的
- `getValue(@self)`：取规则所在控件自身的值（`@self` 仅允许作为 `getValue` 参数）

归一化规则：SELECT/RADIO 取选中项 `code`；CHECKBOX 取 `code` 数组；TEXT/NUMBER/DATE 取实时纯文本（NUMBER 自动转数值，DATE 支持 `'YYYY-MM-DD'` 与 `'today'` / `now()` 比较）。算日期差用 `datediff`，不要直接对日期值做算术（`now() - getValue('birthdate')` 会因日期字符串无法转数值而失败）。

### 运算符与字面量

| 类别 | 运算符                                          |
| ---- | ----------------------------------------------- |
| 比较 | `==` `!=` `>` `>=` `<` `<=`                     |
| 逻辑 | `&&` `\|\|` `!`                                 |
| 算术 | `+` `-` `*` `/` `%`（`+` 任一侧为文本时做拼接） |
| 包含 | `in`（左值包含于右侧数组）                      |

优先级：`!` > `* / %` > `+ -` > 比较 > `&&` > `||`，可用 `()` 改变。字面量：字符串（单/双引号）、数字、布尔、`null`、数组。

### 内置函数

| 函数                                | 说明                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `empty(x)` / `notEmpty(x)`          | 判空                                                                       |
| `len(x)`                            | 文本字符长度                                                               |
| `count(x)`                          | checkbox 选中项数量                                                        |
| `contains(x, v)`                    | checkbox 包含某 code；或文本包含子串                                       |
| `round(x, digits?)`                 | 四舍五入，`digits` 缺省为 0                                                |
| `floor(x)` / `ceil(x)`              | 向下 / 向上取整                                                            |
| `abs(x)`                            | 绝对值                                                                     |
| `min(a, b, ...)` / `max(a, b, ...)` | 最小 / 最大值，参数为空或非数值返回 `null`                                 |
| `power(x, n)`                       | 幂运算 `xⁿ`                                                                |
| `sqrt(x)`                           | 开方，负数返回 `null`                                                      |
| `if(cond, a, b)`                    | 条件：`cond` 真→`a`，否则 `b`，仅求值命中分支（短路）                      |
| `now()`                             | 当前时间的毫秒时间戳（含时分秒），可与日期控件比较                         |
| `datediff(end, start, unit?)`       | 日期差（`end - start`），`unit`：`d`(天,默认)/`h`/`m`/`s`，非法返回 `null` |

表达式解析或求值失败时按 `false` 处理并 `console.warn`，不打断编辑。

## 计算字段（compute）

`control.compute` 配置计算表达式后，控件值变化时自动重算并回写本控件（Excel 公式模式）：

```json
{
  "conceptId": "bmi",
  "type": "number",
  "value": null,
  "disabled": true,
  "compute": "round(getValue('weight') / (getValue('height') * getValue('height')), 1)"
}
```

- 结果不同才回写；操作数为空或除零等非法运算 → 清空本控件值
- 建议搭配 `disabled: true` 只读；计算先于级联条件执行（如 `getValue(@self) > 28` 取到最新 BMI）
- 支持链式计算，内置迭代上限防循环；回写不产生 undo 记录

## 目标解析与标题控制

- `controlId` 精确命中唯一控件；`conceptId` 批量命中同概念控件或标题；两者可同时配置，合并命中全部应用
- 标题目标（按标题 `conceptId` 匹配）的 `hide: true` 会隐藏标题本身及其后直到下一个同级或更高级标题之间的所有内容

## 基线与 elseActions

- 首次对目标应用效果前，快照其属性原值（如目标本来就 `required: true`）
- 表达式变 false 且未配置 `elseActions` 时还原快照，不丢文档原始配置；配置了 `elseActions` 则按其声明固定写入

## 执行时机

- 初始化与 `executeSetValue` 后全量执行
- 内容变化（输入、粘贴、撤销/重做）后在下一宏任务重算；中文输入组合（IME）期间不触发，组合结束后生效
- `executeValidate` 校验前会同步冲刷一次，保证读到最新的显隐/必填状态
- 级联效果只写属性不改值：不递归触发新级联，也不污染撤销历史

## 完整示例

选"有高血压"才显示并必填"高血压分级"：

```json
[
  { "value": "有无高血压" },
  {
    "type": "control",
    "controlId": "1",
    "value": null,
    "control": {
      "conceptId": "hypertension",
      "type": "select",
      "value": null,
      "valueSets": [
        { "value": "有", "code": "1" },
        { "value": "无", "code": "0" }
      ],
      "cascade": [
        {
          "expression": "getValue(@self) == '1'",
          "actions": [
            {
              "conceptId": "hypertensionLevel",
              "effects": { "hide": false, "required": true }
            }
          ]
        }
      ]
    }
  },
  { "value": "高血压分级" },
  {
    "type": "control",
    "controlId": "2",
    "value": null,
    "control": {
      "conceptId": "hypertensionLevel",
      "type": "select",
      "value": null,
      "hide": true,
      "valueSets": [
        { "value": "Ⅰ级", "code": "1" },
        { "value": "Ⅱ级", "code": "2" },
        { "value": "Ⅲ级", "code": "3" }
      ]
    }
  }
]
```

初始控件 2 隐藏（基线 `hide: true`）；选"有"→ 显示且必填；改选"无"→ 还原基线重新隐藏；`executeValidate()` 时隐藏的控件 2 自动豁免。
