# 数据结构

```typescript
interface IElement {
  // 基础
  id?: string;
  type?: {
    TEXT = 'text',
    IMAGE = 'image',
    TABLE = 'table',
    HYPERLINK = 'hyperlink',
    SUPERSCRIPT = 'superscript',
    SUBSCRIPT = 'subscript',
    SEPARATOR = 'separator',
    PAGE_BREAK = 'pageBreak',
    CONTROL = 'control',
    CHECKBOX = 'checkbox',
    LATEX = 'latex',
    TAB = 'tab',
    DATE = 'date',
    BLOCK = 'block'
  };
  value: string;
  // 样式
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  highlight?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  rowFlex?: {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    ALIGNMENT = 'alignment'
  };
  rowMargin?: number;
  letterSpacing?: number;
  // 表格
  colgroup?: {
    id?: string;
    width: number;
  }[];
  trList?: {
    id?: string;
    height: number;
    tdList: {
      colspan: number;
      rowspan: number;
      verticalAlign?: VerticalAlign;
      value: IElement[];
    }[];
  }[];
  tdId?: string;
  trId?: string;
  tableId?: string;
  // 超链接
  valueList?: IElement[];
  url?: string;
  hyperlinkId?: string;
  // 上下标
  actualSize?: number;
  // 分割线
  dashArray?: number[];
  // 控件
  control?: {
    type: {
      TEXT = 'text',
      SELECT = 'select',
      CHECKBOX = 'checkbox'
    };
    value: IElement[] | null;
    placeholder?: string;
    conceptId?: string;
    prefix?: string;
    postfix?: string;
    code: string | null;
    min?: number;
    max?: number;
    valueSets: {
      value: string;
      code: string;
    }[];
    checkbox?: {
      value: boolean | null;
      code?: string;
      disabled?: boolean;
    };
  };
  controlId?: string;
  controlComponent?: {
    PREFIX = 'prefix',
    POSTFIX = 'postfix',
    PLACEHOLDER = 'placeholder',
    VALUE = 'value',
    CHECKBOX = 'checkbox'
  };
  // 复选框
  checkbox?: {
    value: boolean | null;
    code?: string;
    disabled?: boolean;
  };
  // LaTeX
  laTexSVG?: string;
  // 日期
  dateFormat?: string;
  dateId?: string;
  // 图片
  imgDisplay?: {
    INLINE = 'inline',
    BLOCK = 'block'
  }
  // 内容块
  block?: {
    type: {
      IFRAME = 'iframe',
      VIDEO = 'video'
    };
    iframeBlock?: {
      src: string;
    };
    videoBlock?: {
      src: string;
    };
  };
}
```