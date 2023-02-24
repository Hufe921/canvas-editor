# 配置

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

new Editor(container, [], {
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
  defaultBasicRowMarginHeight?: number; // 默认行高。默认：8
  defaultRowMargin?: number; // 默认行间距。默认：1
  defaultTabWidth?: number; // 默认tab宽度。默认：32
  width?: number; // 纸张宽度。默认：794
  height?: number; // 纸张高度。默认：1123
  scale?: number; // 缩放比例。默认：1
  pageGap?: number; // 纸张间隔。默认：20
  pageNumberBottom?: number; // 页码距离纸张下边距。默认：60
  pageNumberSize?: number; // 页码字号。默认：12
  pageNumberFont?: string; // 页码字体。默认：Yahei
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
  marginIndicatorColor?: string, // 页边距指示器颜色。默认：#BABABA
  margins?: IMargin, // 页面边距。默认：[100, 120, 100, 120]
  pageMode?: PageMode; // 纸张模式：连页、分页。默认：分页
  tdPadding?: number; // 单元格内边距。默认：5
  defaultTdHeight?: number; // 默认单元格高度。默认：40
  defaultHyperlinkColor?: string; // 默认超链接颜色。默认：#0000FF
  headerTop?: number; // 页眉距离上边距。默认：50
  header?: IHeader; // 页眉信息。{data:string; color?:string; size?:number; font?:string;}
  watermark?: IWatermark; // 水印信息。{data:string; color?:string; opacity?:number; size?:number; font?:string;}
  control?: IControlOption; // 控件信息。 {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string;}
  checkbox?: ICheckboxOption; // 复选框信息。{width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; fontStyle?: string;}
  cursor?: ICursorOption; // 光标样式。{width?: number; color?: string; dragWidth?: number; dragColor?: string;}
}
```