import {
  AlignmentType,
  BorderStyle,
  CheckBox,
  Document,
  ExternalHyperlink,
  Footer,
  Header,
  HeightRule,
  ImageRun,
  LineRuleType,
  MathRun,
  Packer,
  PageBreak,
  Paragraph,
  ParagraphChild,
  Table,
  TableCell,
  TableRow,
  Tab,
  TextRun,
  VerticalAlign as DocxVerticalAlign,
  WidthType
} from 'docx'
import {
  Command,
  ElementType,
  IElement,
  IRow,
  ListStyle,
  ListType,
  RowFlex,
  TableBorder,
  TitleLevel,
  VerticalAlign,
  IEditorOption
} from '../../editor'
import {
  saveAs,
  deepClone,
  pxToTwip,
  pxToHalfPoint,
  normalizeColor,
  getBorderColor,
  getTextColor,
  stripBase64Prefix
} from './utils'

// 类型定义：docx库的段落对齐类型
type DocxAlignment = (typeof AlignmentType)[keyof typeof AlignmentType]
// 类型定义：docx库的单元格垂直对齐类型
type DocxCellVerticalAlign =
  (typeof DocxVerticalAlign)[keyof typeof DocxVerticalAlign]
// 类型定义：docx段落或表格的子项数组，代表文档主体内容
type DocxChildren = (Paragraph | Table)[]

/**
 * 导出 Word (docx) 时的配置选项
 */
export interface IExportDocxOption {
  /** 导出文件的名称（不含后缀） */
  fileName: string
  /** 是否直接触发浏览器下载文件，默认为 true。若为 false 则返回 Blob */
  isFile?: boolean
}

/**
 * 将编辑器的行对齐方式转换为 docx 对齐类型
 */
function getParagraphAlignment(rowFlex?: RowFlex): DocxAlignment | undefined {
  switch (rowFlex) {
    case RowFlex.LEFT:
      return AlignmentType.LEFT
    case RowFlex.CENTER:
      return AlignmentType.CENTER
    case RowFlex.RIGHT:
      return AlignmentType.RIGHT
    case RowFlex.ALIGNMENT:
    case RowFlex.JUSTIFY:
      return AlignmentType.JUSTIFIED
    default:
      return undefined
  }
}

/**
 * 将编辑器的垂直对齐方式转换为 docx 单元格垂直对齐类型
 */
function getCellVerticalAlign(
  align?: VerticalAlign
): DocxCellVerticalAlign | undefined {
  switch (align) {
    case VerticalAlign.TOP:
      return DocxVerticalAlign.TOP
    case VerticalAlign.MIDDLE:
      return DocxVerticalAlign.CENTER
    case VerticalAlign.BOTTOM:
      return DocxVerticalAlign.BOTTOM
    default:
      return undefined
  }
}

/**
 * 根据列表元素样式及当前索引获取列表前缀文本
 */
function getListPrefix(element: IElement, index = 1): string {
  if (element.listType === ListType.OL) {
    return `${index}. `
  }
  if (element.listStyle === ListStyle.CHECKBOX) {
    return element.checkbox?.value ? '☑' : '□'
  }
  switch (element.listStyle) {
    case ListStyle.CIRCLE:
      return '◦ '
    case ListStyle.SQUARE:
      return '▫︎ '
    case ListStyle.DISC:
    default:
      return '• '
  }
}

/**
 * 构建 docx 格式的表格边框配置对象
 */
function getTableBorders(
  borderType?: TableBorder,
  borderColor?: string,
  borderWidth?: number,
  borderExternalWidth?: number
) {
  const bw = borderWidth || 1
  const ebw = borderExternalWidth || bw
  const color = getBorderColor(borderColor || '#000000')

  const defaultBorder = { style: BorderStyle.SINGLE, size: bw, color }
  const externalBorder = { style: BorderStyle.SINGLE, size: ebw, color }
  const emptyBorder = { style: BorderStyle.NIL, size: 0, color }

  switch (borderType) {
    case TableBorder.ALL:
      return {
        top: defaultBorder,
        bottom: defaultBorder,
        left: defaultBorder,
        right: defaultBorder,
        insideHorizontal: defaultBorder,
        insideVertical: defaultBorder
      }
    case TableBorder.EXTERNAL:
      return {
        top: externalBorder,
        bottom: externalBorder,
        left: externalBorder,
        right: externalBorder,
        insideHorizontal: defaultBorder,
        insideVertical: defaultBorder
      }
    case TableBorder.EMPTY:
      return {
        top: emptyBorder,
        bottom: emptyBorder,
        left: emptyBorder,
        right: emptyBorder,
        insideHorizontal: emptyBorder,
        insideVertical: emptyBorder
      }
    default:
      return {
        top: defaultBorder,
        bottom: defaultBorder,
        left: defaultBorder,
        right: defaultBorder,
        insideHorizontal: defaultBorder,
        insideVertical: defaultBorder
      }
  }
}

