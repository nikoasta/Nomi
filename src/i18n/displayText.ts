import type { SupportedLocale } from './translations'
import { translateDemoProjectText } from '../workbench/onboarding/demoProject'

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
  '分镜': { 'zh-CN': '分镜', en: 'Shots', ru: 'Кадры' },
  '角色': { 'zh-CN': '角色', en: 'Cast', ru: 'Персонажи' },
  '场景': { 'zh-CN': '场景', en: 'Scenes', ru: 'Сцены' },
  '道具': { 'zh-CN': '道具', en: 'Props', ru: 'Реквизит' },
  '新分类': { 'zh-CN': '新分类', en: 'New category', ru: 'Новая категория' },
  '文件夹': { 'zh-CN': '文件夹', en: 'Folder', ru: 'Папка' },
  '图片': { 'zh-CN': '图片', en: 'Image', ru: 'Изображение' },
  '视频': { 'zh-CN': '视频', en: 'Video', ru: 'Видео' },
  '提示词': { 'zh-CN': '提示词', en: 'Prompt', ru: 'Prompt' },
  '网页素材': { 'zh-CN': '网页素材', en: 'Web asset', ru: 'Веб-ассет' },
  '本地导入': { 'zh-CN': '本地导入', en: 'Local import', ru: 'Локальный импорт' },
  '项目素材': { 'zh-CN': '项目素材', en: 'Project asset', ru: 'Ассет проекта' },
  '本地文本': { 'zh-CN': '本地文本', en: 'Local text', ru: 'Локальный текст' },
  '提取中...': { 'zh-CN': '提取中...', en: 'Extracting...', ru: 'Извлекаем...' },
  '下载中...': { 'zh-CN': '下载中...', en: 'Downloading...', ru: 'Скачиваем...' },
  '提取失败': { 'zh-CN': '提取失败', en: 'Extraction failed', ru: 'Извлечение не удалось' },
  '下载失败': { 'zh-CN': '下载失败', en: 'Download failed', ru: 'Скачивание не удалось' },
  '保存中...': { 'zh-CN': '保存中...', en: 'Saving...', ru: 'Сохраняем...' },
  '保存失败': { 'zh-CN': '保存失败', en: 'Save failed', ru: 'Сохранение не удалось' },
  '新建文件夹': { 'zh-CN': '新建文件夹', en: 'New folder', ru: 'Новая папка' },
  '未命名素材': { 'zh-CN': '未命名素材', en: 'Untitled asset', ru: 'Ассет без названия' },
  '项目视频': { 'zh-CN': '项目视频', en: 'Project video', ru: 'Видео проекта' },
  '项目图片': { 'zh-CN': '项目图片', en: 'Project image', ru: 'Изображение проекта' },
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
  '假人': { 'zh-CN': '假人', en: 'Mannequin', ru: 'Манекен' },
  '点光源': { 'zh-CN': '点光源', en: 'Point light', ru: 'Точечный свет' },
  '立方体': { 'zh-CN': '立方体', en: 'Box', ru: 'Куб' },
  '球体': { 'zh-CN': '球体', en: 'Sphere', ru: 'Сфера' },
  '圆柱体': { 'zh-CN': '圆柱体', en: 'Cylinder', ru: 'Цилиндр' },
  '平面': { 'zh-CN': '平面', en: 'Plane', ru: 'Плоскость' },
  '群众': { 'zh-CN': '群众', en: 'Crowd', ru: 'Массовка' },
  '机位': { 'zh-CN': '机位', en: 'Camera', ru: 'Камера' },
  '主体': { 'zh-CN': '主体', en: 'Subject', ru: 'Объект' },
  '运镜机位': { 'zh-CN': '运镜机位', en: 'Camera move camera', ru: 'Камера движения' },
  '灯光': { 'zh-CN': '灯光', en: 'Light', ru: 'Свет' },
  '对象': { 'zh-CN': '对象', en: 'Object', ru: 'Объект' },
  '轨迹': { 'zh-CN': '轨迹', en: 'Trajectory', ru: 'Траектория' },
  '组': { 'zh-CN': '组', en: 'Group', ru: 'Группа' },
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
  '火山方舟': { 'zh-CN': '火山方舟', en: 'Volcengine Ark', ru: 'Volcengine Ark' },
  '火山语音': { 'zh-CN': '火山语音', en: 'Volcengine Voice', ru: 'Volcengine Voice' },
  '魔搭': { 'zh-CN': '魔搭', en: 'ModelScope', ru: 'ModelScope' },
  '即梦': { 'zh-CN': '即梦', en: 'Dreamina', ru: 'Dreamina' },
  '豆包': { 'zh-CN': '豆包', en: 'Doubao', ru: 'Doubao' },
  '火山豆包语音': { 'zh-CN': '火山豆包语音', en: 'Volcengine Doubao Voice', ru: 'Volcengine Doubao Voice' },
  '通义千问': { 'zh-CN': '通义千问', en: 'Qwen', ru: 'Qwen' },
  '阿里云百炼': { 'zh-CN': '阿里云百炼', en: 'Alibaba Bailian', ru: 'Alibaba Bailian' },
  '硅基流动': { 'zh-CN': '硅基流动', en: 'SiliconFlow', ru: 'SiliconFlow' },
  '阶跃星辰': { 'zh-CN': '阶跃星辰', en: 'StepFun', ru: 'StepFun' },
  '月之暗面': { 'zh-CN': '月之暗面', en: 'Moonshot', ru: 'Moonshot' },
  '零一万物': { 'zh-CN': '零一万物', en: '01.AI', ru: '01.AI' },
  '百川智能': { 'zh-CN': '百川智能', en: 'Baichuan AI', ru: 'Baichuan AI' },
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
  const demoText = translateDemoProjectText(locale, text)
  if (demoText !== text) return demoText
  if (locale === 'zh-CN') return text
  const shotMatch = text.match(/^镜头\s*(\d+)$/u)
  if (shotMatch) return locale === 'ru' ? `Кадр ${shotMatch[1]}` : `Shot ${shotMatch[1]}`
  const cameraMatch = text.match(/^相机\s*(\d+)$/u)
  if (cameraMatch) return locale === 'ru' ? `Камера ${cameraMatch[1]}` : `Camera ${cameraMatch[1]}`
  const characterMatch = text.match(/^角色([A-Z])$/u)
  if (characterMatch) return locale === 'ru' ? `Персонаж ${characterMatch[1]}` : `Character ${characterMatch[1]}`
  const crowdMatch = text.match(/^群众\((\d+)x(\d+)\)$/u)
  if (crowdMatch) return locale === 'ru' ? `Массовка (${crowdMatch[1]}x${crowdMatch[2]})` : `Crowd (${crowdMatch[1]}x${crowdMatch[2]})`
  const copyMatch = text.match(/^(.+)\s+副本$/u)
  if (copyMatch) return `${translateDisplayText(locale, copyMatch[1])} ${locale === 'ru' ? 'копия' : 'copy'}`
  const numberedScene3DMatch = text.match(/^(灯光|对象|轨迹|组)\s*(\d+)$/u)
  if (numberedScene3DMatch) {
    const label = EXACT[numberedScene3DMatch[1]]?.[locale] ?? numberedScene3DMatch[1]
    return `${label} ${numberedScene3DMatch[2]}`
  }
  const exact = EXACT[text]
  if (exact) return exact[locale]
  return TOKEN_REPLACEMENTS.reduce((next, [pattern, labels]) => next.replace(pattern, labels[locale]), text)
}

export function providerCountLabel(locale: SupportedLocale, count: number): string {
  if (locale === 'zh-CN') return `${count} 家`
  if (locale === 'ru') return `${count} пров.`
  return `${count} providers`
}
