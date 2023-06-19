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
  mode?: EditorMode; // 编辑器模式：编辑、清洁、只读。默认：编辑
  defaultType?: string; // 默认元素类型。默认：TEXT
  defaultFont?: string; // 默认字体。默认：Yahei
  defaultSize?: number; // 默认字号。默认：16
  minSize?: number; // 最小字号。默认：5
  maxSize?: number; // 最大字号。默认：72
  defaultBasicRowMarginHeight?: number; // 默认行高。默认：8
  defaultRowMargin?: number; // 默认行间距。默认：1
  defaultTabWidth?: number; // 默认tab宽度。默认：32
  width?: number; // 纸张宽度。默认：794
  height?: number; // 纸张高度。默认：1123
  scale?: number; // 缩放比例。默认：1
  pageGap?: number; // 纸张间隔。默认：20
  underlineColor?: string; // 下划线颜色。默认：#000000
  strikeoutColor?: string; // 删除线颜色。默认：#FF0000
  rangeColor?: string; // 选区颜色。默认：#AECBFA
  rangeAlpha?: number; // 选区透明度。默认：0.6
  rangeMinWidth?: number; // 选区最小宽度。默认：5
  searchMatchColor?: string; // 搜索高亮颜色。默认：#FFFF00
  searchNavigateMatchColor?: string; // 搜索导航高亮颜色。默认：#AAD280
  searchMatchAlpha?: number; // 搜索高亮透明度。默认：0.6
  highlightAlpha?: number; // 高亮元素透明度。默认：0.6
  resizerColor?: string; // 图片尺寸器颜色。默认：#4182D9
  resizerSize?: number; // 图片尺寸器大小。默认：5
  marginIndicatorSize?: number; // 页边距指示器长度。默认：35
  marginIndicatorColor?: string; // 页边距指示器颜色。默认：#BABABA
  margins?: IMargin; // 页面边距。默认：[100, 120, 100, 120]
  pageMode?: PageMode; // 纸张模式：连页、分页。默认：分页
  tdPadding?: number; // 单元格内边距。默认：5
  defaultTrMinHeight?: number; // 默认表格行最小高度。默认：40
  defaultHyperlinkColor?: string; // 默认超链接颜色。默认：#0000FF
  header?: IHeader; // 页眉信息。{top?:number; maxHeightRadio?:MaxHeightRatio;}
  footer?: IFooter; // 页脚信息。{bottom?:number; maxHeightRadio?:MaxHeightRatio;}
  pageNumber?: IPageNumber; // 页码信息。{bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
  paperDirection?: PaperDirection; // 纸张方向：纵向、横向
  inactiveAlpha?: number; // 正文内容失焦时透明度。默认值：0.6
  historyMaxRecordCount: number; // 历史（撤销重做）最大记录次数。默认：100次
  watermark?: IWatermark; // 水印信息。{data:string; color?:string; opacity?:number; size?:number; font?:string;}
  control?: IControlOption; // 控件信息。 {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string;}
  checkbox?: ICheckboxOption; // 复选框信息。{width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; fontStyle?: string;}
  cursor?: ICursorOption; // 光标样式。{width?: number; color?: string; dragWidth?: number; dragColor?: string;}
  title?: ITitleOption; // 标题配置。{ defaultFirstSize?: number; defaultSecondSize?: number; defaultThirdSize?: number defaultFourthSize?: number; defaultFifthSize?: number; defaultSixthSize?: number;}
  placeholder?: IPlaceholder; // 编辑器空白占位文本
}
```

## 页眉配置

```typescript
interface IHeader {
  top?: number; // 距离页面顶部大小。默认：30
  maxHeightRadio?: MaxHeightRatio; // 占页面最大高度比。默认：HALF
  disabled?: boolean; // 是否禁用
}
```

## 页脚配置

```typescript
interface IFooter {
  bottom?: number; // 距离页面底部大小。默认：30
  maxHeightRadio?: MaxHeightRatio; // 占页面最大高度比。默认：HALF
  disabled?: boolean; // 是否禁用
}
```

## 页码配置

```typescript
interface IPageNumber {
  bottom?: number; // 距离页面底部大小。默认：60
  size?: number; // 字体大小。默认：12
  font?: string; // 字体。默认：Yahei
  color?: string; // 字体颜色。默认：#000000
  rowFlex?: RowFlex; // 行对齐方式。默认：CENTER
  format?: string; // 页码格式。默认：{pageNo}。示例：第{pageNo}页/共{pageCount}页
  numberType?: NumberType; // 数字类型。默认：ARABIC
  disabled?: boolean; // 是否禁用
  startPageNo?: number; // 起始页码。默认：1
  fromPageNo?: number; // 从第几页开始出现页码。默认：0
}
```

## 水印配置

```typescript
interface IWatermark {
  data: string; // 文本。
  color?: string; // 颜色。默认：#AEB5C0
  opacity?: number; // 透明度。默认：0.3
  size?: number; // 字体大小。默认：200
  font?: string; // 字体。默认：Yahei
}
```

## 占位文本配置

```typescript
interface IPlaceholder {
  data: string; // 文本。
  color?: string; // 颜色。默认：#DCDFE6
  opacity?: number; // 透明度。默认：1
  size?: number; // 字体大小。默认：16
  font?: string; // 字体。默认：Yahei
}
```
