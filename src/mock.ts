import { CaretMovement, TextDirection, TextScript } from './editor'
import type { IEditorOption } from './editor'

export {
  data,
  header,
  footer,
  commentList,
  zhData,
  arData
} from './mock-weekend'

const fontBaseUrl = `${import.meta.env.BASE_URL}fonts/`

export const options: IEditorOption = {
  // 默认开启：未覆盖的文字从 Bunny Fonts 请求基本字体。
  autoDownloadFonts: true,
  margins: [100, 120, 100, 120],

  // 内容默认自动探测；多语邀请卡的阿语段显式使用 RTL
  // LTR/RTL 模式只影响 UI + 新建行/表默认值，不改已有 element.direction
  defaultDirection: TextDirection.AUTO,
  direction: TextDirection.LTR,
  uiDirectionToggle: true,
  caretMovement: CaretMovement.VISUAL,
  cursor: {
    color: '#000000',
    width: 1
  },
  fonts: [
    {
      family: 'Noto Naskh Arabic',
      url: `${fontBaseUrl}NotoNaskhArabic-Regular.ttf`,
      weight: 400,
      style: 'normal',
      scripts: [TextScript.ARAB]
    },
    {
      family: 'Noto Sans Devanagari',
      url: `${fontBaseUrl}NotoSansDevanagari-Regular.ttf`,
      scripts: [TextScript.DEVA]
    },
    {
      family: 'Noto Sans Thai',
      url: `${fontBaseUrl}NotoSansThai-Regular.ttf`,
      scripts: [TextScript.THAI]
    }
  ],
  // 原生段落增量复用（实验性；分页和位置仍重新计算）
  lab: {
    incrementalCompute: true
  },
  trace: {
    author: '活动协调员'
  },
  watermark: {
    data: 'WEEKEND',
    size: 120
  },
  pageNumber: {
    format: '第{pageNo}页/共{pageCount}页'
  },
  placeholder: {
    data: '请输入正文'
  },
  zone: {
    tipDisabled: false
  },
  maskMargin: [60, 0, 30, 0] // 菜单栏高度60，底部工具栏30为遮盖层
}
