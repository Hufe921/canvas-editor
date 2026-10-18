import { TextScript } from '../../../dataset/enum/TextScript'

/** Demo/self-host candidates only. Not an automatic download or coverage claim. */
export const BASIC_FONT_MANIFEST = [
  {
    family: 'Noto Naskh Arabic',
    scripts: [TextScript.ARAB],
    fileName: 'NotoNaskhArabic-Regular.ttf',
    weight: 400,
    style: 'normal'
  },
  {
    family: 'Noto Sans Devanagari',
    scripts: [TextScript.DEVA],
    fileName: 'NotoSansDevanagari-Regular.ttf',
    weight: 400,
    style: 'normal'
  },
  {
    family: 'Noto Sans Thai',
    scripts: [TextScript.THAI],
    fileName: 'NotoSansThai-Regular.ttf',
    weight: 400,
    style: 'normal'
  }
] as const
