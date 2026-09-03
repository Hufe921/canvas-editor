# Official plugin

::: tip
Official plugin: https://github.com/Hufe921/canvas-editor-plugin

Official plugin demo: https://hufe.club/canvas-editor-plugin
:::

## Barcode1d

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

## Barcode2d

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

## Code block

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

## Floating toolbar

```javascript
import Editor from '@hufe921/canvas-editor'
import floatingToolbarPlugin from '@hufe921/canvas-editor-plugin-floating-toolbar'

const instance = new Editor()
instance.use(floatingToolbarPlugin)
```

## Diagram

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

## Convert uppercase and lowercase

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

## Special characters

```javascript
import Editor from '@hufe921/canvas-editor'
import specialCharactersPlugin from '@hufe921/canvas-editor-plugin-special-characters'

const instance = new Editor()
instance.use(specialCharactersPlugin)

instance.command.executeOpenSpecialCharactersDialog({
  characters?: ISpecialCharacterGroup[], // custom character groups
  onSelect?: (char: string) => void // character selection callback
})
```

## Menstrual history

```javascript
import Editor from '@hufe921/canvas-editor'
import menstrualHistoryPlugin from '@hufe921/canvas-editor-plugin-menstrual-history'

const instance = new Editor()
instance.use(menstrualHistoryPlugin)

instance.command.executeLoadMenstrualHistory({
  data?: IMenstrualHistoryData, // initial data (for re-editing)
  onConfirm?: (
    data: IMenstrualHistoryData & { svg: string; width: number; height: number }
  ) => void, // confirm callback, returns the menstrual history SVG
  onCancel?: () => void // cancel callback
})
```

## Spellcheck

```javascript
import Editor from '@hufe921/canvas-editor'
import spellcheckPlugin from '@hufe921/canvas-editor-plugin-spellcheck'

const instance = new Editor()
instance.use(spellcheckPlugin, {
  disabled?: boolean, // disable spellcheck
  suggestionCount?: number, // number of suggested words
  suggestionTimeout?: number, // suggestion generation timeout (ms)
  ignoreWords?: string[], // ignored words (case-insensitive)
  minWordLength?: number, // minimum word length to check
  locale?: string, // dialog language (built-in zhCN, en)
  lang?: Partial<ISpellcheckLang> // override dialog text for the locale
})

instance.command.executeSpellcheckIgnoreWord(word: string)
```

## Signature

```javascript
import Editor from '@hufe921/canvas-editor'
import signaturePlugin from '@hufe921/canvas-editor-plugin-signature'

const instance = new Editor()
instance.use(signaturePlugin)

instance.command.executeSignature({
  width?: number, // board width
  height?: number, // board height
  exportType?: 'png' | 'svg', // exported image format, default svg
  locale?: string, // dialog language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<ISignatureLang>, // override dialog text for the locale
  onClose?: () => void, // close callback
  onCancel?: () => void, // cancel callback
  onConfirm?: (payload: ISignatureResult | null) => void // confirm callback, inserts the signature image into the editor by default
})
```

## Find and replace

```javascript
import Editor from '@hufe921/canvas-editor'
import findReplacePlugin from '@hufe921/canvas-editor-plugin-find-replace'

const instance = new Editor()
instance.use(findReplacePlugin, {
  locale?: string, // panel language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<IFindReplaceLang>, // override panel text for the locale
  shortcut?: boolean // whether to enable the global shortcut Ctrl/Cmd + F, enabled by default
})

instance.command.executeFindReplace({
  locale?: string, // panel language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<IFindReplaceLang>, // override panel text for the locale
  onClose?: () => void // panel close callback
})
```

## Mention

