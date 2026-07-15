import { describe, expect, it } from 'vitest'
import { providerCountLabel, translateDisplayText } from './displayText'

describe('translateDisplayText', () => {
  it('translates model capability suffixes without changing model names', () => {
    expect(translateDisplayText('en', 'GPT Image 2 · 文生图')).toBe('GPT Image 2 · Text to image')
    expect(translateDisplayText('ru', 'GPT Image 2 · 图生图')).toBe('GPT Image 2 · Изображение в изображение')
  })

  it('translates generation control labels used by archetype metadata', () => {
    expect(translateDisplayText('en', '比例')).toBe('Aspect')
    expect(translateDisplayText('ru', '清晰度')).toBe('Качество')
    expect(translateDisplayText('en', '纯文字生成图像')).toBe('Generate an image from text')
  })

  it('keeps Chinese labels unchanged in zh-CN', () => {
    expect(translateDisplayText('zh-CN', 'GPT Image 2 · 文生图')).toBe('GPT Image 2 · 文生图')
    expect(providerCountLabel('zh-CN', 3)).toBe('3 家')
  })

  it('localizes provider counts', () => {
    expect(providerCountLabel('en', 3)).toBe('3 providers')
    expect(providerCountLabel('ru', 3)).toBe('3 пров.')
  })
})
