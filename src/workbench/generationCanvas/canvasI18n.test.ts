import { describe, expect, it } from 'vitest'
import { canvasTranslate } from './canvasI18n'

describe('canvas i18n', () => {
  it('localizes spend confirmation cost summary', () => {
    expect(canvasTranslate('en', 'spend.costSummary', { count: 1, unit: canvasTranslate('en', 'spend.unit.image'), minutes: 1 })).toBe(
      'Will generate 1 image · about 1 min · uses model credits',
    )
    expect(canvasTranslate('ru', 'spend.costSummary', { count: 1, unit: canvasTranslate('ru', 'spend.unit.image'), minutes: 1 })).toContain(
      'Будет создано',
    )
  })
})
