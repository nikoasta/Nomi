import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from './translations'

export const INTERFACE_LOCALE_STORAGE_KEY = 'nomi.interface-language'

export function getRuntimeLocale(): SupportedLocale {
  try {
    if (typeof document !== 'undefined' && isSupportedLocale(document.documentElement.lang)) {
      return document.documentElement.lang
    }
    if (typeof window !== 'undefined' && isSupportedLocale(window.localStorage.getItem(INTERFACE_LOCALE_STORAGE_KEY))) {
      return window.localStorage.getItem(INTERFACE_LOCALE_STORAGE_KEY) as SupportedLocale
    }
  } catch {
    /* Runtime locale is best-effort outside React. */
  }
  return DEFAULT_LOCALE
}
