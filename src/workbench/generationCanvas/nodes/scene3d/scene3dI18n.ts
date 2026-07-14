import React from 'react'
import { useI18n } from '../../../../i18n/i18nContext'
import type { SupportedLocale } from '../../../../i18n/translations'
import type { Scene3DGeometry, Scene3DPropKind } from './scene3dTypes'
import type { Scene3DSceneTemplate } from './scene3dSceneTemplates'
import scene3dTranslations from './i18n/scene3dTranslations.json'
import scene3dDisplayLabelTranslations from './i18n/scene3dDisplayLabelTranslations.json'

export type Scene3DI18nKey = keyof (typeof scene3dTranslations)['zh-CN']

type Scene3DTranslationParams = Record<string, string | number>

function interpolate(template: string, params?: Scene3DTranslationParams): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function scene3dTranslate(locale: SupportedLocale, key: Scene3DI18nKey, params?: Scene3DTranslationParams): string {
  return interpolate(scene3dTranslations[locale][key], params)
}

export function useScene3DI18n(): (key: Scene3DI18nKey, params?: Scene3DTranslationParams) => string {
  const { locale } = useI18n()
  return React.useCallback((key: Scene3DI18nKey, params?: Scene3DTranslationParams) => scene3dTranslate(locale, key, params), [locale])
}

export function scene3dDisplayLabel(locale: SupportedLocale, label: string): string {
  if (locale === 'zh-CN') return label
  const labels = scene3dDisplayLabelTranslations[locale] as Record<string, string>
  return labels[label] ?? label
}

export function useScene3DLabel(): (label: string) => string {
  const { locale } = useI18n()
  return React.useCallback((label: string) => scene3dDisplayLabel(locale, label), [locale])
}

export function scene3dGeometryLabel(locale: SupportedLocale, kind: Scene3DGeometry): string {
  return scene3dTranslate(locale, `geometry.${kind}` as Scene3DI18nKey)
}

export function scene3dPropLabel(locale: SupportedLocale, kind: Scene3DPropKind): string {
  return scene3dTranslate(locale, `prop.${kind}` as Scene3DI18nKey)
}

export function scene3dTemplateLabel(locale: SupportedLocale, template: Scene3DSceneTemplate): string {
  return scene3dTranslate(locale, `template.${template}` as Scene3DI18nKey)
}
