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
  const exact = labels[label]
  if (exact) return exact
  const cameraMatch = label.match(/^相机\s*(\d+)$/u)
  if (cameraMatch) return locale === 'ru' ? `Камера ${cameraMatch[1]}` : `Camera ${cameraMatch[1]}`
  const characterMatch = label.match(/^角色([A-Z])$/u)
  if (characterMatch) return locale === 'ru' ? `Персонаж ${characterMatch[1]}` : `Character ${characterMatch[1]}`
  const crowdMatch = label.match(/^群众\((\d+)x(\d+)\)$/u)
  if (crowdMatch) return locale === 'ru' ? `Массовка (${crowdMatch[1]}x${crowdMatch[2]})` : `Crowd (${crowdMatch[1]}x${crowdMatch[2]})`
  const copyMatch = label.match(/^(.+)\s+副本$/u)
  if (copyMatch) return `${scene3dDisplayLabel(locale, copyMatch[1])} ${labels['副本'] ?? 'copy'}`
  const lightMatch = label.match(/^灯光\s*(\d+)$/u)
  if (lightMatch) return locale === 'ru' ? `Свет ${lightMatch[1]}` : `Light ${lightMatch[1]}`
  const objectMatch = label.match(/^对象\s*(\d+)$/u)
  if (objectMatch) return locale === 'ru' ? `Объект ${objectMatch[1]}` : `Object ${objectMatch[1]}`
  const trajectoryMatch = label.match(/^轨迹\s*(\d+)$/u)
  if (trajectoryMatch) return locale === 'ru' ? `Траектория ${trajectoryMatch[1]}` : `Trajectory ${trajectoryMatch[1]}`
  const groupMatch = label.match(/^组\s*(\d+)$/u)
  if (groupMatch) return locale === 'ru' ? `Группа ${groupMatch[1]}` : `Group ${groupMatch[1]}`
  return label
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
