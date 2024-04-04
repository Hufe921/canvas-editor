import { MaxHeightRatio } from '../enum/Common'

export const ZERO = '\u200B'
export const WRAP = '\n'
export const HORIZON_TAB = '\t'
export const NBSP = '\u0020'
export const NON_BREAKING_SPACE = '&nbsp;'
export const PUNCTUATION_LIST = [
  '·',
  '、',
  ':',
  '：',
  ',',
  '，',
  '.',
  '。',
  ';',
  '；',
  '?',
  '？',
  '!',
  '！'
]

export const maxHeightRadioMapping: Record<MaxHeightRatio, number> = {
  [MaxHeightRatio.HALF]: 1 / 2,
  [MaxHeightRatio.ONE_THIRD]: 1 / 3,
  [MaxHeightRatio.QUARTER]: 1 / 4
}

export const LETTER_CLASS = {
  ENGLISH: 'A-Za-z',
  SPANISH: 'A-Za-zÁÉÍÓÚáéíóúÑñÜü',
  FRENCH: 'A-Za-zÀÂÇàâçÉéÈèÊêËëÎîÏïÔôÙùÛûŸÿ',
  GERMAN: 'A-Za-zÄäÖöÜüß',
  RUSSIAN: 'А-Яа-яЁё',
  PORTUGUESE: 'A-Za-zÁÉÍÓÚáéíóúÃÕãõÇç',
  ITALIAN: 'A-Za-zÀàÈèÉéÌìÍíÎîÓóÒòÙù',
  DUTCH: 'A-Za-zÀàÁáÂâÄäÈèÉéÊêËëÌìÍíÎîÏïÓóÒòÔôÖöÙùÛûÜü',
  SWEDISH: 'A-Za-zÅåÄäÖö',
  GREEK: 'ΑαΒβΓγΔδΕεΖζΗηΘθΙιΚκΛλΜμΝνΞξΟοΠπΡρΣσςΤτΥυΦφΧχΨψΩω'
}

export const METRICS_BASIS_TEXT = '日'