/**
 * 创建标题段落
 */
function createTitleParagraph(
  element: IElement,
  opts: IEditorOption
): Paragraph | null {
  const titleFontSize =
    element.level === TitleLevel.FIRST
      ? 20
      : element.level === TitleLevel.SECOND
        ? 18
        : element.level === TitleLevel.THIRD
          ? 16
          : element.level === TitleLevel.FOURTH
            ? 15
            : element.level === TitleLevel.FIFTH
              ? 14
              : 12

  const titleChildren = (element.valueList || [])
    .filter(child => child.value && child.value.trim())
    .map(child => {
      const childElement = { ...child }
      childElement.size = titleFontSize
      childElement.bold =
        element.level === TitleLevel.FIRST ||
        element.level === TitleLevel.SECOND
      return convertElementToParagraphChild(childElement, opts)
    })

  if (titleChildren.length === 0) return null

  return new Paragraph({
    alignment: getParagraphAlignment(element.rowFlex),
    spacing: {
      line: Math.round(titleFontSize * (element.rowMargin || 1) * 15),
      lineRule: LineRuleType.EXACT,
      before: 200,
      after: 100
    },
    children: titleChildren
  })
}

/**
 * 创建列表段落数组
 */
function createListParagraphs(
  element: IElement,
  opts: IEditorOption
): Paragraph[] {
  const listFont = element.font || getFont(opts)
  const rawListItems = element.valueList || []

  const listItems = rawListItems
    .flatMap(item => {
      const value = typeof item.value === 'string' ? item.value : ''
      return value.split('\n')
    })
    .map(text => text.trim())
    .filter(Boolean)

  if (listItems.length === 0) return []

  const fontSize = element.size || getFontSize(opts)
  const lineHeight = fontSize * 20 * (element.rowMargin || 1)
  const isOrdered = element.listType === ListType.OL

  return listItems.map(
    text =>
      new Paragraph({
        alignment: getParagraphAlignment(element.rowFlex),
        spacing: {
          line: lineHeight,
          lineRule: LineRuleType.EXACT,
          before: 0,
          after: 0
        },
        bullet: isOrdered ? undefined : { level: 0 },
        numbering: isOrdered
          ? { reference: 'docx-list-numbering', level: 0 }
          : undefined,
        children: [
          new TextRun({
            text,
            size: pxToHalfPoint(fontSize),
            font: listFont
          })
        ]
      })
  )
}

/**
 * 将图片类型的 IElement 节点创建为只包含 ImageRun 的段落对象
 */
function createImageParagraph(
  element: IElement,
  rowHeightTwip?: number
): Paragraph {
  const widthEmu = element.width ?? 100
  const heightEmu = element.height ?? 100
  return new Paragraph({
    alignment: getParagraphAlignment(element.rowFlex),
    spacing: {
      line: rowHeightTwip || 20,
      lineRule: LineRuleType.AT_LEAST,
      before: 0,
      after: 0
    },
    children: [
      new ImageRun({
        data: stripBase64Prefix(element.value),
        transformation: { width: widthEmu, height: heightEmu }
      })
    ]
  })
}

/**
 * 使用指定文本和原始元素样式构建 TextRun 实例
 */
function createStyledTextRun(
  element: IElement,
  opts: IEditorOption,
  text: string
): TextRun {
  const fontSize = element.size || getFontSize(opts)
  return new TextRun({
    text,
    font: element.font || getFont(opts),
    bold: element.bold,
    size: pxToHalfPoint(fontSize),
    color: getTextColor(element.color),
    italics: element.italic,
    strike: element.strikeout,
    shading: element.highlight
      ? { fill: getBorderColor(element.highlight) }
      : undefined,
    superScript: element.type === ElementType.SUPERSCRIPT,
    subScript: element.type === ElementType.SUBSCRIPT,
    underline: element.underline ? {} : undefined
  })
}

/**
 * 将单个 IElement 元素转换为 docx 的 ParagraphChild 节点
 */
