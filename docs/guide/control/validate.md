# 控件验证

对控件内容做**必填、长度、数值、日期、多选数量**等规则校验。规则配置在控件的 `control.validation` 上，必填用 `control.required`。

## 数据结构

```ts
interface IControlValidation {
  minLength?: number // TEXT
  maxLength?: number
  pattern?: string // 正则
  min?: number // NUMBER
  max?: number
  integer?: boolean
  precision?: number // 小数位数
  minDate?: string // DATE：'YYYY-MM-DD' 或 'today'
  maxDate?: string
  minChecked?: number // CHECKBOX 多选
  maxChecked?: number
  message?: string // 自定义错误文案
}
```

`required` 判定：select/radio 需选中项、checkbox 至少一项、text/number/date 文本非空。

配置示例：

```json
{
  "conceptId": "name",
  "type": "text",
  "value": null,
  "required": true,
  "validation": { "minLength": 2, "maxLength": 20 },
  "preText": "姓名："
}
```

错误文案默认走国际化（语言包 `validate` 节点，支持 `{min}`、`{max}`、`{count}`、`{date}`、`{precision}` 参数插值），可通过 `register.langMap` 覆盖；`validation.message` 配置的自定义文案优先级最高。

::: tip 级联与校验联动
**隐藏控件不参与校验**——被级联隐藏的必填控件自动豁免。
:::

## executeValidate

功能：校验控件（必填及各类型校验规则）。校验前会同步冲刷级联，失败控件以 errorBackgroundColor 高亮

用法：

```javascript
instance.command.executeValidate(options?: IValidateOption)
```

IValidateOption：

```typescript
interface IValidateOption {
  zone?: EditorZone // 校验区域（页眉、正文、页脚），默认全文
  errorBackgroundColor?: string // 校验失败背景色，默认取控件配置 errorBackgroundColor（#FFECE8）
}
```

返回值：

```typescript
interface IControlValidateResult {
  controlId: string
  conceptId?: string
  control: IControl // 校验失败控件的完整配置（浅拷贝），可取 preText/placeholder 等
  errors: string[] // 如 ['该字段为必填项', '最大长度为 100']
}

const results: IControlValidateResult[] = instance.command.executeValidate()
```

## executeClearValidate

功能：清除校验错误高亮

用法：

```javascript
instance.command.executeClearValidate()
```
