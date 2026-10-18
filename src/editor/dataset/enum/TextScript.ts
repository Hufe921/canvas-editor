/**
 * OpenType script tags used for font selection / shaping.
 * @see https://docs.microsoft.com/en-us/typography/opentype/spec/scripttags
 */
export enum TextScript {
  ARAB = 'arab',
  DEVA = 'deva',
  BENG = 'beng',
  GURU = 'guru',
  GUJR = 'gujr',
  ORYA = 'orya',
  TAML = 'taml',
  TELU = 'telu',
  KNDA = 'knda',
  MLYM = 'mlym',
  SINH = 'sinh',
  THAI = 'thai',
  LAOO = 'laoo',
  MYMR = 'mymr',
  KHMR = 'khmr',
  HEBR = 'hebr',
  LATN = 'latn',
  /** Legacy font-tag alias. Han detection itself does not infer a language. */
  HANS = 'hans',
  HANI = 'hani',
  HIRA = 'hira',
  KANA = 'kana',
  HANG = 'hang',
  ZSYE = 'zsye',
  ZZZZ = 'zzzz',
  GREK = 'grek',
  CYRL = 'cyrl',
  ZYYY = 'zyyy'
}
