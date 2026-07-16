import { translate, type TranslationKey, type TranslationParams } from './translations'
import { getRuntimeLocale } from './runtimeLocale'

export function runtimeT(key: TranslationKey, params?: TranslationParams): string {
  return translate(getRuntimeLocale(), key, params)
}
