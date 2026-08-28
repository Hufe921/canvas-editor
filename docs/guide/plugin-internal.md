# 官方插件

::: tip
官方维护插件仓库：https://github.com/Hufe921/canvas-editor-plugin

官方维护插件演示地址：https://hufe.club/canvas-editor-plugin
:::

## 条形码

```javascript
import Editor from "@hufe921/canvas-editor"
import barcode1DPlugin from "@hufe921/canvas-editor-plugin-barcode1d"

const instance = new Editor()
instance.use(barcode1DPlugin)

instance.executeInsertBarcode1D(
  content: string,
  width: number,
  height: number,
  options?: JsBarcode.Options
)
```

## 二维码

```javascript
import Editor from "@hufe921/canvas-editor"
import barcode2DPlugin from "@hufe921/canvas-editor-plugin-barcode2d"

const instance = new Editor()
instance.use(barcode2DPlugin, options?: IBarcode2DOption)

instance.executeInsertBarcode2D(
  content: string,
  width: number,
  height: number,
  hints?: Map<EncodeHintType, any>
)
```

## 代码块

```javascript
import Editor from "@hufe921/canvas-editor"
import codeblockPlugin from "@hufe921/canvas-editor-plugin-codeblock"

const instance = new Editor()
instance.use(codeblockPlugin)

instance.executeInsertCodeblock(content: string)
```

## Word

```javascript
import Editor from '@hufe921/canvas-editor'
import docxPlugin from '@hufe921/canvas-editor-plugin-docx'

const instance = new Editor()
instance.use(docxPlugin)

command.executeImportDocx({
  arrayBuffer: buffer
})

instance.executeExportDocx({
  fileName: string
})
```

## Excel

```javascript
import Editor from '@hufe921/canvas-editor'
import excelPlugin from '@hufe921/canvas-editor-plugin-excel'

const instance = new Editor()
instance.use(excelPlugin)

command.executeImportExcel({
  arrayBuffer: buffer
})
```

## 悬浮工具

```javascript
import Editor from '@hufe921/canvas-editor'
import floatingToolbarPlugin from '@hufe921/canvas-editor-plugin-floating-toolbar'

const instance = new Editor()
instance.use(floatingToolbarPlugin)
```

## 流程图

```javascript
import Editor from '@hufe921/canvas-editor'
import diagramPlugin from '@hufe921/canvas-editor-plugin-diagram'

const instance = new Editor()
instance.use(diagramPlugin)

command.executeLoadDiagram({
  lang?: Lang
  data?: string
  onDestroy?: (message?: any) => void
})
```

## 大小写转换

```javascript
import Editor from '@hufe921/canvas-editor'
import casePlugin from '@hufe921/canvas-editor-plugin-case'

const instance = new Editor()
instance.use(casePlugin)

command.executeUpperCase()

command.executeLowerCase()
```

## Markdown

```javascript
import Editor from '@hufe921/canvas-editor'
import markdownPlugin from '@hufe921/canvas-editor-plugin-markdown'

const instance = new Editor()
instance.use(markdownPlugin)

instance.command.executeImportMarkdown({
  value: string
})

instance.command.executeExportMarkdown() // => string
```

## 特殊字符

```javascript
import Editor from '@hufe921/canvas-editor'
import specialCharactersPlugin from '@hufe921/canvas-editor-plugin-special-characters'

const instance = new Editor()
instance.use(specialCharactersPlugin)

instance.command.executeOpenSpecialCharactersDialog({
  characters?: ISpecialCharacterGroup[], // 自定义特殊字符分组
  onSelect?: (char: string) => void // 选中字符回调
})
```

## 月经史

```javascript
import Editor from '@hufe921/canvas-editor'
import menstrualHistoryPlugin from '@hufe921/canvas-editor-plugin-menstrual-history'

const instance = new Editor()
instance.use(menstrualHistoryPlugin)

instance.command.executeLoadMenstrualHistory({
  data?: IMenstrualHistoryData, // 初始数据（用于二次编辑）
  onConfirm?: (
    data: IMenstrualHistoryData & { svg: string; width: number; height: number }
  ) => void, // 确认回调，返回月经史 SVG 图
  onCancel?: () => void // 取消回调
})
```

## 拼写检查

```javascript
import Editor from '@hufe921/canvas-editor'
import spellcheckPlugin from '@hufe921/canvas-editor-plugin-spellcheck'

const instance = new Editor()
instance.use(spellcheckPlugin, {
  disabled?: boolean, // 是否禁用拼写检查
  suggestionCount?: number, // 建议词候选个数
  suggestionTimeout?: number, // 建议词生成超时时间（毫秒）
  ignoreWords?: string[], // 忽略词列表（不区分大小写）
  minWordLength?: number, // 参与检查的最小单词长度
  locale?: string, // 弹窗语言（内置 zhCN、en）
  lang?: Partial<ISpellcheckLang> // 覆盖对应语言的弹窗文案
})

instance.command.executeSpellcheckIgnoreWord(word: string)
```
