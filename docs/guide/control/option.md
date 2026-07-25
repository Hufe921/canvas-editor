# 控件配置

控件在文档数据（`IElement.control`）中的属性，按控件类型分述。

## 通用属性（所有类型）

| 属性            | 类型                                                                | 说明                                   |
| --------------- | ------------------------------------------------------------------- | -------------------------------------- |
| `type`          | `'text' \| 'select' \| 'checkbox' \| 'radio' \| 'date' \| 'number'` | 控件类型                               |
| `value`         | `IElement[] \| null`                                                | 控件值                                 |
| `placeholder`   | `string`                                                            | 占位符                                 |
| `conceptId`     | `string`                                                            | 概念 id（可多个控件共享，级联/取值用） |
| `groupId`       | `string`                                                            | 成组 id                                |
| `prefix`        | `string`                                                            | 前缀字符                               |
| `postfix`       | `string`                                                            | 后缀字符                               |
| `preText`       | `string`                                                            | 前文本                                 |
| `postText`      | `string`                                                            | 后文本                                 |
| `minWidth`      | `number`                                                            | 最小宽度                               |
| `underline`     | `boolean`                                                           | 下划线                                 |
| `border`        | `boolean`                                                           | 边框                                   |
| `extension`     | `unknown`                                                           | 扩展数据                               |
| `indentation`   | `ControlIndentation`                                                | 缩进                                   |
| `rowFlex`       | `RowFlex`                                                           | 行对齐                                 |
| `deletable`     | `boolean`                                                           | 可删除。默认：true                     |
| `disabled`      | `boolean`                                                           | 禁用（不可编辑）                       |
| `pasteDisabled` | `boolean`                                                           | 禁止粘贴                               |
| `hide`          | `boolean`                                                           | 隐藏                                   |
| `required`      | `boolean`                                                           | 必填（校验时使用，可被级联动态控制）   |
| `cascade`       | `IControlCascadeRule[]`                                             | 级联规则，详见：控件-级联表达式        |
| `validation`    | `IControlValidation`                                                | 校验规则，详见：控件-验证              |
| `compute`       | `string`                                                            | 计算表达式，详见：控件-级联表达式      |
| `font`          | `string`                                                            | 值字体                                 |
| `size`          | `number`                                                            | 值字号                                 |
| `bold`          | `boolean`                                                           | 值加粗                                 |
| `color`         | `string`                                                            | 值颜色                                 |
| `highlight`     | `string`                                                            | 值高亮                                 |
| `italic`        | `boolean`                                                           | 值斜体                                 |
| `strikeout`     | `boolean`                                                           | 值删除线                               |

## TEXT 文本控件

仅通用属性。

## SELECT 选择控件

通用属性，及以下专属属性：

| 属性                     | 类型                                | 说明        |
| ------------------------ | ----------------------------------- | ----------- |
| `code`                   | `string \| null`                    | 选中项 code |
| `valueSets`              | `{ value: string; code: string }[]` | 候选值列表  |
| `isMultiSelect`          | `boolean`                           | 多选        |
| `multiSelectDelimiter`   | `string`                            | 多选分隔符  |
| `selectExclusiveOptions` | `{ inputAble?: boolean }`           | 允许输入    |

## CHECKBOX 复选框控件

通用属性，及以下专属属性：

| 属性            | 类型                                | 说明                          |
| --------------- | ----------------------------------- | ----------------------------- |
| `code`          | `string \| null`                    | 选中项 code（多个以逗号分隔） |
| `valueSets`     | `{ value: string; code: string }[]` | 候选值列表                    |
| `min`           | `number`                            | 最少选择数                    |
| `max`           | `number`                            | 最多选择数                    |
| `flexDirection` | `FlexDirection`                     | 排列方向                      |

## RADIO 单选框控件

通用属性，及以下专属属性：

| 属性            | 类型                                | 说明        |
| --------------- | ----------------------------------- | ----------- |
| `code`          | `string \| null`                    | 选中项 code |
| `valueSets`     | `{ value: string; code: string }[]` | 候选值列表  |
| `flexDirection` | `FlexDirection`                     | 排列方向    |

## DATE 日期控件

通用属性，及以下专属属性：

| 属性         | 类型     | 说明                                |
| ------------ | -------- | ----------------------------------- |
| `dateFormat` | `string` | 日期格式。默认：yyyy-MM-dd hh:mm:ss |

## NUMBER 数值控件

通用属性，及以下专属属性：

| 属性                     | 类型                               | 说明       |
| ------------------------ | ---------------------------------- | ---------- |
| `numberExclusiveOptions` | `{ calculatorDisabled?: boolean }` | 禁用计算器 |