function convertElementToParagraphChild(
  element: IElement,
  opts: IEditorOption
): ParagraphChild {
  const fontSize = element.size || getFontSize(opts)
  const font = element.font || getFont(opts)

  // 处理图片元素
  if (element.type === ElementType.IMAGE) {
    return new ImageRun({
      data: stripBase64Prefix(element.value),
      transformation: {
        width: element.width ?? 100,
        height: element.height ?? 100
      }
    })
  }
  // 处理链接元素
  if (element.type === ElementType.HYPERLINK) {
    const hyperlinkText =
      element.valueList?.map(child => child.value).join('') ||
      element.value ||
      ''
    return new ExternalHyperlink({
      children: [
        new TextRun({
          text: hyperlinkText,
          style: 'Hyperlink',
          underline: {},
          font,
          size: pxToHalfPoint(fontSize)
        })
      ],
      link: element.url || ''
    })
  }
  // 处理制表符元素
  if (element.type === ElementType.TAB) {
    return new TextRun({
      children: [new Tab()],
      font,
      size: pxToHalfPoint(fontSize)
    })
  }
  // 处理LaTeX元素
  if (element.type === ElementType.LATEX) {
    return new MathRun(element.value)
  }
  // 处理分页符元素
  if (element.type === ElementType.PAGE_BREAK) {
    return new PageBreak()
  }
  // 处理复选框元素
  if (element.type === ElementType.CHECKBOX) {
    return new CheckBox({ checked: !!element.checkbox?.value })
  }

  if (element.type === ElementType.RADIO) {
    return new TextRun({ text: '⚪ ', size: pxToHalfPoint(fontSize), font })
  }

  // 处理标签元素
  if (element.type === ElementType.LABEL && element.label) {
    const backgroundColor = normalizeColor(element.label.backgroundColor)
    const textColor = normalizeColor(element.label.color)
    return new TextRun({
      text: ` ${element.value || ''} `,
      size: pxToHalfPoint(fontSize),
      font,
      color: textColor,
      shading: backgroundColor ? { fill: backgroundColor } : undefined
    })
  }

  if (element.type === ElementType.CONTROL && element.control) {
    const controlValue = element.control.value
    const textValue = Array.isArray(controlValue)
      ? controlValue.map(c => c.value).join('')
      : controlValue || ''
    return new TextRun({ text: textValue, size: pxToHalfPoint(fontSize), font })
  }

  // 默认：常规文本（带加粗、斜体、下划线等样式）
  return createStyledTextRun(element, opts, element.value || '')
}

/**
 * 将表格单元格内部的行列表转换为 docx 子节点数组
 */
function convertTdRowListToDocxChildren(
  rowList: IRow[],
  opts: IEditorOption
): DocxChildren {
  const children: DocxChildren = []

  for (const row of rowList) {
    const paragraphChild: ParagraphChild[] = []

    const textElementList = row.elementList.filter(
      elem => elem.value !== '\u200B'
    )
    const onlyImageRow =
      textElementList.length === 1 &&
      textElementList[0].type === ElementType.IMAGE

    for (const elem of row.elementList) {
      if (elem.value === '\u200B') continue

      // 图片始终作为块级段落输出，避免被 Exact 行高约束裁剪
      if (elem.type === ElementType.IMAGE && onlyImageRow) {
        children.push(createImageParagraph(elem, pxToTwip(row.height)))
        continue
      }
      if (elem.type === ElementType.IMAGE) {
        // 先刷新前面已有的文本段落
        if (paragraphChild.length > 0) {
          children.push(
            new Paragraph({
              alignment: row.rowFlex
                ? getParagraphAlignment(row.rowFlex)
                : undefined,
              spacing: createSpacing(row.height, 0),
              children: paragraphChild
            })
          )
          paragraphChild.length = 0
        }
        children.push(createImageParagraph(elem, pxToTwip(row.height)))
        continue
      }

      if (elem.type === ElementType.HYPERLINK) {
        paragraphChild.push(convertElementToParagraphChild(elem, opts))
        continue
      }

      if (typeof elem.value === 'string' && elem.value.includes('\n')) {
        const lines = elem.value.split('\n')
        const font = elem.font || getFont(opts)
        const fontSize = elem.size || getFontSize(opts)
        lines.forEach((line, i) => {
          if (i > 0) {
            paragraphChild.push(
              new TextRun({
                text: '',
                break: 1,
                font,
                size: pxToHalfPoint(fontSize)
              })
            )
          }
          paragraphChild.push(createStyledTextRun(elem, opts, line))
        })
      } else {
        paragraphChild.push(convertElementToParagraphChild(elem, opts))
      }
    }

    if (onlyImageRow) continue

    if (paragraphChild.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              font: getFont(opts),
              size: pxToHalfPoint(getFontSize(opts))
            })
          ],
          spacing: onlyImageRow
            ? { before: 0, after: 0 }
            : createSpacing(row.height, 0)
        })
      )
    } else {
      children.push(
        new Paragraph({
          alignment: row.rowFlex
            ? getParagraphAlignment(row.rowFlex)
            : undefined,
          spacing: createSpacing(row.height, 0),
          children: paragraphChild
        })
      )
    }
  }

  return children
}

