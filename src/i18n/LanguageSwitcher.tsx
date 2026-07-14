import React from 'react'
import { NomiSelect } from '../design/NomiSelect'
import { useI18n } from './i18nContext'
import { SUPPORTED_LOCALES, type SupportedLocale } from './translations'

export function LanguageSwitcher({ className }: { className?: string }): JSX.Element {
  const { locale, setLocale, t } = useI18n()
  const options = SUPPORTED_LOCALES.map((value) => ({
    value,
    label: t(value === 'zh-CN' ? 'language.zh' : value === 'en' ? 'language.en' : 'language.ru'),
  }))

  return (
    <NomiSelect
      value={locale}
      options={options}
      onChange={(value) => setLocale(value as SupportedLocale)}
      ariaLabel={t('language.switcher.aria')}
      leadingLabel={t('language.switcher.leading')}
      size="xs"
      triggerMaxWidth={82}
      className={className}
    />
  )
}
