import { describe, expect, it } from 'vitest'
import { translateDisplayText } from '../../i18n/displayText'
import { DREAMINA_SEEDANCE_ARCHETYPE } from './dreaminaSeedance'
import { SEEDANCE_2_ARCHETYPE } from './seedance'
import { SEEDANCE_2_APIMART_ARCHETYPE } from './seedanceApimart'
import { SEEDANCE_VOLCENGINE_ARCHETYPE } from './seedanceVolcengine'
import type { ModelArchetype } from './types'

const CJK = /[\u3400-\u9fff]/u

function visibleMetadata(archetype: ModelArchetype): string[] {
  const values = [archetype.label]
  for (const mode of archetype.modes) {
    values.push(mode.vendorTerm, mode.hint)
    for (const slot of mode.slots) values.push(slot.label)
    for (const control of mode.params) {
      values.push(control.label)
      if (control.placeholder) values.push(control.placeholder)
      for (const option of control.options) values.push(option.label)
    }
  }
  for (const variant of archetype.variants || []) values.push(variant.label)
  return values.filter(Boolean)
}

describe('Seedance metadata localization', () => {
  const archetypes = [
    SEEDANCE_2_ARCHETYPE,
    SEEDANCE_2_APIMART_ARCHETYPE,
    SEEDANCE_VOLCENGINE_ARCHETYPE,
    DREAMINA_SEEDANCE_ARCHETYPE,
  ]

  it.each(['en', 'ru'] as const)('does not leak CJK metadata in %s', (locale) => {
    const leaks = archetypes.flatMap((archetype) =>
      visibleMetadata(archetype)
        .map((source) => ({ archetype: archetype.id, source, translated: translateDisplayText(locale, source) }))
        .filter(({ translated }) => CJK.test(translated)),
    )
    expect(leaks).toEqual([])
  })
})
