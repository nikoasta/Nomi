import { getRuntimeLocale } from '../../i18n/runtimeLocale'
import type { SupportedLocale } from '../../i18n/translations'
import canvasTranslations from './i18n/canvasTranslations.json'

export type CanvasI18nKey = keyof (typeof canvasTranslations)['zh-CN']

export function canvasTranslate(locale: SupportedLocale, key: CanvasI18nKey, params?: Record<string, string | number>): string {
  const template = canvasTranslations[locale][key] ?? canvasTranslations['zh-CN'][key] ?? key
  if (!params) return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined || value === null ? match : String(value)
  })
}

export function canvasRuntimeTranslate(key: CanvasI18nKey, params?: Record<string, string | number>): string {
  return canvasTranslate(getRuntimeLocale(), key, params)
}
