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
