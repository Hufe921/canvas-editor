import { describe, it, expect } from 'vitest'
import { I18n } from '../../../src/editor/core/i18n/I18n'

describe('I18n', () => {
  it('默认 locale 为 zhCN', () => {
    const i18n = new I18n('zhCN')
    expect(i18n.getLocale()).toBe('zhCN')
  })

  it('t 能读取深层 key', () => {
    const i18n = new I18n('zhCN')
    const value = i18n.t('contextmenu.global.copy')
    expect(value).toBeTruthy()
    expect(typeof value).toBe('string')
  })

  it('切换 locale 后 getLocale 返回新值', () => {
    const i18n = new I18n('zhCN')
    i18n.setLocale('en')
    expect(i18n.getLocale()).toBe('en')
  })

  it('缺失 key 返回空字符串', () => {
    const i18n = new I18n('zhCN')
    expect(i18n.t('menu.nonExistentKey')).toBe('')
  })

  it('registerLangMap 注册新语言', () => {
    const i18n = new I18n('zhCN')
    i18n.registerLangMap('custom', { menu: { bold: '粗体自定义' } } as any)
    i18n.setLocale('custom')
    expect(i18n.t('menu.bold')).toBe('粗体自定义')
  })
})
