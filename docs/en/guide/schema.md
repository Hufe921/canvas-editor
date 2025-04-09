# Data Structure

```typescript
interface IElement {
  // basic
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
  valueList?: IElement[]; // Use of composite elements (hyperlinks, titles, lists, and so on).
  extension?: unknown;
  externalId?: string;
  // style
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
  // groupIds
  groupIds?: string[];
  // table
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
  // Hyperlinks
  url?: string;
  // Superscript and subscript
  actualSize?: number;
  // Dividing line
  dashArray?: number[];
  // control
  control?: {
    type: {
      TEXT = 'text',
      SELECT = 'select',
      CHECKBOX = 'checkbox',
      RADIO = 'radio',
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
  // checkbox
  checkbox?: {
    value: boolean | null;
  };
  // radio
  radio?: {
    value: boolean | null;
  };
  // LaTeX
  laTexSVG?: string;
  // date
  dateFormat?: string;
  // picture
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
  // block
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
  // title
  level?: TitleLevel;
  title?: {
    conceptId?: string;
    deletable?: boolean;
    disabled?: boolean;
  };
  // list
  listType?: ListType;
  listStyle?: ListStyle;
  listWrap?: boolean;
  // area
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
