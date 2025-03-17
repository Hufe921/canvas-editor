# Configuration

## How to Use?

```javascript
import Editor from "@hufe921/canvas-editor"

new Editor(container, IEditorData | IElement[], {
  // option
})
```

## Complete Configuration

```typescript
interface IEditorOption {
  mode?: EditorMode // Editor mode: Edit, Clean (Visual aids are not displayed, For example: page break), ReadOnly, Form (Only editable within the control), Print (Visual aids are not displayed, Unwritten content control), Design (Do not handle configurations such as non deletable and read-only). default: Edit
  defaultType?: string // Default element type. default: TEXT
  defaultColor?: string // Default color. default: #000000
  defaultFont?: string // Default font. default: Microsoft YaHei
  defaultSize?: number // Default font size. default: 16
  minSize?: number // Min font size。default: 5
  maxSize?: number // Max font size。default: 72
  defaultBasicRowMarginHeight?: number // Default line height。default: 8
  defaultRowMargin?: number // Default line spacing. default: 1
  defaultTabWidth?: number // Default tab width. default: 32
  width?: number // Paper width. default: 794
  height?: number // Paper height. default: 1123
  scale?: number // scaling. default: 1
  pageGap?: number // Paper spacing. default: 20
  underlineColor?: string // Underline color. default: #000000
  strikeoutColor?: string // Strikeout color. default: #FF0000
  rangeColor?: string // Range color. default: #AECBFA
  rangeAlpha?: number // Range transparency. default: 0.6
  rangeMinWidth?: number // Range min width. default: 5
  searchMatchColor?: string // Search for highlight color. default: #FFFF00
  searchNavigateMatchColor?: string // Search navigation highlighted color.default: #AAD280
  searchMatchAlpha?: number // Search for highlight transparency. default: 0.6
  highlightAlpha?: number //  Highlight element transparency. default: 0.6
  resizerColor?: string // Image sizer color. default: #4182D9
  resizerSize?: number // Image sizer size. default: 5
  marginIndicatorSize?: number // The margin indicator length. default: 35
  marginIndicatorColor?: string // The margin indicator color. default: #BABABA
  margins?: IMargin // Page margins. default: [100, 120, 100, 120]
  pageMode?: PageMode // Paper mode: Linkage, Pagination. default: Pagination
  renderMode?: RenderMode // Render mode: speed(multi words combination rendering), compatibility(word by word rendering:avoid environmental differences such as browse,fonts...). default: speed
  defaultHyperlinkColor?: string // Default hyperlink color. default: #0000FF
  table?: ITableOption // table configuration {tdPadding?:IPadding; defaultTrMinHeight?:number; defaultColMinWidth?:number}
  header?: IHeader // Header information.{top?:number; maxHeightRadio?:MaxHeightRatio;}
  footer?: IFooter // Footer information. {bottom?:number; maxHeightRadio?:MaxHeightRatio;}
  pageNumber?: IPageNumber // Page number information. {bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
  paperDirection?: PaperDirection // Paper orientation: portrait, landscape
  inactiveAlpha?: number // When the body content is out of focus, transparency. default: 0.6
  historyMaxRecordCount?: number // History (undo redo) maximum number of records. default: 100
  printPixelRatio?: number // Print the pixel ratio (larger values are clearer, but larger sizes). default: 3
  maskMargin?: IMargin // Masking margins above the editor（for example: menu bar, bottom toolbar）。default: [0, 0, 0, 0]
  letterClass?: string[] // Alphabet class supported by typesetting. default: a-zA-Z. Built-in alternative alphabet class: LETTER_CLASS
  contextMenuDisableKeys?: string[] // Disable context menu keys. default: []
  scrollContainerSelector?: string // scroll container selector. default: document
  wordBreak?: WordBreak // Word and punctuation breaks: No punctuation in the first line of the BREAK_WORD &The word is not split, and the line is folded after BREAK_ALL full according to the width of the character. default: BREAK_WORD
  watermark?: IWatermark // Watermark{data:string; color?:string; opacity?:number; size?:number; font?:string; numberType:NumberType;}
  control?: IControlOption // Control {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string; borderWidth?: number; borderColor?: string; activeBackgroundColor?: string;}
  checkbox?: ICheckboxOption // Checkbox {width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  radio?: IRadioOption // Radio {width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  cursor?: ICursorOption // Cursor style. {width?: number; color?: string; dragWidth?: number; dragColor?: string; dragFloatImageDisabled?: boolean;}
  title?: ITitleOption // Title configuration.{ defaultFirstSize?: number; defaultSecondSize?: number; defaultThirdSize?: number defaultFourthSize?: number; defaultFifthSize?: number; defaultSixthSize?: number;}
  placeholder?: IPlaceholder // Placeholder text
  group?: IGroup // Group option. {opacity?:number; backgroundColor?:string; activeOpacity?:number; activeBackgroundColor?:string; disabled?:boolean}
  pageBreak?: IPageBreak // PageBreak option。{font?:string; fontSize?:number; lineDash?:number[];}
  zone?: IZoneOption // Zone option。{tipDisabled?:boolean;}
  background?: IBackgroundOption // Background option. {color?:string; image?:string; size?:BackgroundSize; repeat?:BackgroundRepeat; applyPageNumbers?:number[]}。default: {color: '#FFFFFF'}
  lineBreak?: ILineBreakOption // LineBreak option. {disabled?:boolean; color?:string; lineWidth?:number;}
  separator?: ISeparatorOption // Separator option. {lineWidth?:number; strokeStyle?:string;}
  lineNumber?: ILineNumberOption // LineNumber option. {size?:number; font?:string; color?:string; disabled?:boolean; right?:number}
  pageBorder?: IPageBorderOption // PageBorder option. {color?:string; lineWidth:number; padding?:IPadding; disabled?:boolean;}
  badge?: IBadgeOption // Badge option. {top?:number; left?:number}
}
```

