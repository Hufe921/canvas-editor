# Configuration

## How to Use ?

```javascript
import Editor from "@hufe921/canvas-editor"

new Editor(container, IEditorData | IElement[], {
  // option
})
```

## Complete Configuration

```typescript
interface IEditorOption {
  mode?: EditorMode // Editor mode: Edit, Clean (Visual aids are not displayed, For example: page break), ReadOnly, Form (Only editable within the control), Print (Visual aids are not displayed, Unwritten content control). default: Edit
  defaultType?: string // Default element type. default: TEXT
  defaultFont?: string // Default font. default: Yahei
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
  backgroundColor?: string // Paper background color. default: #FFFFFF
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
  tdPadding?: IPadding // Cell padding. default: [0, 5, 5, 5]
  defaultTrMinHeight?: number // Default table row minimum height. default: 42
  defaultColMinWidth?: number // Default minimum width for table columns (applied if the overall width is sufficient, otherwise scaled down). default: 40
  defaultHyperlinkColor?: string // Default hyperlink color. default: #0000FF
  header?: IHeader // Header information.{top?:number; maxHeightRadio?:MaxHeightRatio;}
  footer?: IFooter // Footer information. {bottom?:number; maxHeightRadio?:MaxHeightRatio;}
  pageNumber?: IPageNumber // Page number information. {bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
  paperDirection?: PaperDirection // Paper orientation: portrait, landscape
  inactiveAlpha?: number // When the body content is out of focus, transparency. default: 0.6
  historyMaxRecordCount?: number // History (undo redo) maximum number of records. default: 100
  printPixelRatio?: number // Print the pixel ratio (larger values are clearer, but larger sizes). default: 3
  maskMargin?: IMargin // Masking margins above the editor（for example: menu bar, bottom toolbar）。default: [0, 0, 0, 0]
  letterClass? string[] // Alphabet class supported by typesetting. default: a-zA-Z. Built-in alternative alphabet class: LETTER_CLASS
  wordBreak?: WordBreak // Word and punctuation breaks: No punctuation in the first line of the BREAK_WORD &The word is not split, and the line is folded after BREAK_ALL full according to the width of the character. default: BREAK_WORD
  watermark?: IWatermark // Watermark{data:string; color?:string; opacity?:number; size?:number; font?:string;}
  control?: IControlOption // Control {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string;}
  checkbox?: ICheckboxOption // Checkbox {width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; fontStyle?: string;}
  cursor?: ICursorOption // Cursor style. {width?: number; color?: string; dragWidth?: number; dragColor?: string;}
  title?: ITitleOption // Title configuration.{ defaultFirstSize?: number; defaultSecondSize?: number; defaultThirdSize?: number defaultFourthSize?: number; defaultFifthSize?: number; defaultSixthSize?: number;}
  placeholder?: IPlaceholder // Placeholder text
  group?: IGroup // Group option. {opacity?:number; backgroundColor?:string; activeOpacity?:number; activeBackgroundColor?:string; disabled?:boolean}
  pageBreak?: IPageBreak // PageBreak option。{font?:string; fontSize?:number; lineDash?:number[];}
}
```

## Header Configuration

```typescript
interface IHeader {
  top?: number // Size from the top of the page.default: 30
  maxHeightRadio?: MaxHeightRatio // Occupies the maximum height ratio of the page.default: HALF
  disabled?: boolean // Whether to disable
}
```

## Footer Configuration

```typescript
interface IFooter {
  bottom?: number // The size from the bottom of the page.default: 30
  maxHeightRadio?: MaxHeightRatio // Occupies the maximum height ratio of the page.default: HALF
  disabled?: boolean // Whether to disable
}
```

## Page Number Configuration

```typescript
interface IPageNumber {
  bottom?: number // The size from the bottom of the page.default: 60
  size?: number // font size.default: 12
  font?: string // font.default: Yahei
  color?: string // font color.default: #000000
  rowFlex?: RowFlex // Line alignment.default: CENTER
  format?: string // Page number format.default: {pageNo}。example：{pageNo}/{pageCount}
  numberType?: NumberType // The numeric type. default: ARABIC
  disabled?: boolean // Whether to disable
  startPageNo?: number // Start page number.default: 1
  fromPageNo?: number // Page numbers appear from page number.default: 0
}
```

## Watermark Configuration

```typescript
interface IWatermark {
  data: string // text.
  color?: string // color.default: #AEB5C0
  opacity?: number // transparency.default: 0.3
  size?: number // font size.default: 200
  font?: string // font.default: Yahei
}
```

## Placeholder Text Configuration

```typescript
interface IPlaceholder {
  data: string // text.
  color?: string // color.default: #DCDFE6
  opacity?: number // transparency.default: 1
  size?: number // font size.default: 16
  font?: string // font.default: Yahei
}
```
