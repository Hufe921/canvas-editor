import {
  ControlType,
  ElementType,
  ListType,
  RowFlex,
  TextDirection,
  TitleLevel
} from './editor'
import type { IElement } from './editor'
import type { IControl } from './editor/interface/Control'

const paragraph = (
  value: string,
  extra: Partial<IElement> = {}
): IElement[] => [
  { value, size: 16, ...extra },
  { value: '\n', ...extra }
]

function heading(value: string, direction = TextDirection.LTR): IElement[] {
  return [
    {
      type: ElementType.TITLE,
      value: '',
      level: TitleLevel.FIRST,
      direction,
      valueList: [{ value, size: 20, bold: true, direction }]
    },
    { value: '\n', direction }
  ]
}

function control(
  conceptId: string,
  type: ControlType,
  properties: Partial<IControl> = {},
  direction = TextDirection.LTR
): IElement {
  return {
    type: ElementType.CONTROL,
    value: '',
    direction,
    control: {
      conceptId,
      type,
      value: null,
      prefix: '〔',
      postfix: '〕',
      ...properties
    }
  }
}

const picnicImage =
  'data:image/svg+xml,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="150" viewBox="0 0 440 150">
  <rect width="440" height="150" rx="16" fill="#e9f4ee"/>
  <circle cx="370" cy="35" r="19" fill="#f4cb68"/>
  <path d="M0 105Q90 65 180 105T440 90V150H0Z" fill="#a5c9a8"/>
  <path d="M100 105L290 105L325 140H70Z" fill="#ec9b83"/>
  <path d="M140 105L130 140M190 105V140M240 105L252 140M85 123H308" stroke="#fff0dd" stroke-width="5"/>
  <rect x="175" y="80" width="55" height="35" rx="7" fill="#b58250"/>
  <path d="M185 81V74a17 17 0 0 1 34 0V81" fill="none" stroke="#8c6039" stroke-width="5"/>
  <circle cx="255" cy="100" r="10" fill="#d66c50"/>
  <path d="M45 100V62M30 75L45 47L61 75Z" fill="#6b9b73" stroke="#6b9b73" stroke-width="5"/>
