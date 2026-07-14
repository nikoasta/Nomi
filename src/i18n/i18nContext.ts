import React from 'react'
import type { SupportedLocale, TranslationKey, TranslationParams } from './translations'

export type I18nContextValue = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

export const I18nContext = React.createContext<I18nContextValue | null>(null)

export function useI18n(): I18nContextValue {
  const value = React.useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used inside I18nProvider')
  return value
}
