import {
  ControlType,
  ElementType,
  IElement,
  ListType,
  RowFlex,
  TextDirection,
  TitleLevel
} from './editor'

const RTL = TextDirection.RTL
const LTR = TextDirection.LTR
const START = RowFlex.START

/** RTL 正文片段；调用方在完整段落结束处显式换行。 */
function p(value: string, extra: Partial<IElement> = {}): IElement[] {
  return [
    {
      value,
      size: 16,
      direction: RTL,
      rowFlex: START,
      ...extra
    }
  ]
}

/**
 * 表格示例序号：数字+句点按 LTR 岛排版，避免 RTL 段内变成「.١」。
 * 表外壳仍可 direction:RTL 做列镜像，与中文 demo 结构对照。
 */
function tableNum(label: string): IElement[] {
  return [{ value: label, size: 16, direction: LTR }]
}

/**
 * 标题 + 段末换行（对齐中文 mock：`标题：\\n正文`）。
 * 若标题后不换行，会与后随正文/控件拼进同一 BiDi 段落，导致 RTL 混排错乱。
 */
function title(value: string): IElement[] {
  return [
    {
      value: '',
      type: ElementType.TITLE,
      level: TitleLevel.FIRST,
      direction: RTL,
      valueList: [
        {
          value,
          size: 18,
          direction: RTL,
          rowFlex: START
        }
      ]
    },
    { value: '\n', direction: RTL }
  ]
}

/**
 * 与官网中文门诊病历结构对齐的完整阿语 RTL 病历：
 * 标题段 → 控件/超链/列表/表 → checkbox/公式/日期/标签/签名线 → 级联/BMI → 【签名图】→ EOF
 * @param signatureSrc 与中文 demo 相同的签名图 dataURL（保持结构一致）
 */