/**
 * 将表格类型的 IElement 节点转换为 docx Table 对象
 */
function createTable(element: IElement, opts: IEditorOption): Table {
  const {
    trList,
    colgroup,
    borderType,
    borderColor,
    borderWidth,
    borderExternalWidth
  } = element
  const tableRowList: TableRow[] = []
  const columnWidths = colgroup?.map(col => pxToTwip(col.width))

  for (const tr of trList!) {
    const tableCellList: TableCell[] = []
    for (const td of tr.tdList) {
      tableCellList.push(
        new TableCell({
          columnSpan: td.colspan,
          rowSpan: td.rowspan,
          shading: td.backgroundColor
            ? { fill: getBorderColor(td.backgroundColor) }
            : undefined,
          verticalAlign: getCellVerticalAlign(td.verticalAlign),
          width: td.width
            ? { size: pxToTwip(td.width), type: WidthType.DXA }
            : undefined,
          children:
            td.rowList && td.rowList.length > 0
              ? convertTdRowListToDocxChildren(td.rowList, opts)
              : convertElementListToDocxChildren(td.value, opts)
        })
      )
    }
    tableRowList.push(
      new TableRow({
        height: tr.height
          ? { value: pxToTwip(tr.height), rule: HeightRule.ATLEAST }
          : undefined,
        children: tableCellList
      })
    )
  }

  return new Table({
    rows: tableRowList,
    width: { size: '100%', type: WidthType.PERCENTAGE },
    columnWidths,
    borders: getTableBorders(
      borderType,
      borderColor,
      borderWidth,
      borderExternalWidth
    )
  })
}

/** 获取默认字体 */
const getFont = (opts: IEditorOption) => opts.defaultFont || '微软雅黑'

/** 获取默认字号 */
const getFontSize = (opts: IEditorOption) => opts.defaultSize || 16

/** 获取行间距系数 */
const getRowMargin = (opts: IEditorOption) => opts.defaultRowMargin || 1

/** 获取段落间距 */
const getParagraphSpacing = (opts: IEditorOption) =>
  opts.defaultBasicRowMarginHeight || 0

/** 获取分割线宽度 */
const getSeparatorLineWidth = (opts: IEditorOption) =>
  opts.separator?.lineWidth || 1

/** 获取分割线颜色 */
const getSeparatorColor = (opts: IEditorOption) =>
  opts.separator?.strokeStyle || '#000000'

/**
 * 创建段落间距配置（统一间距计算）
 */
function createSpacing(lineHeight: number, paragraphSpacing: number) {
  const halfSpacing = paragraphSpacing > 0 ? pxToTwip(paragraphSpacing / 2) : 0
  return {
    line: pxToTwip(lineHeight),
    lineRule: LineRuleType.EXACT,
    before: halfSpacing,
    after: halfSpacing
  }
}

/**
 * 检查行是否为列表项
 */
function isListRow(row: IRow): boolean {
  const listEls = row.elementList.filter(el => el.listId)
  return listEls.length > 0 && listEls.length === row.elementList.length
}

/**
 * 处理列表行
 */
function processListRow(
  row: IRow,
  children: DocxChildren,
  opts: IEditorOption,
  listCounters: Map<string, number>
) {
  const firstEl = row.elementList.find(el => el.listId)
  if (!firstEl?.listId) return

  const isOrdered = firstEl.listType === ListType.OL
  const order = isOrdered ? (listCounters.get(firstEl.listId) || 0) + 1 : 0
  if (isOrdered) listCounters.set(firstEl.listId, order)

  const prefix = getListPrefix(firstEl, order)
  const fontSize = firstEl.size || getFontSize(opts)

  const listChildren = [
    new TextRun({
      text: prefix,
      size: pxToHalfPoint(fontSize),
      font: firstEl.font || getFont(opts)
    }),
    ...row.elementList
      .filter(el => el.value !== '\u200B')
      .map(el => convertElementToParagraphChild(el, opts))
  ]

  children.push(
    new Paragraph({
      alignment: getParagraphAlignment(row.rowFlex),
      spacing: createSpacing(row.height, getParagraphSpacing(opts)),
      children: listChildren.length
        ? listChildren
        : [
            new TextRun({
              text: prefix,
              font: getFont(opts),
              size: pxToHalfPoint(fontSize)
            })
          ]
    })
  )
}

