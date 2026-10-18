import Editor, { ControlType, ElementType } from '../../../src/editor'

const editor = await Editor.create(
  document.querySelector<HTMLDivElement>('#editor')!,
  {
    main: [
      { value: '周末野餐 office café مرحبا नमस्ते สวัสดี 😀👨‍👩‍👧' },
      { value: '\n' },
      { value: '报名姓名：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          conceptId: 'name',
          value: [{ value: '小林' }],
          minWidth: 100
        }
      },
      { value: '\n' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.CHECKBOX,
          conceptId: 'picnic',
          value: null,
          code: 'water',
          valueSets: [{ code: 'water', value: '自带饮用水' }]
        }
      },
      { value: '\n' },
      {
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 200 }, { width: 200 }],
        trList: [
          {
            height: 42,
            tdList: [
              { colspan: 1, rowspan: 1, value: [{ value: '午餐 Lunch' }] },
              {
                colspan: 1,
                rowspan: 1,
                value: [{ value: 'مرحبا नमस्ते สวัสดี' }]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    defaultFont: 'Latin',
    autoDownloadFonts: false,
    pageNumber: { disabled: true },
    fonts: [
      { family: 'Latin', url: '../fonts/NotoSans-Latin-Regular.woff2' },
      { family: 'CJK', url: '../fonts/NotoSansSC-Regular.woff2' },
      {
        family: 'Arabic',
        url: '/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf'
      },
      {
        family: 'Deva',
        url: '/canvas-editor/fonts/NotoSansDevanagari-Regular.ttf'
      },
      { family: 'Thai', url: '/canvas-editor/fonts/NotoSansThai-Regular.ttf' }
    ]
  }
)
Object.assign(window, { nativeMultilingual: { editor } })
document.querySelector('#status')!.textContent = 'ready'
