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

## 签名

```javascript
import Editor from '@hufe921/canvas-editor'
import signaturePlugin from '@hufe921/canvas-editor-plugin-signature'

const instance = new Editor()
instance.use(signaturePlugin)

instance.command.executeSignature({
  width?: number, // 画板宽度
  height?: number, // 画板高度
  exportType?: 'png' | 'svg', // 导出图片格式，默认 svg
  locale?: string, // 弹窗语言（内置 zhCN、en），默认取编辑器 locale 配置
  lang?: Partial<ISignatureLang>, // 覆盖对应语言的弹窗文案
  onClose?: () => void, // 关闭回调
  onCancel?: () => void, // 取消回调
  onConfirm?: (payload: ISignatureResult | null) => void // 确认回调，默认将签名图片插入编辑器
})
```

## 查找替换

```javascript
import Editor from '@hufe921/canvas-editor'
import findReplacePlugin from '@hufe921/canvas-editor-plugin-find-replace'

const instance = new Editor()
instance.use(findReplacePlugin, {
  locale?: string, // 面板语言（内置 zhCN、en），默认取编辑器 locale 配置
  lang?: Partial<IFindReplaceLang>, // 覆盖对应语言的面板文案
  shortcut?: boolean // 是否启用全局快捷键 Ctrl/Cmd + F 唤起面板，默认启用
})

instance.command.executeFindReplace({
  locale?: string, // 面板语言（内置 zhCN、en），默认取编辑器 locale 配置
  lang?: Partial<IFindReplaceLang>, // 覆盖对应语言的面板文案
  onClose?: () => void // 面板关闭回调
})
```

## @提及

```javascript
import Editor from '@hufe921/canvas-editor'
import mentionPlugin from '@hufe921/canvas-editor-plugin-mention'

const instance = new Editor()
instance.use(mentionPlugin, {
  trigger?: string, // 触发符，默认 @
  dataList: IMentionItem[] | (() => IMentionItem[]), // 候选数据
  max?: number, // 候选最多显示条数，默认 5
  label?: IMentionLabelStyle, // 提及标签样式覆盖
  locale?: string, // 面板语言（内置 zhCN、en），默认取编辑器 locale 配置
  lang?: Partial<IMentionLang>, // 覆盖对应语言的面板文案
  onSelect?: (item: IMentionItem) => void, // 选中候选项回调
  onClick?: (element: IElement) => void // 点击已插入提及标签回调
})

// 程序化在光标处唤起候选浮层
instance.command.executeMention()
```

## 批注

```javascript
import Editor from '@hufe921/canvas-editor'
import commentPlugin from '@hufe921/canvas-editor-plugin-comment'

const instance = new Editor()
instance.use(commentPlugin, {
  highlightColor?: string, // 批注高亮色，默认 #fde7e9
  railWidth?: number, // 右侧批注栏宽度（px），默认 220
  lineColor?: string, // 连接线颜色，默认 #f54a45
  userColor?: string, // 批注卡片作者名颜色，默认 #f54a45
  user?: string, // 当前用户名
  locale?: string, // 弹层语言（内置 zhCN、en），默认取编辑器 locale 配置
  lang?: Partial<ICommentLang>, // 覆盖对应语言的弹层文案
  onAdd?: (comment: IComment) => void, // 批注新增回调
  onRemove?: (id: string) => void // 批注删除回调
})

instance.command.executeAddComment() // 对当前选区添加批注
instance.command.executeRemoveComment(id?: string) // 删除批注
instance.command.executeGetCommentList() // 获取批注列表
instance.command.executeSetCommentList(list) // 恢复批注列表
```
