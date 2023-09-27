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
    LATEX = 'latex',
    TAB = 'tab',
    DATE = 'date',
    BLOCK = 'block'
  };
  value: string;
  valueList?: IElement[]; // Use of composite elements (hyperlinks, titles, lists, and so on).
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
    ALIGNMENT = 'alignment'
  };
  rowMargin?: number;
  letterSpacing?: number;
  // groupIds
  groupIds?: string[];
  // table
  colgroup?: {
    width: number;
  }[];
  trList?: {
    height: number;
    tdList: {
      colspan: number;
      rowspan: number;
      verticalAlign?: VerticalAlign;
      backgroundColor?: string;
      borderType?: TdBorder;
      value: IElement[];
    }[];
  }[];
  borderType?: TableBorder;
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
      CHECKBOX = 'checkbox'
    };
    value: IElement[] | null;
    placeholder?: string;
    conceptId?: string;
    prefix?: string;
    postfix?: string;
    minWidth?: number;
    underline?: boolean;
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
  controlComponent?: {
    PREFIX = 'prefix',
    POSTFIX = 'postfix',
    PLACEHOLDER = 'placeholder',
    VALUE = 'value',
    CHECKBOX = 'checkbox'
  };
  // checkbox
  checkbox?: {
    value: boolean | null;
    code?: string;
    disabled?: boolean;
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
  // block
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
  // title
  level?: TitleLevel;
  // list
  listType?: ListType;
  listStyle?: ListStyle;
  listWrap?: boolean;
}
```