/**
 * 处理元素并添加到段落子项（处理多行文本）
 */
function addElementToParagraph(
  element: IElement,
  paragraphChild: ParagraphChild[],
  opts: IEditorOption
) {
  if (typeof element.value === 'string' && element.value.includes('\n')) {
    const lines = element.value.split('\n')
    lines.forEach((line, i) => {
      if (i > 0) {
        paragraphChild.push(
          new TextRun({
            text: '',
            break: 1,
            font: element.font || getFont(opts),
            size: pxToHalfPoint(element.size || getFontSize(opts))
          })
        )
      }
      paragraphChild.push(createStyledTextRun(element, opts, line))
    })
  } else {
    paragraphChild.push( convertElementToParagraphChild(element, opts))
  }
}

/**
 * 处理分割线元素
 */
function extractSeparatorInfo(element: IElement, opts: IEditorOption) {
  const lineWidth = element.lineWidth || getSeparatorLineWidth(opts)
  const isDashed = !!(
    element.dashArray?.length &&
    (element.dashArray[0] || element.dashArray[1])
  )
  return {
    lineWidth,
    isDashed,
    borderSize: Math.max(1, Math.round(lineWidth)),
    lineColor: getBorderColor(element.color || getSeparatorColor(opts))
  }
}

/**
 * 处理块级元素（表格、图片、标题、列表）
 */
function processBlockElement(
  element: IElement,
  children: DocxChildren,
  opts: IEditorOption,
  rowHeightTwip: number
): boolean {
  switch (element.type) {
    case ElementType.TABLE:
      if (children[children.length - 1] instanceof Table) {
        children.push(
          new Paragraph({
            spacing: { before: pxToTwip(getParagraphSpacing(opts)), after: 0 },
            children: [
              new TextRun({
                text: '',
                font: getFont(opts),
                size: pxToHalfPoint(getFontSize(opts))
              })
            ]
          })
        )
      }
      children.push(createTable(element, opts))
      return true
    case ElementType.IMAGE:
      children.push(createImageParagraph(element, rowHeightTwip))
      return true
    case ElementType.TITLE: {
      const titlePara = createTitleParagraph(element, opts)
      if (titlePara) children.push(titlePara)
      return true
    }

    case ElementType.LIST:
      children.push(...createListParagraphs(element, opts))
      return true
    default:
      return false
  }
}

/**
 * 将行数据列表转换为 docx 段落或表格子项数组
 */
function convertRowListToDocxChildren(
  rowList: IRow[][],
  editorOptions: IEditorOption
): DocxChildren {
  const children: DocxChildren = []

  for (const pageRowList of rowList) {
    const listCounters = new Map<string, number>()

    for (const row of pageRowList) {
      if (row.isPageBreak) {
        children.push(new Paragraph({ children: [new PageBreak()] }))
        listCounters.clear()
        continue
      }

      if (isListRow(row)) {
        processListRow(row, children, editorOptions, listCounters)
        continue
      }

      // 处理普通行
      const paragraphChild: ParagraphChild[] = []
      let separatorInfo: ReturnType<typeof extractSeparatorInfo> | null = null

      for (const element of row.elementList) {
        if (
          processBlockElement(
            element,
            children,
            editorOptions,
            pxToTwip(row.height)
          )
        ) {
          continue
        }

        if (element.type === ElementType.SEPARATOR) {
          separatorInfo = extractSeparatorInfo(element, editorOptions)
          continue
        }

        addElementToParagraph(element, paragraphChild, editorOptions)
      }

      // 输出段落
      if (paragraphChild.length === 0 && !separatorInfo) continue

      if (separatorInfo && paragraphChild.length === 0) {
        children.push(
          new Paragraph({
            spacing: { before: 0, after: 0, line: 1 },
            border: {
              bottom: {
                color: separatorInfo.lineColor,
                space: 1,
                style: separatorInfo.isDashed
                  ? BorderStyle.DASHED
                  : BorderStyle.SINGLE,
                size: separatorInfo.borderSize
              }
            },
            children: [new TextRun({ text: '' })]
          })
        )
      } else {
        children.push(
          new Paragraph({
            alignment: getParagraphAlignment(row.rowFlex),
            spacing: createSpacing(
              row.height,
              getParagraphSpacing(editorOptions)
            ),
            border: separatorInfo
              ? {
                  bottom: {
                    color: separatorInfo.lineColor,
                    space: 1,
                    style: separatorInfo.isDashed
                      ? BorderStyle.DASHED
                      : BorderStyle.SINGLE,
                    size: separatorInfo.borderSize
                  }
                }
              : undefined,
            children: paragraphChild
          })
        )
      }
    }
  }

  return children
}