</svg>`)

const schedule = [
  ['时间', '一起做什么', '集合地点', '温馨提醒'],
  ['10:00–10:30', '签到、铺野餐垫', '公园南门草坪', '自带水杯，先找好树荫'],
  ['10:30–11:30', '散步与自然观察', '沿河步道', '孩子和家长结伴同行'],
  ['11:30–13:00', '分享午餐、交换食谱', '草坪休息区', '为自制食物写上配料'],
  ['13:00–14:30', '旧书、玩具与闲置物交换', '树下长桌', '带来干净、完整的物品'],
  [
    '14:30–15:00',
    '整理场地、合影返程',
    '草坪休息区',
    '垃圾分类，确认物品无遗漏'
  ]
]

export const zhData: IElement[] = [
  ...paragraph('周末邻里野餐计划', {
    size: 28,
    bold: true,
    rowFlex: RowFlex.CENTER
  }),
  ...paragraph('一起散步、分享午餐，让闲置的好东西遇见新主人。', {
    color: '#527568',
    rowFlex: RowFlex.CENTER,
    spacingAfter: 12
  }),
  ...paragraph(
    '我们约在 10 月 24 日上午十点，到河畔公园南门集合。每家带一道方便分享的食物，也欢迎带上读完的书、闲置的玩具和一段最近的生活故事。'
  ),
  {
    type: ElementType.IMAGE,
    value: picnicImage,
    width: 440,
    height: 150,
    imgCaption: { value: '留一块草地，坐下来聊聊最近的生活。', size: 12 }
  },
  { value: '\n' },
  ...heading('一、先把周末留给自己'),
  { value: '报名姓名：' },
  control('participantName', ControlType.TEXT, {
    value: [{ value: '小林一家' }],
    placeholder: '怎么称呼你',
    required: true
  }),
  { value: '　参加人数：' },
  control('participantCount', ControlType.NUMBER, {
    value: [{ value: '3' }],
    placeholder: '人数',
    validation: { min: 1, max: 20 },
    required: true
  }),
  ...paragraph(' 人'),
  { value: '活动日期：' },
  control('activityDate', ControlType.DATE, {
    value: [{ value: '2026-10-24' }],
    dateFormat: 'yyyy-MM-dd',
    placeholder: '选择日期'
  }),
  { value: '　最想参加：' },
  control('favoriteActivity', ControlType.SELECT, {
    code: 'picnic',
    placeholder: '选择活动',
    valueSets: [
      { code: 'picnic', value: '草坪野餐' },
      { code: 'walk', value: '沿河散步' },
      { code: 'swap', value: '旧物交换' }
    ]
  }),
  { value: '\n' },
  { value: '到达方式：' },
  control('transport', ControlType.RADIO, {
    code: 'walk',
    valueSets: [
      { code: 'walk', value: '步行' },
      { code: 'bike', value: '骑车' },
      { code: 'bus', value: '公共交通' }
    ]
  }),
  { value: '\n' },
  { value: '我能带来：' },
  control('packing', ControlType.CHECKBOX, {
    code: 'water,mat',
    valueSets: [
      { code: 'water', value: '饮用水' },
      { code: 'mat', value: '野餐垫' },
      { code: 'fruit', value: '水果' },
      { code: 'bags', value: '分类垃圾袋' }
    ]
  }),
  { value: '\n' },
  { value: '是否带宠物：' },
  control('bringPet', ControlType.SELECT, {
    code: 'no',
    placeholder: '请选择',
    valueSets: [
      { code: 'yes', value: '会带' },
      { code: 'no', value: '不带' }
    ],
    cascade: [
      {
        expression: "getValue(@self) == 'yes'",
        actions: [{ conceptId: 'petPlan', effects: { required: true } }]
      }
    ]
  }),
  { value: '　牵引与饮水安排：' },
  control('petPlan', ControlType.TEXT, {
    placeholder: '带宠物时请补充',
    minWidth: 150
  }),
  { value: '\n' },
  ...paragraph('如遇下雨，我们会在邻里群里商量改期。'),
  { value: '请在出发前一天' },
  { value: '确认天气和集合时间', highlight: '#fff1b8', groupIds: ['1'] },
  ...paragraph('，临时有事也请在群里说一声。'),
  ...heading('二、当天安排'),
  {
    type: ElementType.TABLE,
    value: '',
    colgroup: [75, 165, 130, 184].map(width => ({ width })),
    trList: schedule.map((cells, row) => ({
      height: row === 0 ? 36 : 48,
      tdList: cells.map(value => ({
        colspan: 1,
        rowspan: 1,
        ...(row === 0 ? { backgroundColor: '#e9f4ee' } : {}),
        value: [{ value, size: 14, bold: row === 0 }]
      }))
    }))
  },
  { value: '\n' },
  ...heading('三、采购与分工'),
  ...paragraph(
    '食物以各家自带为主，公用饮水、纸巾和收纳袋一起采购，活动结束后按实际支出结算。'
  ),
  { value: '每人预留预算：' },
  control('perPersonBudget', ControlType.NUMBER, {
    value: [{ value: '20' }],
    placeholder: '每人预算',
    validation: { min: 0, max: 200 }
  }),
  { value: ' 元　这一家的预算：' },
  control('householdBudget', ControlType.NUMBER, {
    value: [{ value: '60' }],
    placeholder: '自动计算',
    compute: "getValue('participantCount') * getValue('perPersonBudget')"
  }),
  ...paragraph(' 元（人数 × 每人预留预算）'),
  {
    type: ElementType.LIST,
    value: '',
    listType: ListType.OL,
    valueList: [
      {
        value:
          '周五晚上在群里确认人数与分工。\n出门前清洗水果，把需要冷藏的食物放进保冷袋。\n到场后先摆好公共物资，再开始自由活动。'
      }
    ]
  },
  { value: '\n' },
  ...paragraph('收纳清单', { bold: true }),
  {
    type: ElementType.LIST,
    value: '',
    listType: ListType.UL,
    valueList: [
      {
        value:
          '每人一个可重复使用的水杯。\n带回家的餐盒、餐具与野餐垫。\n写有姓名的小卡片，避免拿错物品。'
      }
    ]
  },
  { value: '\n' },
  { value: '一张野餐垫大约占 3 m' },
  { value: '2', type: ElementType.SUPERSCRIPT },
  { value: '；尽量步行或骑车，为周末少留一点 CO' },
  { value: '2', type: ElementType.SUBSCRIPT },
  ...paragraph('。'),
  ...paragraph('如果大家一起买了水果和饮料，可以这样均摊公共费用：'),
  { type: ElementType.LATEX, value: 'C = \\frac{F + D}{N}' },
  ...paragraph('F 为水果费用，D 为饮料费用，N 为参与人数，C 为每人分摊金额。'),
  { value: '活动标签：' },
  { type: ElementType.LABEL, value: '亲子友好', labelId: 'family', size: 14 },
  { value: '　' },
  { type: ElementType.LABEL, value: '自带餐具', labelId: 'reusable', size: 14 },
  ...paragraph('　慢慢走，不赶时间。'),
  { value: '给组织者留言：' },
  control('organizerMessage', ControlType.TEXT, {
    placeholder: '例如：我能提前到场帮忙铺垫子',
    preText: '想说的话：',
    postText: '。'
  }),
  { value: '\n' },
  { value: '报名确认：' },
  control('confirmation', ControlType.TEXT, {
    value: null,
    placeholder: '签名或昵称',
    minWidth: 160,
    underline: true
  }),
  { value: '\n' },
  { value: '有问题可以联系：' },
  {
    type: ElementType.HYPERLINK,
    value: '',
    url: 'mailto:weekend@example.com',
    valueList: [{ value: '邻里活动小组' }]
  },
  ...paragraph('（示例联络地址）')
]

export const arData: IElement[] = [
  ...heading('دعوة إلى نزهة الحي', TextDirection.RTL),
  ...paragraph(
    'نلتقي يوم السبت الساعة 10:00 عند المدخل الجنوبي للحديقة. أحضر طبقاً للمشاركة وكوبك الخاص، ويمكنك إحضار كتاب أو لعبة لتبادلها مع الجيران.',
    {
      direction: TextDirection.RTL,
      rowFlex: RowFlex.START
    }
  ),
  { value: 'الاسم: ', direction: TextDirection.RTL },
  control(
    'arabicName',
    ControlType.TEXT,
    {
      value: [{ value: 'أمينة' }],
      placeholder: 'اكتب اسمك'
    },
    TextDirection.RTL
  ),
  { value: '  عدد المشاركين: ', direction: TextDirection.RTL },
  control(
    'arabicGuests',
    ControlType.NUMBER,
    {
      value: [{ value: '2' }],
      placeholder: 'العدد',
      validation: { min: 1, max: 20 }
    },
    TextDirection.RTL
  ),
  { value: '\n', direction: TextDirection.RTL },
  ...paragraph(
    'موعد اللقاء: 24/10/2026، الساعة 10:00. نقطة اللقاء: South Gate، والطاولة رقم 3.',
    {
      direction: TextDirection.RTL,
      rowFlex: RowFlex.START
    }
  ),
  ...paragraph('نرتب المكان معاً، ثم نعود قبل غروب الشمس.', {
    direction: TextDirection.RTL,
    rowFlex: RowFlex.START,
    groupIds: ['2']
  })
]

export const data: IElement[] = [
  ...zhData,
  { value: '\n', type: ElementType.PAGE_BREAK },
  ...heading('四、把邀请带给新邻居'),
  ...paragraph(
    '楼里住着来自不同地方的朋友。把下面的小卡片发给熟悉的邻居，也欢迎带上刚搬来的朋友一起参加。'
  ),
  ...paragraph(
    'English · Bring a picnic, a reusable cup and a book to swap. Meet us at the park’s south gate at 10:00.'
  ),
  ...paragraph(
    'Français · Apportez votre pique-nique, une tasse et un livre à échanger. Rendez-vous à 10 h à l’entrée sud du parc.'
  ),
  ...paragraph(
    '日本語 · お弁当とマイカップ、交換したい本を持って、午前10時に公園の南口へ。'
  ),
  ...paragraph(
    '한국어 · 도시락과 개인 컵, 교환할 책을 챙겨 오전 10시에 공원 남문에서 만나요.'
  ),
  ...paragraph(
    'हिन्दी · अपना खाना, कप और किताब साथ लाएँ। सुबह 10 बजे पार्क के दक्षिणी प्रवेश द्वार पर मिलते हैं।'
  ),
  ...paragraph(
    'ไทย · นำอาหาร แก้วน้ำส่วนตัว และหนังสือมาแลกกัน พบกันเวลา 10:00 น. ที่ประตูทิศใต้ของสวน'
  ),
  ...paragraph(
    'Русский · Возьмите еду для пикника, свою кружку и книгу для обмена. Встречаемся в 10:00 у южного входа в парк.'
  ),
  ...paragraph(
    'Ελληνικά · Φέρτε φαγητό, το ποτήρι σας και ένα βιβλίο για ανταλλαγή. Ραντεβού στις 10:00 στη νότια είσοδο του πάρκου.'
  ),
  ...arData,
  { value: '\n' },
  ...paragraph('回家前，再看一眼草地：把垃圾带走，把好心情留下。', {
    rowFlex: RowFlex.CENTER,
    color: '#527568',
    spacingBefore: 12
  })
]

export const header: IElement[] = [
  { value: '河畔社区 · 周末一起出门', size: 22, rowFlex: RowFlex.CENTER },
  { value: '\n野餐 · 散步 · 旧物交换', size: 12, rowFlex: RowFlex.CENTER },
  { value: '\n', type: ElementType.SEPARATOR }
]
export const footer: IElement[] = [
  { value: '邻里生活小组 · 记得带走随身物品', size: 11 }
]

export const commentList = [
  {
    id: '1',
    content: '周五晚上在群里发一张天气截图；如遇下雨，提前通知改期。',
    userName: '小周',
    rangeText: '确认天气和集合时间',
    createdDate: '2026-10-16 19:30:00'
  },
  {
    id: '2',
    content: 'لنترك وقتاً كافياً لترتيب المكان وجمع الأغراض قبل العودة.',
    userName: 'أمينة',
    rangeText: 'نرتب المكان معاً، ثم نعود قبل غروب الشمس.',
    createdDate: '2026-10-16 20:10:00'
  }
]
