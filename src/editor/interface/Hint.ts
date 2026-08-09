export interface IHintOption {
  disabled?: boolean // 总开关：是否禁用元素悬浮提示。默认：true（默认关闭，需显式开启）
  backgroundColor?: string // 提示浮窗背景色。默认：#fff
  color?: string // 提示浮窗文字颜色。默认：#000000
  fontSize?: number // 提示浮窗字号。默认：12
  maxWidth?: number // 提示浮窗最大宽度（超出自动换行）。默认：280
}