export function buildArabicEmrElementList(signatureSrc: string): IElement[] {
  const list: IElement[] = []

  // —— 主诉 ——
  list.push(...title('الشكوى الرئيسية:'))
  list.push(
    ...p('حمى لمدة ثلاثة أيام وسعال لمدة خمسة أيام. '),
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '1',
        type: ControlType.TEXT,
        value: null,
        placeholder: 'ملاحظات إضافية',
        prefix: '{',
        postfix: '}'
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— 现病史 ——
  list.push(...title('التاريخ المرضي الحالي:'))
  list.push(
    ...p(
      'بدأ المريض قبل ثلاثة أيام دون سبب واضح بأعراض زكام، ثم ظهر وذمة في الوجه دون طفح جلدي، مع قلة البول وإرهاق. لم يتحسن بالعلاج الخارجي، فحضر إلى مستشفانا.'
    ),
    { value: '\n', direction: RTL }
  )

  // —— 既往史 ——
  list.push(...title('التاريخ المرضي السابق:'))
  list.push(
    ...p('سكري منذ ١٠ سنوات، وارتفاع ضغط الدم منذ سنتين، و'),
    {
      value: 'مرض معدٍ',
      color: '#FF0000',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    ...p(' منذ سنة. يرجى ذكر أمراض سابقة أخرى. '),
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '2',
        type: ControlType.SELECT,
        value: null,
        code: null,
        placeholder: 'نعم/لا',
        prefix: '{',
        postfix: '}',
        valueSets: [
          { value: 'نعم', code: '98175' },
          { value: 'لا', code: '98176' },
          { value: 'غير معروف', code: '98177' }
        ]
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— 流行病史 ——
  list.push(...title('التاريخ الوبائي:'))
  list.push(
    ...p(
      'ينفي خلال ١٤ يوماً مخالطة مرضى مؤكدين أو مشتبهين أو عديمي الأعراض ومخالطيهم؛ وينفي زيارة الأسواق أو المتاجر الكبرى؛ وينفي أعراض حمى أو تنفسية. المرافقون كذلك. بخصوص '
    ),
    {
      type: ElementType.HYPERLINK,
      value: '',
      direction: RTL,
      valueList: [
        { value: 'ك', size: 16, direction: RTL },
        { value: 'و', size: 16, direction: RTL },
        { value: 'ف', size: 16, direction: RTL },
        { value: 'ي', size: 16, direction: RTL },
        { value: 'د', size: 16, direction: RTL },
        { value: '-', size: 16, direction: RTL },
        { value: '١', size: 16, direction: RTL },
        { value: '٩', size: 16, direction: RTL }
      ],
      url: 'https://hufe.club/canvas-editor'
    },
    { value: '.\n', direction: RTL }
  )

  // —— 体格检查 ——
  // 生命体征含拉丁缩写/单位：整段 LTR，避免 RTL 段内被排成「℃٣٩.٥ :T」
  list.push(...title('الفحص السريري:'))
  list.push(
    {
      value: 'T: ٣٩.٥℃، P: ٨٠bpm، R: ٢٠/د، BP: ١٢٠/٨٠mmHg؛',
      size: 16,
      direction: LTR,
      rowFlex: START
    },
    { value: '\n', direction: RTL }
  )

  // —— 辅助检查 ——
  list.push(...title('الفحوصات المساعدة:'))
  list.push(
    ...p('٢٠٢٠-٠٦-١٠، الدم: '),
    {
      value: 'هيماتوكريت',
      highlight: '#F2F27F',
      // 与中文「血细胞比容」批注区分，各自对应独立悬浮窗
      groupIds: ['2'],
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    ...p(' ٣٦.٥٠٪ (منخفض) ٤٠～٥٠؛ وحيدات ٠.٧٥×١٠/ل (مرتفع) مرجع: ٠.١～٠.٦؛'),
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '6',
        type: ControlType.TEXT,
        value: null,
        placeholder: 'محتوى',
        preText: 'أخرى: ',
        postText: '.'
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— 门诊诊断 ——
  list.push(...title('تشخيص العيادة:'))
  list.push(
    {
      value: '',
      type: ElementType.LIST,
      listType: ListType.OL,
      direction: RTL,
      rowFlex: START,
      valueList: [
        {
          value:
            'ارتفاع ضغط الدم\nالسكري\nنزلة فيروسية\nالتهاب الأنف التحسسي\nسليلة أنفية تحسسية',
          direction: RTL,
          rowFlex: START
        }
      ]
    },
    { value: '\n', direction: RTL }
  )

  // —— 处置治疗 ——
  list.push(...title('الخطة العلاجية:'))
  list.push(
    {
      value: '',
      type: ElementType.LIST,
      listType: ListType.OL,
      direction: RTL,
      rowFlex: START,
      valueList: [
        {
          value:
            'بزل الغدة الدرقية بالإبرة الدقيقة تحت التوجيه بالموجات فوق الصوتية؛\nقياس أضداد سطح التهاب الكبد ب؛\nجمع الخلايا المرضية الغشائية، الطبقة تحت الجلد في الرقبة الخلفية؛',
          direction: RTL,
          rowFlex: START
        }
      ]
    },
    { value: '\n', direction: RTL }
  )

  // —— 表格（结构同中文 demo；表壳 RTL 镜像，单元格序号 LTR） ——
  list.push({
    type: ElementType.TABLE,
    value: '',
    direction: RTL,
    colgroup: [
      { width: 180 },
      { width: 80 },
      { width: 130 },
      { width: 130 }
    ],
    trList: [
      {
        height: 40,
        tdList: [
          {
            colspan: 1,
            rowspan: 2,
            value: tableNum('١.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٢.')
          },
          {
            colspan: 2,
            rowspan: 1,
            value: tableNum('٣.')
          }
        ]
      },
      {
        height: 40,
        tdList: [
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٤.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٥.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٦.')
          }
        ]
      },
      {
        height: 40,
        tdList: [
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٧.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٨.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('٩.')
          },
          {
            colspan: 1,
            rowspan: 1,
            value: tableNum('١٠.')
          }
        ]
      }
    ]
  })

  // —— checkbox ——
  list.push(
    {
      value: 'هل توافق على المحتوى أعلاه: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      direction: RTL,
      control: {
        conceptId: '3',
        type: ControlType.CHECKBOX,
        code: '98175',
        value: null,
        valueSets: [
          { value: 'موافق', code: '98175' },
          { value: 'رافض', code: '98176' }
        ]
      },
      value: ''
    },
    { value: '\n', direction: RTL }
  )

  // —— LaTeX ——
  list.push(
    {
      value: 'صيغة طبية: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      value: `{E_k} = hv - {W_0}`,
      type: ElementType.LATEX
    },
    { value: '\n', direction: RTL }
  )

  // —— 日期 ——
  list.push(
    {
      value: 'تاريخ التوقيع: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '5',
        type: ControlType.DATE,
        value: [{ value: '2022-08-10 17:30:01' }],
        placeholder: 'تاريخ التوقيع'
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— Label ——
  list.push(
    {
      value: 'وسم التشخيص: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.LABEL,
      value: 'ارتفاع ضغط الدم',
      labelId: 'l1-ar',
      size: 14,
      direction: RTL
    },
    { value: '\n', direction: RTL }
  )

  // —— 签名下划线 ——
  list.push(
    {
      value: 'توقيع المريض: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '4',
        type: ControlType.TEXT,
        value: null,
        placeholder: '',
        prefix: '\u200c',
        postfix: '\u200c',
        minWidth: 160,
        underline: true
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— 就诊次数 ——
  list.push(
    {
      value: 'عدد الزيارات: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: '7',
        type: ControlType.NUMBER,
        value: null,
        placeholder: 'عدد الزيارات',
        prefix: '{',
        postfix: '}',
        numberExclusiveOptions: { calculatorDisabled: false }
      }
    }
  )

  // —— 级联 ——
  list.push(
    {
      value: '\nهل يوجد ارتفاع ضغط: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'hypertension',
        type: ControlType.SELECT,
        value: null,
        code: null,
        placeholder: 'نعم/لا',
        prefix: '{',
        postfix: '}',
        valueSets: [
          { value: 'نعم', code: '1' },
          { value: 'لا', code: '0' }
        ],
        cascade: [
          {
            expression: "getValue(@self) == '1'",
            actions: [
              {
                conceptId: 'hypertensionLevel',
                effects: { required: true }
              }
            ]
          }
        ]
      }
    },
    {
      value: '، الدرجة: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'hypertensionLevel',
        type: ControlType.SELECT,
        value: null,
        code: null,
        placeholder: 'الدرجة',
        prefix: '{',
        postfix: '}',
        valueSets: [
          { value: 'Ⅰ', code: '1' },
          { value: 'Ⅱ', code: '2' },
          { value: 'Ⅲ', code: '3' }
        ]
      }
    }
  )

  // —— BMI ——
  list.push(
    {
      value: '\nالطول: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'height',
        type: ControlType.NUMBER,
        value: null,
        placeholder: 'الطول',
        prefix: '{',
        postfix: '}',
        required: true,
        validation: { min: 0, max: 300 }
      }
    },
    {
      value: 'cm',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      value: '، الوزن: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'weight',
        type: ControlType.NUMBER,
        value: null,
        placeholder: 'الوزن',
        prefix: '{',
        postfix: '}'
      }
    },
    {
      value: 'kg',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      value: '، BMI: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'bmi',
        type: ControlType.NUMBER,
        value: null,
        placeholder: 'تلقائي',
        disabled: true,
        prefix: '{',
        postfix: '}',
        compute:
          "round(getValue('weight') / ((getValue('height') * getValue('height')) / 10000), 2)",
        cascade: [
          {
            expression: 'getValue(@self) > 28',
            actions: [
              {
                conceptId: 'obesityTip',
                effects: { required: true }
              }
            ]
          }
        ]
      }
    },
    {
      value: '، اقتراح التدخل: ',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      type: ElementType.CONTROL,
      value: '',
      direction: RTL,
      control: {
        conceptId: 'obesityTip',
        type: ControlType.TEXT,
        value: null,
        placeholder: 'اقتراح',
        prefix: '{',
        postfix: '}'
      }
    },
    { value: '\n', direction: RTL }
  )

  // —— 电子签名（结构同中文：【签名图】同行） / 其他记录 ——
  list.push(...title('التوقيع الإلكتروني:'))
  list.push(
    {
      value: '【',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    {
      value: signatureSrc,
      width: 89,
      height: 32,
      id: 'signature-ar',
      type: ElementType.IMAGE,
      direction: RTL
    },
    {
      value: '】',
      size: 16,
      direction: RTL,
      rowFlex: START
    },
    { value: '\n', direction: RTL }
  )
  list.push(...title('سجلات أخرى:'))
  list.push(
    ...p(
      'ملخص التواصل: أشعر بالحمى والسعال منذ ثلاثة أيام. Fever / حمى — T ٣٩.٥℃.'
    )
  )

  // EOF
  list.push(
    { value: '\n', direction: RTL },
    { value: '', type: ElementType.TAB },
    { value: 'E', size: 16, direction: RTL },
    { value: 'O', size: 16, direction: RTL },
    { value: 'F', size: 16, direction: RTL }
  )

  return list
}

export const arHeader: IElement[] = [
  {
    value: 'مستشفى الشعب الأول',
    size: 32,
    direction: RTL,
    rowFlex: RowFlex.CENTER
  },
  {
    value: '\nالسجل الطبي للعيادات الخارجية',
    size: 18,
    direction: RTL,
    rowFlex: RowFlex.CENTER
  },
  {
    value: '\n',
    type: ElementType.SEPARATOR
  }
]

export const arFooter: IElement[] = [
  {
    value: 'canvas-editor',
    size: 12,
    direction: RTL,
    rowFlex: RowFlex.CENTER
  }
]
