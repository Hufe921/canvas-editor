export interface ITraceOption {
  disabled?: boolean // 初始是否禁用留痕记录，默认 true
  insertColor?: string // 留痕模式下新增元素的蓝色下划线颜色，默认 '#2B5CE6'
  deleteColor?: string // 留痕模式下删除元素的红色中划线颜色，默认 '#E03F3F'
  author?: string // 留痕记录作者标识，预留字段
  lineWidth?: number // 留痕线条宽度，默认 2
}

export interface IMarkElementListDeletedOption {
  isIgnoreDeletedRule?: boolean
  tdDeletable?: boolean
}
