import type { SupportedLocale } from './translations'

const EXACT: Record<string, Record<SupportedLocale, string>> = {
  '文生图': { 'zh-CN': '文生图', en: 'Text to image', ru: 'Текст в изображение' },
  '图生图': { 'zh-CN': '图生图', en: 'Image to image', ru: 'Изображение в изображение' },
  '改图': { 'zh-CN': '改图', en: 'Edit image', ru: 'Редактировать изображение' },
  '文生视频': { 'zh-CN': '文生视频', en: 'Text to video', ru: 'Текст в видео' },
  '图生视频': { 'zh-CN': '图生视频', en: 'Image to video', ru: 'Изображение в видео' },
  '首尾帧': { 'zh-CN': '首尾帧', en: 'First/last frames', ru: 'Первый/последний кадр' },
  '参考图': { 'zh-CN': '参考图', en: 'Reference image', ru: 'Референс' },
  '角色参考': { 'zh-CN': '角色参考', en: 'Character reference', ru: 'Референс персонажа' },
  '首帧': { 'zh-CN': '首帧', en: 'First frame', ru: 'Первый кадр' },
  '尾帧': { 'zh-CN': '尾帧', en: 'Last frame', ru: 'Последний кадр' },
  '首/尾帧': { 'zh-CN': '首/尾帧', en: 'First/last frame', ru: 'Первый/последний кадр' },
  '源视频': { 'zh-CN': '源视频', en: 'Source video', ru: 'Исходное видео' },
  '全能参考': { 'zh-CN': '全能参考', en: 'Omni reference', ru: 'Универсальный референс' },
  '输出': { 'zh-CN': '输出', en: 'Output', ru: 'Вывод' },
  '网格': { 'zh-CN': '网格', en: 'Mesh', ru: 'Сетка' },
  '网格+纹理': { 'zh-CN': '网格+纹理', en: 'Mesh + texture', ru: 'Сетка + текстура' },
  '精度': { 'zh-CN': '精度', en: 'Detail', ru: 'Детализация' },
  '面数': { 'zh-CN': '面数', en: 'Faces', ru: 'Полигоны' },
  '比例': { 'zh-CN': '比例', en: 'Aspect', ru: 'Формат' },
  '画幅': { 'zh-CN': '画幅', en: 'Aspect', ru: 'Формат' },
  '清晰度': { 'zh-CN': '清晰度', en: 'Quality', ru: 'Качество' },
  '分辨率': { 'zh-CN': '分辨率', en: 'Resolution', ru: 'Разрешение' },
  '画质': { 'zh-CN': '画质', en: 'Quality', ru: 'Качество' },
  '时长': { 'zh-CN': '时长', en: 'Duration', ru: 'Длительность' },
  '时长(秒)': { 'zh-CN': '时长(秒)', en: 'Duration', ru: 'Длительность' },
  '种子': { 'zh-CN': '种子', en: 'Seed', ru: 'Seed' },
  '随机': { 'zh-CN': '随机', en: 'Random', ru: 'Случайно' },
  '音频': { 'zh-CN': '音频', en: 'Audio', ru: 'Аудио' },
  '自动': { 'zh-CN': '自动', en: 'Auto', ru: 'Авто' },
  '保留原声': { 'zh-CN': '保留原声', en: 'Keep original audio', ru: 'Сохранить исходный звук' },
  '声效': { 'zh-CN': '声效', en: 'Sound', ru: 'Звук' },
  '负向提示': { 'zh-CN': '负向提示', en: 'Negative prompt', ru: 'Негативный промпт' },
  '排除的元素…': { 'zh-CN': '排除的元素…', en: 'Elements to exclude...', ru: 'Что исключить...' },
  '默认': { 'zh-CN': '默认', en: 'Default', ru: 'По умолчанию' },
  '选择': { 'zh-CN': '选择', en: 'Select', ru: 'Выбрать' },
  '声音': { 'zh-CN': '声音', en: 'Audio', ru: 'Аудио' },
  '图片轨': { 'zh-CN': '图片轨', en: 'Image track', ru: 'Дорожка изображений' },
  '视频轨': { 'zh-CN': '视频轨', en: 'Video track', ru: 'Видеодорожка' },
  '音频轨': { 'zh-CN': '音频轨', en: 'Audio track', ru: 'Аудиодорожка' },
  '默认黑体': { 'zh-CN': '默认黑体', en: 'Default sans', ru: 'Стандартный гротеск' },
  '宋体': { 'zh-CN': '宋体', en: 'Songti serif', ru: 'Songti с засечками' },
  '楷体': { 'zh-CN': '楷体', en: 'Kaiti script', ru: 'Kaiti рукописный' },
  '圆体': { 'zh-CN': '圆体', en: 'Rounded sans', ru: 'Скругленный гротеск' },
  '英文衬线': { 'zh-CN': '英文衬线', en: 'English serif', ru: 'Английский с засечками' },
  '标题': { 'zh-CN': '标题', en: 'Title', ru: 'Заголовок' },
  '字幕文字': { 'zh-CN': '字幕文字', en: 'Caption text', ru: 'Текст субтитров' },
  '按放入顺序编号 ①②③': {
    'zh-CN': '按放入顺序编号 ①②③',
    en: 'Numbered by insertion order: ①②③',
    ru: 'Нумерация по порядку добавления: ①②③',
  },
  '纯文字生成图像': {
    'zh-CN': '纯文字生成图像',
    en: 'Generate an image from text',
    ru: 'Создать изображение из текста',
  },
  '单张参考图驱动': {
    'zh-CN': '单张参考图驱动',
    en: 'Driven by one reference image',
    ru: 'По одному референсу',
  },
  '单张参考图驱动（比例随图自动决定）': {
    'zh-CN': '单张参考图驱动（比例随图自动决定）',
    en: 'Driven by one reference image; aspect follows the image',
    ru: 'По одному референсу; формат берется из изображения',
  },
}

const TOKEN_REPLACEMENTS: Array<[RegExp, Record<SupportedLocale, string>]> = [
  [/文生图/gu, EXACT['文生图']],
  [/图生图/gu, EXACT['图生图']],
  [/改图/gu, EXACT['改图']],
  [/文生视频/gu, EXACT['文生视频']],
  [/图生视频/gu, EXACT['图生视频']],
  [/首尾帧/gu, EXACT['首尾帧']],
  [/参考图/gu, EXACT['参考图']],
]

export function translateDisplayText(locale: SupportedLocale, value: unknown): string {
  const text = typeof value === 'string' ? value : String(value ?? '')
  if (locale === 'zh-CN') return text
  const exact = EXACT[text]
  if (exact) return exact[locale]
  return TOKEN_REPLACEMENTS.reduce((next, [pattern, labels]) => next.replace(pattern, labels[locale]), text)
}

export function providerCountLabel(locale: SupportedLocale, count: number): string {
  if (locale === 'zh-CN') return `${count} 家`
  if (locale === 'ru') return `${count} пров.`
  return `${count} providers`
}
