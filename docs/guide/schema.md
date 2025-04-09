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
    RADIO = 'radio',
    LATEX = 'latex',
    TAB = 'tab',
    DATE = 'date',
    BLOCK = 'block'
  };
  value: string;
  valueList?: IElement[]; // 复合元素（超链接、标题、列表等）使用
  extension?: unknown;
  externalId?: string;
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
    ALIGNMENT = 'alignment',
    JUSTIFY = 'justify'
  };
  rowMargin?: number;
  letterSpacing?: number;
  textDecoration?: {
    style?: TextDecorationStyle;
  };
  // 组信息-可用于批注等其他成组使用场景
  groupIds?: string[];
  // 表格
  conceptId?: string;
  colgroup?: {
    width: number;
  }[];
  trList?: {
    height: number;
    pagingRepeat?: boolean;
    extension?: unknown;
    externalId?: string;
    tdList: {
      colspan: number;
      rowspan: number;
      conceptId?: string;
      verticalAlign?: VerticalAlign;
      backgroundColor?: string;
      borderTypes?: TdBorder[];
      slashTypes?: TdSlash[];
      value: IElement[];
      extension?: unknown;
      externalId?: string;
      disabled?: boolean;
      deletable?: boolean;
    }[];
  }[];
  borderType?: TableBorder;
  borderColor?: string;
  borderWidth?: number;
  borderExternalWidth?: number;
  tableToolDisabled?: boolean;
  // 超链接
  url?: string;
  // 上下标
  actualSize?: number;
  // 分割线
  dashArray?: number[];
  // 控件
  control?: {
    type: {
      TEXT = 'text',
      SELECT = 'select',
      CHECKBOX = 'checkbox',
      RADIO = 'radio'
      DATE = 'date',
      NUMBER = 'number'
    };
    value: IElement[] | null;
    placeholder?: string;
    conceptId?: string;
    prefix?: string;
    postfix?: string;
    preText?: string;
    postText?: string;
    minWidth?: number;
    underline?: boolean;
    border?: boolean;
    extension?: unknown;
    indentation?: ControlIndentation;
    rowFlex?: RowFlex
    deletable?: boolean;
    disabled?: boolean;
    pasteDisabled?: boolean;
    hide?: boolean;
    code: string | null;
    min?: number;
    max?: number;
    flexDirection: FlexDirection;
    valueSets: {
      value: string;
      code: string;
    }[];
    isMultiSelect?: boolean;
    multiSelectDelimiter?: string;
    dateFormat?: string;
    font?: string;
    size?: number;
    bold?: boolean;
    color?: string;
    highlight?: string;
    italic?: boolean;
    strikeout?: boolean;
    selectExclusiveOptions?: {
      inputAble?: boolean;
    }
  };
  controlComponent?: {
    PREFIX = 'prefix',
    POSTFIX = 'postfix',
    PLACEHOLDER = 'placeholder',
    VALUE = 'value',
    CHECKBOX = 'checkbox',
    RADIO = 'radio'
  };
  // 复选框
  checkbox?: {
    value: boolean | null;
  };
  // 单选框
  radio?: {
    value: boolean | null;
  };
  // LaTeX
  laTexSVG?: string;
  // 日期
  dateFormat?: string;
  // 图片
  imgDisplay?: {
    INLINE = 'inline',
    BLOCK = 'block'
  }
  imgFloatPosition?: {
    x: number;
    y: number;
    pageNo?: number;
  }
  imgToolDisabled?: boolean;
  // 内容块
  block?: {
    type: {
      IFRAME = 'iframe',
      VIDEO = 'video'
    };
    iframeBlock?: {
      src?: string;
      srcdoc?: string;
    };
    videoBlock?: {
      src: string;
    };
  };
  // 标题
  level?: TitleLevel;
  title?: {
    conceptId?: string;
    deletable?: boolean;
    disabled?: boolean;
  };
  // 列表
  listType?: ListType;
  listStyle?: ListStyle;
  listWrap?: boolean;
  // 区域
  areaId?: string;
  area?: {
    extension?: unknown;
    top?: number;
    borderColor?: string;
    backgroundColor?: string;
    mode?: AreaMode;
    deletable?: boolean;
    placeholder?: IPlaceholder;
  };
}
```