/**
 * 计算元素的行间距配置
 */
function createElementSpacing(element: IElement, opts: IEditorOption): any {
  const fontSize = element.size || getFontSize(opts)
  const rowMargin = element.rowMargin || getRowMargin(opts)
  const spacing = {
    line: Math.round(fontSize * rowMargin * 15),
    lineRule: LineRuleType.EXACT
  }

  if (element.rowMargin != null) {
    const margin = getParagraphSpacing(opts) * element.rowMargin
    if (margin > 0) {
      return {
        ...spacing,
        before: pxToTwip(margin / 2),
        after: pxToTwip(margin / 2)
      }
    }
  }

  return spacing
}

/**
 * 将行元素列表转换为 docx 段落或表格子项数组
 */
const convertElementListToDocxChildren = (
  elementList: IElement[],
  editorOptions: IEditorOption
): DocxChildren => {
  const children: DocxChildren = []
  let paragraphChild: ParagraphChild[] = []
  let paragraphAlignment: DocxAlignment | undefined
  let paragraphSpacing: ReturnType<typeof createElementSpacing> | undefined | any

  const flushParagraph = () => {
    if (paragraphChild.length > 0) {
      children.push(
        new Paragraph({
          alignment: paragraphAlignment,
          spacing: paragraphSpacing,
          children: paragraphChild
        })
      )
    }
    paragraphChild = []
    paragraphAlignment = undefined
    paragraphSpacing = undefined
  }

  for (const element of elementList) {
    // 块级元素：先刷出暂存段落，再直接推入
    switch (element.type) {
      case ElementType.TITLE:
        flushParagraph()
        {
          const p = createTitleParagraph(element, editorOptions)
          if (p) children.push(p)
        }
        continue
      case ElementType.LIST:
        flushParagraph()
        children.push(...createListParagraphs(element, editorOptions))
        continue
      case ElementType.TABLE:
        flushParagraph()
        children.push(createTable(element, editorOptions))
        continue
      case ElementType.SEPARATOR:
        continue
      case ElementType.IMAGE:
        flushParagraph()
        children.push(
          createImageParagraph(
            element,
            createElementSpacing(element, editorOptions).line
          )
        )
        continue
      case ElementType.BLOCK:
        if (element.block) {
          flushParagraph()
          children.push(
            ...convertElementListToDocxChildren(
              element.valueList || [],
              editorOptions
            )
          )
        }
        continue
      case ElementType.AREA:
        if (element.valueList) {
          flushParagraph()
          children.push(
            ...convertElementListToDocxChildren(
              element.valueList,
              editorOptions
            )
          )
        }
        continue
      case ElementType.DATE:
        paragraphChild.push(
          ...(element.valueList?.map(c =>
            convertElementToParagraphChild(c, editorOptions)
          ) || [])
        )
        continue
    }

    // 行内元素：设置段落对齐/间距（只取首元素的）
    if (paragraphChild.length === 0) {
      paragraphAlignment = getParagraphAlignment(element.rowFlex)
      paragraphSpacing = createElementSpacing(element, editorOptions)
    }

    // 处理首部换行
    if (/^\n/.test(element.value)) {
      const match = element.value.match(/^\n+/)
      if (match) {
        flushParagraph()
        for (let i = 1; i < match[0].length; i++) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  font: getFont(editorOptions),
                  size: pxToHalfPoint(
                    element.size || getFontSize(editorOptions)
                  )
                })
              ],
              spacing: createElementSpacing(element, editorOptions)
            })
          )
        }
      }
      element.value = element.value.replace(/^\n+/, '')
    }

    if (!element.value) {
      flushParagraph()
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              font: getFont(editorOptions),
              size: pxToHalfPoint(getFontSize(editorOptions))
            })
          ],
          spacing: createElementSpacing(element, editorOptions)
        })
      )
    } else if (element.value === '\u200B') {
      flushParagraph()
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              font: getFont(editorOptions),
              size: pxToHalfPoint(getFontSize(editorOptions))
            })
          ],
          spacing: createElementSpacing(element, editorOptions)
        })
      )
    } else {
      addElementToParagraph(element, paragraphChild, editorOptions)
    }
  }

  flushParagraph()
  return children
}
/**
 * 合并因分页被拆分的表格
 * 同一源表格的拆分片段通过 pagingId 关联，导出时需合并为完整表格
 * @param pageRowList 分页行数据列表
 */
