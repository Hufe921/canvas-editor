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
