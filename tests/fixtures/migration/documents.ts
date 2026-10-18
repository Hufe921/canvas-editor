import type { IEditorData, IEditorOption } from '../../../src/editor'
import {
  ControlType,
  ElementType,
  ImageDisplay,
  PaperDirection,
  TextDirection
} from '../../../src/editor'

export const migrationEnvironment = {
  viewport: { width: 1366, height: 720 },
  devicePixelRatio: 1,
  font: 'Noto Naskh Arabic',
  fontUrl: '/fonts/NotoNaskhArabic-Regular.ttf'
} as const

export interface MigrationSample {
  id: string
  data: IEditorData
  options?: IEditorOption
}

const paragraph = (value: string) => [{ value }, { value: '\n' }]
const cell = (value: IEditorData['main']) => ({
  colspan: 1,
  rowspan: 1,
  value
})
const table = (value: IEditorData['main']): IEditorData['main'][number] => ({
  type: ElementType.TABLE,
  value: '',
  colgroup: [{ width: 180 }, { width: 180 }],
  trList: [
    {
      height: 48,
      tdList: [cell(value), cell(paragraph('نتيجة 123'))]
    }
  ]
})
const image =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">' +
      '<rect width="48" height="48" fill="#4682b4"/></svg>'
  )

// Each call returns fresh models: normalization and layout mutate elements.
export function migrationSamples(): MigrationSample[] {
  return [
    {
      id: 'paragraphs',
      data: {
        main: [
          {
            value: 'مرحبا بالعالم Hello 123 '.repeat(8),
            direction: TextDirection.RTL,
            spacingBefore: 8,
            spacingAfter: 16
          },
          { value: '\n' },
          { value: 'Latin العربية 42', direction: TextDirection.LTR },
          { value: '\n' },
          { value: '\n', spacingAfter: 6 },
          { value: '2', type: ElementType.SUPERSCRIPT }
        ]
      }
    },
    {
      id: 'emr-controls',
      data: {
        main: [
          ...paragraph('بيانات المريض'),
          {
            type: ElementType.CONTROL,
            value: '',
            control: {
              type: ControlType.TEXT,
              conceptId: 'patient-name',
              value: [{ value: 'محمد' }],
              minWidth: 120,
              border: true
            }
          },
          { value: '\n' },
          {
            type: ElementType.CONTROL,
            value: '',
            control: {
              type: ControlType.NUMBER,
              conceptId: 'patient-age',
              value: [{ value: '42' }],
              required: true
            }
          },
          { value: '\n' },
          {
            type: ElementType.CONTROL,
            value: '',
            control: {
              type: ControlType.TEXT,
              conceptId: 'diagnosis',
              value: null,
              placeholder: 'التشخيص',
              minWidth: 100
            }
          }
        ]
      }
    },
    {
      id: 'nested-table',
      data: {
        main: [
          table([
            ...paragraph('فحص'),
            {
              ...table(paragraph('داخل')),
              colgroup: [{ width: 70 }, { width: 70 }]
            },
            { value: '\n' }
          ])
        ]
      }
    },
    {
      id: 'surround-columns',
      options: { column: { count: 2, gap: 16 } },
      data: {
        main: [
          {
            type: ElementType.IMAGE,
            value: image,
            width: 48,
            height: 48,
            imgDisplay: ImageDisplay.SURROUND,
            imgFloatPosition: { x: 32, y: 32, pageNo: 0 }
          },
          ...paragraph('مرحبا Hello 123 '.repeat(40))
        ]
      }
    },
    {
      id: 'mixed-paper',
      data: {
        main: [
          ...paragraph('عمودي'),
          {
            type: ElementType.PAGE_BREAK,
            value: '',
            paperDirection: PaperDirection.HORIZONTAL
          },
          ...paragraph('أفقي'),
          {
            type: ElementType.PAGE_BREAK,
            value: '',
            paperDirection: PaperDirection.VERTICAL
          },
          ...paragraph('عمودي آخر')
        ]
      }
    },
    {
      id: 'print',
      data: {
        header: paragraph('تقرير'),
        main: [
          ...paragraph('ملخص '.repeat(50)),
          table(paragraph('نتيجة')),
          { type: ElementType.PAGE_BREAK, value: '' },
          ...paragraph('نهاية')
        ],
        footer: paragraph('سري 123')
      }
    }
  ]
}

export const migrationOptions: IEditorOption = {
  autoDownloadFonts: false,
  width: 480,
  height: 640,
  margins: [32, 32, 32, 32],
  defaultSize: 16,
  defaultFont: migrationEnvironment.font,
  scale: 1,
  printPixelRatio: 1,
  lab: { incrementalCompute: false }
}