## Table Configuration

```typescript
interface ITableOption {
  tdPadding?: IPadding // Cell padding. default: [0, 5, 5, 5]
  defaultTrMinHeight?: number // Default table row minimum height. default: 42
  defaultColMinWidth?: number // Default minimum width for table columns (applied if the overall width is sufficient, otherwise
}
```

## Header Configuration

```typescript
interface IHeader {
  top?: number // Size from the top of the page.default: 30
  maxHeightRadio?: MaxHeightRatio // Occupies the maximum height ratio of the page.default: HALF
  disabled?: boolean // Whether to disable
  editable?: boolean // Disable the header content from being edited
}
```

## Footer Configuration

```typescript
interface IFooter {
  bottom?: number // The size from the bottom of the page.default: 30
  maxHeightRadio?: MaxHeightRatio // Occupies the maximum height ratio of the page.default: HALF
  disabled?: boolean // Whether to disable
  editable?: boolean // Disable the footer content from being edited
}
```

## Page Number Configuration

```typescript
interface IPageNumber {
  bottom?: number // The size from the bottom of the page.default: 60
  size?: number // font size. default: 12
  font?: string // font. default: Microsoft YaHei
  color?: string // font color. default: #000000
  rowFlex?: RowFlex // Line alignment. default: CENTER
  format?: string // Page number format. default: {pageNo}。example：{pageNo}/{pageCount}
  numberType?: NumberType // The numeric type. default: ARABIC
  disabled?: boolean // Whether to disable
  startPageNo?: number // Start page number.default: 1
  fromPageNo?: number // Page numbers appear from page number.default: 0
  maxPageNo?: number | null // Max page number（starting from 0）.default: null
}
```

## Watermark Configuration

```typescript
interface IWatermark {
  data: string // text.
  color?: string // color. default: #AEB5C0
  opacity?: number // transparency. default: 0.3
  size?: number // font size. default: 200
  font?: string // font. default: Microsoft YaHei
  repeat?: boolean // repeat watermark. default: false
  gap?: [horizontal: number, vertical: number] // watermark spacing. default: [10,10]
  numberType?: NumberType // The numeric type. default: ARABIC
}
```

## Placeholder Text Configuration

```typescript
interface IPlaceholder {
  data: string // text.
  color?: string // color. default: #DCDFE6
  opacity?: number // transparency. default: 1
  size?: number // font size. default: 16
  font?: string // font. default: Microsoft YaHei
}
```

## LineNumber Configuration

```typescript
interface ILineNumberOption {
  size?: number // font size. default: 12
  font?: string // font. default: Microsoft YaHei
  color?: string // color. default: #000000
  disabled?: boolean // Whether to disable. default: false
  right?: number // Distance from the main text. default: 20
  type?: LineNumberType // Number type (renumber each page, consecutive numbering). default: continuity
}
```

## PageBorder Configuration

```typescript
interface IPageBorderOption {
  color?: string // color. default: #000000
  lineWidth?: number // line width. default: 1
  padding?: IPadding // padding. default: [0, 0, 0, 0]
  disabled?: boolean //  Whether to disable. default: true
}
```
