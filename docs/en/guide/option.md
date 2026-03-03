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
  locale?: string // Language. default: zhCN
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
  highlightMarginHeight?: number // Highlight element margin height. default: 8
  resizerColor?: string // Image sizer color. default: #4182D9
  resizerSize?: number // Image sizer size. default: 5
  marginIndicatorSize?: number // The margin indicator length. default: 35
  marginIndicatorColor?: string // The margin indicator color. default: #BABABA
  margins?: IMargin // Page margins. default: [100, 120, 100, 120]
  pageMode?: PageMode // Paper mode: Linkage, Pagination. default: Pagination
  renderMode?: RenderMode // Render mode: speed(multi words combination rendering), compatibility(word by word rendering:avoid environmental differences such as browse,fonts...). default: speed
  defaultHyperlinkColor?: string // Default hyperlink color. default: #0000FF
  table?: ITableOption // Table configuration
  header?: IHeader // Header configuration
  footer?: IFooter // Footer configuration
  pageNumber?: IPageNumber // Page number configuration
  paperDirection?: PaperDirection // Paper orientation: portrait, landscape
  inactiveAlpha?: number // When the body content is out of focus, transparency. default: 0.6
  historyMaxRecordCount?: number // History (undo redo) maximum number of records. default: 100
  printPixelRatio?: number // Print the pixel ratio (larger values are clearer, but larger sizes). default: 3
  maskMargin?: IMargin // Masking margins above the editor（for example: menu bar, bottom toolbar）。default: [0, 0, 0, 0]
  letterClass?: string[] // Alphabet class supported by typesetting. default: a-zA-Z. Built-in alternative alphabet class: LETTER_CLASS
  contextMenuDisableKeys?: string[] // Disable context menu keys. default: []
  shortcutDisableKeys?: string[] // Disable shortcut keys. default: []
  scrollContainerSelector?: string // scroll container selector. default: document
  pageOuterSelectionDisable?: boolean // Disable selection when the mouse moves out of the page. default: false
  wordBreak?: WordBreak // Word and punctuation breaks: No punctuation in the first line of the BREAK_WORD &The word is not split, and the line is folded after BREAK_ALL full according to the width of the character. default: BREAK_WORD
  watermark?: IWatermark // Watermark configuration
  control?: IControlOption // Control configuration
  checkbox?: ICheckboxOption // Checkbox configuration
  radio?: IRadioOption // Radio configuration
  cursor?: ICursorOption // Cursor style configuration
  title?: ITitleOption // Title configuration
  placeholder?: IPlaceholder // Placeholder text configuration
  group?: IGroup // Group configuration
  pageBreak?: IPageBreak // Page break configuration
  zone?: IZoneOption // Zone configuration
  background?: IBackgroundOption // Background configuration
  lineBreak?: ILineBreakOption // Line break configuration
  whiteSpace?: IWhiteSpaceOption // White space configuration
  separator?: ISeparatorOption // Separator configuration
  lineNumber?: ILineNumberOption // Line number configuration
  pageBorder?: IPageBorderOption // Page border configuration
  badge?: IBadgeOption // Badge configuration
  modeRule?: IModeRule // Mode rule configuration
  graffiti?: IGraffitiOption // Graffiti mode configuration
  label?: ILabelOption // Label configuration
  imgCaption?: IImgCaptionOption // Image caption configuration
  list?: IListOption // List configuration
}
```

## Table Configuration

```typescript
interface ITableOption {
  tdPadding?: IPadding // Cell padding. default: [0, 5, 5, 5]
  defaultTrMinHeight?: number // Default table row minimum height. default: 42
  defaultColMinWidth?: number // Default minimum width for table columns (applied if the overall width is sufficient, otherwise
  overflow?: boolean // Is it allowed for the table to exceed the main body. Default: true
}
```

## Header Configuration

```typescript
interface IHeader {
  top?: number // Size from the top of the page.default: 30
  inactiveAlpha?: number // Transparency during deactivation. default: 1
  maxHeightRadio?: MaxHeightRatio // Occupies the maximum height ratio of the page.default: HALF
  disabled?: boolean // Whether to disable
  editable?: boolean // Disable the header content from being edited
}
```

## Footer Configuration

```typescript
interface IFooter {
  bottom?: number // The size from the bottom of the page.default: 30
  inactiveAlpha?: number // Transparency during deactivation. default: 1
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
  type?: WatermarkType
  width?: number
  height?: number
  color?: string // color. default: #AEB5C0
  opacity?: number // transparency. default: 0.3
  size?: number // font size. default: 200
  font?: string // font. default: Microsoft YaHei
  repeat?: boolean // repeat watermark. default: false
  gap?: [horizontal: number, vertical: number] // watermark spacing. default: [10,10]
  numberType?: NumberType // The numeric type. default: ARABIC
}
```

## Control Configuration

```typescript
interface IControlOption {
  placeholderColor?: string // Placeholder color. default: #000000
  bracketColor?: string // Bracket color. default: #000000
  prefix?: string // Prefix character. default: {}
  postfix?: string // Postfix character. default: {}
  borderWidth?: number // Border width. default: 0
  borderColor?: string // Border color
  activeBackgroundColor?: string // Background color when active
  disabledBackgroundColor?: string // Background color when disabled
  existValueBackgroundColor?: string // Background color when has value
  noValueBackgroundColor?: string // Background color when no value
}
```

## Checkbox Configuration

```typescript
interface ICheckboxOption {
  width?: number // Width. default: 14
  height?: number // Height. default: 14
  gap?: number // Gap between checkbox and text. default: 5
  lineWidth?: number // Border line width. default: 1
  fillStyle?: string // Fill style. default: #FFFFFF
  strokeStyle?: string // Border color. default: #000000
  checkFillStyle?: string // Fill style when checked
  checkStrokeStyle?: string // Border color when checked
  checkMarkColor?: string // Check mark color
  verticalAlign?: VerticalAlign // Vertical alignment. default: MIDDLE
}
```

## Radio Configuration

```typescript
interface IRadioOption {
  width?: number // Width. default: 14
  height?: number // Height. default: 14
  gap?: number // Gap between radio and text. default: 5
  lineWidth?: number // Border line width. default: 1
  fillStyle?: string // Fill style. default: #FFFFFF
  strokeStyle?: string // Border color. default: #000000
  verticalAlign?: VerticalAlign // Vertical alignment. default: MIDDLE
}
```

## Cursor Configuration

```typescript
interface ICursorOption {
  width?: number // Cursor width. default: 1
  color?: string // Cursor color. default: #000000
  dragWidth?: number // Drag cursor width. default: 2
  dragColor?: string // Drag cursor color. default: #000000
  dragFloatImageDisabled?: boolean // Whether to disable drag float image. default: false
}
```

## Title Configuration

```typescript
interface ITitleOption {
  defaultFirstSize?: number // Default font size for first level title. default: 32
  defaultSecondSize?: number // Default font size for second level title. default: 24
  defaultThirdSize?: number // Default font size for third level title. default: 18
  defaultFourthSize?: number // Default font size for fourth level title. default: 16
  defaultFifthSize?: number // Default font size for fifth level title. default: 14
  defaultSixthSize?: number // Default font size for sixth level title. default: 12
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

## Group Configuration

```typescript
interface IGroup {
  opacity?: number // Opacity. default: 0.2
  backgroundColor?: string // Background color. default: #FFFFFF
  activeOpacity?: number // Opacity when active. default: 0.4
  activeBackgroundColor?: string // Background color when active. default: #FFFFFF
  disabled?: boolean // Whether to disable. default: false
  deletable?: boolean // Whether can be deleted. default: true
}
```

## Page Break Configuration

```typescript
interface IPageBreak {
  font?: string // Font. default: Microsoft YaHei
  fontSize?: number // Font size. default: 12
  lineDash?: number[] // Line dash style. default: [5, 5]
}
```

## Zone Configuration

```typescript
interface IZoneOption {
  tipDisabled?: boolean // Whether to disable zone tooltip. default: false
}
```

## Background Configuration

```typescript
interface IBackgroundOption {
  color?: string // Background color. default: #FFFFFF
  image?: string // Background image URL
  size?: BackgroundSize // Background size. default: COVER
  repeat?: BackgroundRepeat // Background repeat mode. default: NO_REPEAT
  applyPageNumbers?: number[] // Page numbers to apply, default all pages
}
```

## Line Break Configuration

```typescript
interface ILineBreakOption {
  disabled?: boolean // Whether to disable display. default: true
  color?: string // Color. default: #000000
  lineWidth?: number // Line width. default: 1
}
```

## White Space Configuration

```typescript
interface IWhiteSpaceOption {
  disabled?: boolean // Whether to disable display. default: true
  color?: string // Color. default: #000000
  radius?: number // Dot radius. default: 2
}
```

## Separator Configuration

```typescript
interface ISeparatorOption {
  lineWidth?: number // Line width. default: 1
  strokeStyle?: string // Line color. default: #000000
}
```

## Line Number Configuration

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

## Page Border Configuration

```typescript
interface IPageBorderOption {
  color?: string // color. default: #000000
  lineWidth?: number // line width. default: 1
  padding?: IPadding // padding. default: [0, 0, 0, 0]
  disabled?: boolean //  Whether to disable. default: true
}
```

## Badge Configuration

```typescript
interface IBadgeOption {
  top?: number // Distance from top. default: 0
  left?: number // Distance from left. default: 0
}
```

## Mode Rule Configuration

```typescript
interface IModeRule {
  print?: {
    imagePreviewerDisabled?: boolean // Disable image previewer in print mode
    backgroundDisabled?: boolean // Disable background in print mode
  }
  readonly?: {
    imagePreviewerDisabled?: boolean // Disable image previewer in readonly mode
  }
  form?: {
    controlDeletableDisabled?: boolean // Disable control deletion in form mode
  }
}
```

## Graffiti Configuration

```typescript
interface IGraffitiOption {
  defaultLineWidth?: number // Default line width. default: 2
  defaultLineColor?: string // Default line color. default: #000000
}
```

## Label Configuration

```typescript
interface ILabelOption {
  defaultColor?: string // Default label text color
  defaultBackgroundColor?: string // Default label background color
  defaultBorderRadius?: number // Default label border radius
  defaultPadding?: IPadding // Default label padding
}
```

## Image Caption Configuration

```typescript
interface IImgCaptionOption {
  color?: string // Color. default: #000000
  font?: string // Font. default: Microsoft YaHei
  size?: number // Font size. default: 12
  top?: number // Distance from top of image. default: 5
}
```

## List Configuration

```typescript
interface IListOption {
  inheritStyle?: boolean // Whether to let the list number inherit the text style. default: false
}
```
