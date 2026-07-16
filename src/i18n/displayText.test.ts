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

  it('translates persisted timeline track labels', () => {
    expect(translateDisplayText('en', '图片轨')).toBe('Image track')
    expect(translateDisplayText('ru', '视频轨')).toBe('Видеодорожка')
    expect(translateDisplayText('en', '音频轨')).toBe('Audio track')
  })

  it('translates persisted text overlay defaults and font labels', () => {
    expect(translateDisplayText('en', '标题')).toBe('Title')
    expect(translateDisplayText('ru', '字幕文字')).toBe('Текст субтитров')
    expect(translateDisplayText('en', '默认黑体')).toBe('Default sans')
    expect(translateDisplayText('ru', '英文衬线')).toBe('Английский с засечками')
  })
})