```javascript
import Editor from '@hufe921/canvas-editor'
import mentionPlugin from '@hufe921/canvas-editor-plugin-mention'

const instance = new Editor()
instance.use(mentionPlugin, {
  trigger?: string, // trigger character, default @
  dataList: IMentionItem[] | (() => IMentionItem[]), // candidate data
  max?: number, // maximum number of candidates shown, default 5
  label?: IMentionLabelStyle, // mention label style override
  locale?: string, // panel language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<IMentionLang>, // override panel text for the locale
  onSelect?: (item: IMentionItem) => void, // candidate select callback
  onClick?: (element: IElement) => void // inserted mention label click callback
})

// programmatically open the candidate panel at the cursor
instance.command.executeMention()
```

## Comment

```javascript
import Editor from '@hufe921/canvas-editor'
import commentPlugin from '@hufe921/canvas-editor-plugin-comment'

const instance = new Editor()
instance.use(commentPlugin, {
  highlightColor?: string, // comment highlight color, default #fde7e9
  railWidth?: number, // width of the right comment rail (px), default 220
  lineColor?: string, // connector line color, default #f54a45
  userColor?: string, // author name color on the comment card, default #f54a45
  user?: string, // current user name
  locale?: string, // popup language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<ICommentLang>, // override popup text for the locale
  onAdd?: (comment: IComment) => void, // comment add callback
  onRemove?: (id: string) => void // comment remove callback
})

instance.command.executeAddComment() // add a comment to the current selection
instance.command.executeRemoveComment(id?: string) // remove a comment
instance.command.executeGetCommentList() // get the comment list
instance.command.executeSetCommentList(list) // restore the comment list
```

## Formula

LaTeX inline formula plugin based on [KaTeX](https://katex.org/). Formulas are inserted as SVG images, with the LaTeX source persisted inside the image, and can be re-edited via the context menu.

```javascript
import Editor from '@hufe921/canvas-editor'
import formulaPlugin from '@hufe921/canvas-editor-plugin-formula'

const instance = new Editor()
instance.use(formulaPlugin, {
  isRegisterEditContextMenu?: boolean, // whether to register the formula edit context menu, default true
  locale?: string, // popup language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<IFormulaLang> // override popup text for the locale
})

instance.command.executeInsertFormula(latex: string) // insert an inline formula
```

## Suggestion

Automatically extracts the query word before the cursor while typing, matches candidate phrases in a dropdown panel, and replaces the typed query with the selected phrase.

```javascript
import Editor from '@hufe921/canvas-editor'
import suggestionPlugin from '@hufe921/canvas-editor-plugin-suggestion'

const instance = new Editor()
instance.use(suggestionPlugin, {
  dataList: ISuggestionItem[] | (() => ISuggestionItem[]), // candidate data
  minLength?: number, // minimum query length to trigger suggestion, default 1
  max?: number, // maximum number of candidates shown, default 5
  match?: 'prefix' | 'contains' | ((query, item) => boolean), // match mode, default prefix
  locale?: string, // panel language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<ISuggestionLang>, // override panel text for the locale
  onSelect?: (item: ISuggestionItem) => void // candidate select callback
})

instance.command.executeSuggestion(options?) // programmatically open the candidate panel
```

## Chart

Data chart plugin based on ECharts. Supports template-based configuration of bar, line, and pie charts. Charts are inserted as images, and an inserted chart image can be re-edited by double-clicking it or via the context menu.

> Note: echarts is a peer dependency and must be installed separately.

```javascript
import Editor from '@hufe921/canvas-editor'
import chartPlugin from '@hufe921/canvas-editor-plugin-chart'

const instance = new Editor()
instance.use(chartPlugin)

instance.command.executeChart({
  width?: number, // inserted image width, default 600
  height?: number, // inserted image height, default 400
  defaultOption?: object, // ECharts option prefilled when the dialog opens (enters advanced mode directly)
  locale?: string, // dialog language (built-in zhCN, en), defaults to the editor locale
  lang?: Partial<IChartLang>, // override dialog text for the locale
  onInsert?: (option: object) => void // chart insert callback
})
```