function mergeSplitTables(pageRowList: IRow[][]): void {
  // 定义表格引用的位置结构，对应页索引、行索引、元素索引
  type TableRef = { pageIndex: number; rowIndex: number; elementIndex: number }
  const tableGroups = new Map<string, TableRef[]>()

  // 阶段一：按 pagingId 分组收集所有被拆分的表格片段（遍历所有页面和行）
  for (let pi = 0; pi < pageRowList.length; pi++) {
    const rowList = pageRowList[pi]
    for (let ri = 0; ri < rowList.length; ri++) {
      const elementList = rowList[ri].elementList
      for (let ei = 0; ei < elementList.length; ei++) {
        const el = elementList[ei]
        if (el.type === ElementType.TABLE && el.pagingId) {
          const refs = tableGroups.get(el.pagingId) || []
          refs.push({ pageIndex: pi, rowIndex: ri, elementIndex: ei })
          tableGroups.set(el.pagingId, refs)
        }
      }
    }
  }

  // 阶段二：为每组表格片段生成合并后的完整表格，只替换首位，暂不删除后续片段（防止删除引起索引移位）
  for (const [, refs] of tableGroups) {
    if (refs.length <= 1) continue

    const ref = refs[0]
    const elementList = pageRowList[ref.pageIndex][ref.rowIndex].elementList
    const baseTable = structuredClone(elementList[ref.elementIndex]) as IElement
    const allTrList: any[] = [...(baseTable.trList || [])]
    let totalHeight = baseTable.height || 0

    // 收集后续所有表格片段的行（跳过重复的表头/标题行）
    for (let i = 1; i < refs.length; i++) {
      const r = refs[i]
      const nextEls = pageRowList[r.pageIndex][r.rowIndex].elementList
      const nextTable = nextEls[r.elementIndex]
      const nextTr = (nextTable.trList || []).filter(
        (tr: any) => !tr.pagingRepeat
      )
      allTrList.push(...nextTr)
      totalHeight += nextTable.height || 0
    }

    // 合并跨页拆分但属于同一原始行的行（通过 originalRowIndex 标识）
    const trMap = new Map<number, any[]>()
    const unindexedTrs: any[] = []
    for (const tr of allTrList) {
      if (tr.originalRowIndex != null) {
        const idx = tr.originalRowIndex
        if (!trMap.has(idx)) trMap.set(idx, [])
        trMap.get(idx)!.push(tr)
      } else {
        unindexedTrs.push(tr)
      }
    }

    const tdFragmentMap = new Map<
      string,
      { rowIndex: number; tdIndex: number; fragments: any[] }
    >()
    for (const tr of allTrList) {
      tr.tdList.forEach((td: any, tdIndex: number) => {
        const rowIndex = td.originalRowIndex ?? tr.originalRowIndex ?? 0
        const originalTdIndex = td.originalTdIndex ?? tdIndex
        const key = td.originalTdId || `${rowIndex}_${originalTdIndex}`
        let fragmentInfo = tdFragmentMap.get(key)
        if (!fragmentInfo) {
          fragmentInfo = {
            rowIndex,
            tdIndex: originalTdIndex,
            fragments: []
          }
          tdFragmentMap.set(key, fragmentInfo)
        }
        fragmentInfo.fragments.push(td)
      })
    }

    const mergedTrList: any[] = []
    trMap.forEach((trs, rowIndex) => {
      const mergedTr = structuredClone(trs[0])
      mergedTr.tdList = Array.from(tdFragmentMap.values())
        .filter(fragmentInfo => fragmentInfo.rowIndex === rowIndex)
        .sort((a, b) => a.tdIndex - b.tdIndex)
        .map(fragmentInfo => {
          const fragments = fragmentInfo.fragments.sort(
            (a, b) =>
              (a.pagingFragmentIndex ?? 0) - (b.pagingFragmentIndex ?? 0)
          )
          const td = structuredClone(fragments[0])
          td.rowspan = td.originalRowspan ?? td.rowspan
          td.value = []
          td.rowList = []
          fragments.forEach(fragment => {
            if (fragment.value) td.value.push(...fragment.value)
            if (fragment.rowList) td.rowList.push(...fragment.rowList)
          })
          return td
        })
      mergedTrList.push(mergedTr)
    })
    mergedTrList.push(...unindexedTrs)

    // 重新根据 originalRowIndex 升序排序
    mergedTrList.sort((a: any, b: any) => {
      const ai = a.originalRowIndex
      const bi = b.originalRowIndex
      if (ai == null && bi == null) return 0
      if (ai == null) return 1
      if (bi == null) return -1
      return ai - bi
    })

    baseTable.trList = mergedTrList
    baseTable.height = totalHeight
    baseTable.pagingId = ''
    baseTable.pagingIndex = undefined

    // 仅替换首位的表格为完整的大表格，不改动数组长度
    pageRowList[ref.pageIndex][ref.rowIndex].elementList[ref.elementIndex] =
      baseTable as any
  }

  // 阶段三：统一删除所有片段组的非首位引用（从后往前删，避免数组前移导致索引错乱）
  const allRemoveRefs: TableRef[] = []
  for (const [, refs] of tableGroups) {
    if (refs.length <= 1) continue
    for (let i = 1; i < refs.length; i++) {
      allRemoveRefs.push(refs[i])
    }
  }
  allRemoveRefs.sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) return b.pageIndex - a.pageIndex
    if (a.rowIndex !== b.rowIndex) return b.rowIndex - a.rowIndex
    return b.elementIndex - a.elementIndex
  })
  for (const r of allRemoveRefs) {
    pageRowList[r.pageIndex][r.rowIndex].elementList.splice(r.elementIndex, 1)
  }
}

