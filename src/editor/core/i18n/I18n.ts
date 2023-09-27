import { ILang } from '../../interface/i18n/I18n'
import zhCN from './lang/zh-CN.json'
import en from './lang/en.json'
import { mergeObject } from '../../utils'
import { DeepPartial } from '../../interface/Common'

export class I18n {
  private langMap: Map<string, ILang> = new Map([
    ['zhCN', zhCN],
    ['en', en]
  ])

  private currentLocale = 'zhCN'

  public registerLangMap(locale: string, lang: DeepPartial<ILang>) {
    const sourceLang = this.langMap.get(locale)
    this.langMap.set(locale, <ILang>mergeObject(sourceLang || zhCN, lang))
  }

  public getLocale(): string {
    return this.currentLocale
  }

  public setLocale(locale: string) {
    this.currentLocale = locale
  }

  public getLang(): ILang {
    return this.langMap.get(this.currentLocale) || zhCN
  }

  public t(path: string): string {
    const keyList = path.split('.')
    let value = ''
    let item = this.getLang()
    for (let k = 0; k < keyList.length; k++) {
      const key = keyList[k]
      const currentValue = Reflect.get(item, key)
      if (currentValue) {
        value = item = currentValue
      } else {
        return ''
      }
    }
    return value
  }
}
