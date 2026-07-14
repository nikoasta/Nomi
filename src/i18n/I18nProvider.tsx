import React from 'react'
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  translate,
  type SupportedLocale,
} from './translations'
import { I18nContext, type I18nContextValue } from './i18nContext'
import { INTERFACE_LOCALE_STORAGE_KEY } from './runtimeLocale'

function readStoredLocale(): SupportedLocale {
  try {
    const stored = window.localStorage.getItem(INTERFACE_LOCALE_STORAGE_KEY)
    if (isSupportedLocale(stored)) return stored
    const browserLocale = window.navigator.language
    if (browserLocale.toLowerCase().startsWith('ru')) return 'ru'
    if (browserLocale.toLowerCase().startsWith('en')) return 'en'
  } catch {
    /* localStorage can be unavailable in tests or privacy modes */
  }
  return DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [locale, setLocaleState] = React.useState<SupportedLocale>(() => readStoredLocale())

  const setLocale = React.useCallback((nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale)
    try {
      window.localStorage.setItem(INTERFACE_LOCALE_STORAGE_KEY, nextLocale)
    } catch {
      /* localStorage persistence is best effort */
    }
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
