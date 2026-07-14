import zhCNTranslations from './locales/zh-CN.json'
import enTranslations from './locales/en.json'
import ruTranslations from './locales/ru.json'

export const SUPPORTED_LOCALES = ['zh-CN', 'en', 'ru'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export type TranslationKey = keyof typeof zhCNTranslations
export type TranslationParams = Record<string, string | number>

export const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

export const translations = {
  'zh-CN': zhCNTranslations,
  en: enTranslations,
  ru: ruTranslations,
} satisfies Record<SupportedLocale, Record<TranslationKey, string>>

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined || value === null ? match : String(value)
  })
}

export function translate(locale: SupportedLocale, key: TranslationKey, params?: TranslationParams): string {
  const template = translations[locale][key] ?? translations[DEFAULT_LOCALE][key] ?? key
  return interpolate(template, params)
}
