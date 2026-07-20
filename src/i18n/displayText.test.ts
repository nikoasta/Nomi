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

  it('translates legacy default project names without mutating persisted data', () => {
    expect(translateDisplayText('en', '未命名项目 07/20 18:56')).toBe('Untitled project 07/20 18:56')
    expect(translateDisplayText('ru', '未命名项目 07/20 18:56')).toBe('Проект без названия 07/20 18:56')
  })

  it('translates persisted learning project labels without mutating project data', () => {
    expect(translateDisplayText('en', '示例：修好一个小机器人')).toBe('Example: Repairing a little robot')
    expect(translateDisplayText('zh-CN', 'Example: Repairing a little robot')).toBe('示例：修好一个小机器人')
    expect(translateDisplayText('ru', '小孩')).toBe('Ребенок')
    expect(translateDisplayText('en', '黄昏屋顶')).toBe('Dusk rooftop')
    expect(translateDisplayText('ru', '镜头 3')).toBe('Кадр 3')
  })

  it('translates persisted 3D system labels from older Chinese projects', () => {
    expect(translateDisplayText('en', '假人')).toBe('Mannequin')
    expect(translateDisplayText('en', '相机1')).toBe('Camera 1')
    expect(translateDisplayText('ru', '群众(2x3)')).toBe('Массовка (2x3)')
    expect(translateDisplayText('en', '假人 副本')).toBe('Mannequin copy')
  })
})
