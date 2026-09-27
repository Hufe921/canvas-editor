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
  hide?: boolean;
  hint?: string; // Hover hint text (requires the hint option to be enabled)
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
      hint?: string; // Cell hover hint text: shown when the cursor enters any element in the cell
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
  dashArray?: number[]; // Array for dashed line style
  lineWidth?: number; // Line width of the separator
  paperDirection?: PaperDirection; // Orientation after a page break
  // control
  control?: IControl; // Control data structure, see: Control-Options
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
  imgCrop?: {
    x: number;      // Crop start X coordinate (relative to original image)
    y: number;      // Crop start Y coordinate (relative to original image)
    width: number;  // Crop width
    height: number; // Crop height
  }
  imgCaption?: {
    value: string;  // Caption content, supports {imageNo} placeholder
    color?: string; // Caption font color
    font?: string;  // Caption font family
    size?: number;  // Caption font size
    top?: number;   // Spacing between caption and image
  }
  imgToolDisabled?: boolean;
  imgPreviewDisabled?: boolean;
  // block
  block?: {
    type: {
      IFRAME = 'iframe',
      VIDEO = 'video'
    };
    iframeBlock?: {
      src?: string;
      srcdoc?: string;
      sandbox?: string[];
      allow?: string[];
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
  listLevel?: number;
  // area
  areaId?: string;
  area?: {
    extension?: unknown;
    top?: number;
    hide?: boolean;
    borderColor?: string;
    backgroundColor?: string;
    mode?: AreaMode;
    deletable?: boolean;
    placeholder?: IPlaceholder;
  };
  // label
  labelId?: string;
  label?: {
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: IPadding;
  };
}
```
