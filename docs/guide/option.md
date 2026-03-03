# 配置

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

new Editor(container, IEditorData | IElement[], {
  // 配置项
})
```

## 完整配置

```typescript
interface IEditorOption {
  mode?: EditorMode // 编辑器模式：编辑、清洁（不显示视觉辅助元素。如：分页符）、只读、表单（仅控件内可编辑）、打印（不显示辅助元素、未书写控件及前后括号）、设计模式（不可删除、只读等配置不控制）、涂鸦模式（屏蔽选区、允许长按移动绘制线条）。默认：编辑
  locale?: string // 多语言类型。默认：zhCN
  defaultType?: string // 默认元素类型。默认：TEXT
  defaultColor?: string // 默认字体颜色。默认：#000000
  defaultFont?: string // 默认字体。默认：Microsoft YaHei
  defaultSize?: number // 默认字号。默认：16
  minSize?: number // 最小字号。默认：5
  maxSize?: number // 最大字号。默认：72
  defaultBasicRowMarginHeight?: number // 默认行高。默认：8
  defaultRowMargin?: number // 默认行间距。默认：1
  defaultTabWidth?: number // 默认tab宽度。默认：32
  width?: number // 纸张宽度。默认：794
  height?: number // 纸张高度。默认：1123
  scale?: number // 缩放比例。默认：1
  pageGap?: number // 纸张间隔。默认：20
  underlineColor?: string // 下划线颜色。默认：#000000
  strikeoutColor?: string // 删除线颜色。默认：#FF0000
  rangeColor?: string // 选区颜色。默认：#AECBFA
  rangeAlpha?: number // 选区透明度。默认：0.6
  rangeMinWidth?: number // 选区最小宽度。默认：5
  searchMatchColor?: string // 搜索高亮颜色。默认：#FFFF00
  searchNavigateMatchColor?: string // 搜索导航高亮颜色。默认：#AAD280
  searchMatchAlpha?: number // 搜索高亮透明度。默认：0.6
  highlightAlpha?: number // 高亮元素透明度。默认：0.6
  highlightMarginHeight?: number // 高亮元素边距高度。默认：8
  resizerColor?: string // 图片尺寸器颜色。默认：#4182D9
  resizerSize?: number // 图片尺寸器大小。默认：5
  marginIndicatorSize?: number // 页边距指示器长度。默认：35
  marginIndicatorColor?: string // 页边距指示器颜色。默认：#BABABA
  margins?: IMargin // 页面边距。默认：[100, 120, 100, 120]
  pageMode?: PageMode // 纸张模式：连页、分页。默认：分页
  renderMode?: RenderMode // 渲染模式：极速（多个字组合渲染）、兼容（逐字渲染：避免浏览器字体等环境差异）。默认：极速
  defaultHyperlinkColor?: string // 默认超链接颜色。默认：#0000FF
  table?: ITableOption // 表格配置
  header?: IHeader // 页眉配置
  footer?: IFooter // 页脚配置
  pageNumber?: IPageNumber // 页码配置
  paperDirection?: PaperDirection // 纸张方向：纵向、横向
  inactiveAlpha?: number // 正文内容失焦时透明度。默认值：0.6
  historyMaxRecordCount?: number // 历史（撤销重做）最大记录次数。默认：100次
  printPixelRatio?: number // 打印像素比率（值越大越清晰，但尺寸越大）。默认：3
  maskMargin?: IMargin // 编辑器上的遮盖边距（如悬浮到编辑器上的菜单栏、底部工具栏）。默认：[0, 0, 0, 0]
  letterClass?: string[] // 排版支持的字母类。默认：a-zA-Z。内置可选择的字母表类：LETTER_CLASS
  contextMenuDisableKeys?: string[] // 禁用的右键菜单。默认：[]
  shortcutDisableKeys?: string[] // 禁用的快捷键。默认：[]
  scrollContainerSelector?: string // 滚动区域选择器。默认：document
  pageOuterSelectionDisable?: boolean // 鼠标移出页面时选区禁用。默认：false
  wordBreak?: WordBreak // 单词与标点断行：BREAK_WORD首行不出现标点&单词不拆分、BREAK_ALL按字符宽度撑满后折行。默认：BREAK_WORD
  watermark?: IWatermark // 水印配置
  control?: IControlOption // 控件配置
  checkbox?: ICheckboxOption // 复选框配置
  radio?: IRadioOption // 单选框配置
  cursor?: ICursorOption // 光标样式配置
  title?: ITitleOption // 标题配置
  placeholder?: IPlaceholder // 占位文本配置
  group?: IGroup // 成组配置
  pageBreak?: IPageBreak // 分页符配置
  zone?: IZoneOption // 编辑器区域配置
  background?: IBackgroundOption // 背景配置
  lineBreak?: ILineBreakOption // 换行符配置
  whiteSpace?: IWhiteSpaceOption // 空格符配置
  separator?: ISeparatorOption // 分隔符配置
  lineNumber?: ILineNumberOption // 行号配置
  pageBorder?: IPageBorderOption // 页面边框配置
  badge?: IBadgeOption // 徽章配置
  modeRule?: IModeRule // 编辑器模式规则配置
  graffiti?: IGraffitiOption // 涂鸦模式配置
  label?: ILabelOption // 标签配置
  imgCaption?: IImgCaptionOption // 图片题注配置
  list?: IListOption // 列表配置
}
```

## 表格配置

```typescript
interface ITableOption {
  tdPadding?: IPadding // 单元格内边距。默认：[0, 5, 5, 5]
  defaultTrMinHeight?: number // 默认表格行最小高度。默认：42
  defaultColMinWidth?: number // 默认表格列最小宽度（整体宽度足够时应用，否则会按比例缩小）。默认：40
  overflow?: boolean // 是否允许表格超出正文区域。默认：true
}
```

## 页眉配置

```typescript
interface IHeader {
  top?: number // 距离页面顶部大小。默认：30
  inactiveAlpha?: number // 失活时透明度。默认：1
  maxHeightRadio?: MaxHeightRatio // 占页面最大高度比。默认：HALF
  disabled?: boolean // 是否禁用
  editable?: boolean // 禁止编辑标题内容
}
```

## 页脚配置

```typescript
interface IFooter {
  bottom?: number // 距离页面底部大小。默认：30
  inactiveAlpha?: number // 失活时透明度。默认：1
  maxHeightRadio?: MaxHeightRatio // 占页面最大高度比。默认：HALF
  disabled?: boolean // 是否禁用
  editable?: boolean // 禁止编辑页脚内容
}
```

## 页码配置

```typescript
interface IPageNumber {
  bottom?: number // 距离页面底部大小。默认：60
  size?: number // 字体大小。默认：12
  font?: string // 字体。默认：Microsoft YaHei
  color?: string // 字体颜色。默认：#000000
  rowFlex?: RowFlex // 行对齐方式。默认：CENTER
  format?: string // 页码格式。默认：{pageNo}。示例：第{pageNo}页/共{pageCount}页
  numberType?: NumberType // 数字类型。默认：ARABIC
  disabled?: boolean // 是否禁用
  startPageNo?: number // 起始页码。默认：1
  fromPageNo?: number // 从第几页开始出现页码。默认：0
  maxPageNo?: number | null // 最大页码（从0开始）。默认：null
}
```

## 水印配置

```typescript
interface IWatermark {
  data: string // 文本。
  type?: WatermarkType
  width?: number
  height?: number
  color?: string // 颜色。默认：#AEB5C0
  opacity?: number // 透明度。默认：0.3
  size?: number // 字体大小。默认：200
  font?: string // 字体。默认：Microsoft YaHei
  repeat?: boolean // 重复水印。默认：false
  gap?: [horizontal: number, vertical: number] // 水印间距。默认：[10,10]
  numberType: NumberType.ARABIC // 页码格式。默认：{pageNo}。示例：第{pageNo}页/共{pageCount}页
}
```

## 控件配置

```typescript
interface IControlOption {
  placeholderColor?: string // 占位符颜色。默认：#000000
  bracketColor?: string // 括号颜色。默认：#000000
  prefix?: string // 前缀字符。默认：{}
  postfix?: string // 后缀字符。默认：{}
  borderWidth?: number // 边框宽度。默认：0
  borderColor?: string // 边框颜色
  activeBackgroundColor?: string // 激活时背景色
  disabledBackgroundColor?: string // 禁用时背景色
  existValueBackgroundColor?: string // 有值时背景色
  noValueBackgroundColor?: string // 无值时背景色
}
```

## 复选框配置

```typescript
interface ICheckboxOption {
  width?: number // 宽度。默认：14
  height?: number // 高度。默认：14
  gap?: number // 与文本间距。默认：5
  lineWidth?: number // 边框线宽。默认：1
  fillStyle?: string // 填充样式。默认：#FFFFFF
  strokeStyle?: string // 边框颜色。默认：#000000
  checkFillStyle?: string // 选中时填充样式
  checkStrokeStyle?: string // 选中时边框颜色
  checkMarkColor?: string // 对勾颜色
  verticalAlign?: VerticalAlign // 垂直对齐方式。默认：MIDDLE
}
```

## 单选框配置

```typescript
interface IRadioOption {
  width?: number // 宽度。默认：14
  height?: number // 高度。默认：14
  gap?: number // 与文本间距。默认：5
  lineWidth?: number // 边框线宽。默认：1
  fillStyle?: string // 填充样式。默认：#FFFFFF
  strokeStyle?: string // 边框颜色。默认：#000000
  verticalAlign?: VerticalAlign // 垂直对齐方式。默认：MIDDLE
}
```

## 光标配置

```typescript
interface ICursorOption {
  width?: number // 光标宽度。默认：1
  color?: string // 光标颜色。默认：#000000
  dragWidth?: number // 拖拽光标宽度。默认：2
  dragColor?: string // 拖拽光标颜色。默认：#000000
  dragFloatImageDisabled?: boolean // 是否禁用拖拽浮动图片。默认：false
}
```

## 标题配置

```typescript
interface ITitleOption {
  defaultFirstSize?: number // 一级标题默认字号。默认：32
  defaultSecondSize?: number // 二级标题默认字号。默认：24
  defaultThirdSize?: number // 三级标题默认字号。默认：18
  defaultFourthSize?: number // 四级标题默认字号。默认：16
  defaultFifthSize?: number // 五级标题默认字号。默认：14
  defaultSixthSize?: number // 六级标题默认字号。默认：12
}
```

## 占位文本配置

```typescript
interface IPlaceholder {
  data: string // 文本。
  color?: string // 颜色。默认：#DCDFE6
  opacity?: number // 透明度。默认：1
  size?: number // 字体大小。默认：16
  font?: string // 字体。默认：Microsoft YaHei
}
```

## 成组配置

```typescript
interface IGroup {
  opacity?: number // 透明度。默认：0.2
  backgroundColor?: string // 背景颜色。默认：#FFFFFF
  activeOpacity?: number // 激活时透明度。默认：0.4
  activeBackgroundColor?: string // 激活时背景颜色。默认：#FFFFFF
  disabled?: boolean // 是否禁用。默认：false
  deletable?: boolean // 是否可删除。默认：true
}
```

## 分页符配置

```typescript
interface IPageBreak {
  font?: string // 字体。默认：Microsoft YaHei
  fontSize?: number // 字号。默认：12
  lineDash?: number[] // 虚线样式。默认：[5, 5]
}
```

## 区域配置

```typescript
interface IZoneOption {
  tipDisabled?: boolean // 是否禁用区域提示。默认：false
}
```

## 背景配置

```typescript
interface IBackgroundOption {
  color?: string // 背景颜色。默认：#FFFFFF
  image?: string // 背景图片URL
  size?: BackgroundSize // 背景尺寸。默认：COVER
  repeat?: BackgroundRepeat // 背景重复方式。默认：NO_REPEAT
  applyPageNumbers?: number[] // 应用的页码数组，默认全部页面
}
```

## 换行符配置

```typescript
interface ILineBreakOption {
  disabled?: boolean // 是否禁用显示。默认：true
  color?: string // 颜色。默认：#000000
  lineWidth?: number // 线宽。默认：1
}
```

## 空格符配置

```typescript
interface IWhiteSpaceOption {
  disabled?: boolean // 是否禁用显示。默认：true
  color?: string // 颜色。默认：#000000
  radius?: number // 圆点半径。默认：2
}
```

## 分隔符配置

```typescript
interface ISeparatorOption {
  lineWidth?: number // 线宽。默认：1
  strokeStyle?: string // 线条颜色。默认：#000000
}
```

## 行号配置

```typescript
interface ILineNumberOption {
  size?: number // 字体大小。默认：12
  font?: string // 字体。默认：Microsoft YaHei
  color?: string // 颜色。默认：#000000
  disabled?: boolean // 是否禁用。默认：true
  right?: number // 距离正文距离。默认：20
  type?: LineNumberType // 编号类型（每页重新编号、连续编号）。默认：连续编号
}
```

## 页面边框配置

```typescript
interface IPageBorderOption {
  color?: string // 颜色。默认：#000000
  lineWidth?: number // 宽度。默认：1
  padding?: IPadding // 距离正文内边距。默认：[0, 5, 0, 5]
  disabled?: boolean // 是否禁用。默认：true
}
```

## 徽章配置

```typescript
interface IBadgeOption {
  top?: number // 距离顶部距离。默认：0
  left?: number // 距离左侧距离。默认：0
}
```

## 模式规则配置

```typescript
interface IModeRule {
  print?: {
    imagePreviewerDisabled?: boolean // 打印模式禁用图片预览
    backgroundDisabled?: boolean // 打印模式禁用背景
  }
  readonly?: {
    imagePreviewerDisabled?: boolean // 只读模式禁用图片预览
  }
  form?: {
    controlDeletableDisabled?: boolean // 表单模式禁用控件删除
  }
}
```

## 涂鸦配置

```typescript
interface IGraffitiOption {
  defaultLineWidth?: number // 默认线条宽度。默认：2
  defaultLineColor?: string // 默认线条颜色。默认：#000000
}
```

## 标签配置

```typescript
interface ILabelOption {
  defaultColor?: string // 默认标签文本颜色
  defaultBackgroundColor?: string // 默认标签背景颜色
  defaultBorderRadius?: number // 默认标签边框半径
  defaultPadding?: IPadding // 默认标签内边距
}
```

## 图片题注配置

```typescript
interface IImgCaptionOption {
  color?: string // 颜色。默认：#000000
  font?: string // 字体。默认：Microsoft YaHei
  size?: number // 字号。默认：12
  top?: number // 距离图片顶部距离。默认：5
}
```

## 列表配置

```typescript
interface IListOption {
  inheritStyle?: boolean // 是否让列表序号继承文字样式。默认：false
}
```