export type CommandWithExportDocx = Command & {
  executeExportDocx(options: IExportDocxOption): Promise<void> |  Promise<Blob>
}

/**
 * 导出 Docx 插件的主入口工厂函数
 * @param command 编辑器的 Command 实例，用于读取编辑器内部的数据及配置
 * @returns 导出函数 executeExportDocx
 */
export default function createExportDocx(command: Command) {
  /**
   * 执行导出为 .docx 文件的核心逻辑
   * @param options 导出选项，包含文件名及导出文件形式
   */
  return function executeExportDocx(options: IExportDocxOption) {
    const { fileName, isFile = true } = options

    // 获取编辑器的基础页眉、页脚数据及编辑器选项
    const {
      data: { header, footer },
      options: editorOptions
    } = command.getValue()

    // 深度克隆整个文档的行数据，避免导出修改影响原画布渲染
    const pageRowList = deepClone(command.getPageRowList() || [])

    console.log(deepClone(pageRowList))

    // 合并因分页被拆分的表格
    mergeSplitTables(pageRowList)

    // 1. 转换文档主体内容
    const mainChildren = convertRowListToDocxChildren(
      pageRowList,
      editorOptions
    )
    if (mainChildren.length === 0) {
      // 若无任何正文，默认注入一个空的占位段落，防 Office 打开报错
      mainChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '',
              font: editorOptions.defaultFont,
              size: editorOptions.defaultSize
            })
          ]
        })
      )
    }

    // 2. 转换页眉内容
    const headerChildren = convertElementListToDocxChildren(
      header || [],
      editorOptions
    )

    // 3. 转换页脚内容
    const footerChildren = convertElementListToDocxChildren(
      footer || [],
      editorOptions
    )

    // 创建并配置 docx 实例
    const doc = new Document({
      // 注册全局列表 numbering 配置，供有序列表使用
      numbering: {
        config: [
          {
            reference: 'docx-list-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.START
              }
            ]
          }
        ]
      },
      sections: [
        {
          headers:
            headerChildren.length > 0
              ? {
                  default: new Header({ children: headerChildren })
                }
              : undefined,
          footers:
            footerChildren.length > 0
              ? {
                  default: new Footer({ children: footerChildren })
                }
              : undefined,
          children: mainChildren
        }
      ]
    })

    // 是否直接导出文件
    if (isFile) {
      return Packer.toBlob(doc).then(blob => saveAs(blob, `${fileName}.docx`))
    } else {
      return Packer.toBlob(doc)
    }
  }
}
