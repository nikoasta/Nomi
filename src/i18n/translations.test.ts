import { describe, expect, it } from 'vitest'
import { SUPPORTED_LOCALES, translate, translations, type TranslationKey } from './translations'

describe('translations', () => {
  it('keeps every locale aligned with the default dictionary keys', () => {
    const keys = Object.keys(translations['zh-CN']).sort()
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(translations[locale]).sort()).toEqual(keys)
    }
  })

  it('interpolates named parameters', () => {
    expect(translate('en', 'library.project.deleteAria', { name: 'Cash on Rails' })).toBe(
      'Delete project Cash on Rails',
    )
  })

  it('covers the language switcher labels in all supported locales', () => {
    const keys: TranslationKey[] = ['language.zh', 'language.en', 'language.ru']
    for (const locale of SUPPORTED_LOCALES) {
      for (const key of keys) expect(translate(locale, key)).toBeTruthy()
    }
  })
})
