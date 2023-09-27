export enum EditorComponent {
  COMPONENT = 'component',
  MENU = 'menu',
  MAIN = 'main',
  FOOTER = 'footer',
  CONTEXTMENU = 'contextmenu',
  POPUP = 'popup',
  CATALOG = 'catalog',
  COMMENT = 'comment'
}

export enum EditorContext {
  PAGE = 'page',
  TABLE = 'table'
}

export enum EditorMode {
  EDIT = 'edit', // 编辑模式（文档可编辑、辅助元素均存在）
  CLEAN = 'clean', // 清洁模式（隐藏辅助元素）
  READONLY = 'readonly', // 只读模式（文档不可编辑）
  FORM = 'form', // 表单模式（仅控件内可编辑）
  PRINT = 'print' // 打印模式（文档不可编辑、隐藏辅助元素、选区、未书写控件及边框）
}

export enum EditorZone {
  HEADER = 'header',
  MAIN = 'main',
  FOOTER = 'footer'
}

export enum PageMode {
  PAGING = 'paging',
  CONTINUITY = 'continuity'
}

export enum PaperDirection {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export enum WordBreak {
  BREAK_ALL = 'break-all',
  BREAK_WORD = 'break-word'
}
