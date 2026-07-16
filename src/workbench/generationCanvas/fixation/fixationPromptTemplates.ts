// 「定妆 / 定景」提示词写作模块——这是定妆功能的**核心壁垒**（工具调用已备，见 generationCanvasTools）。
//
// 纯函数、零 UI / store 依赖 → 可单测、可被 Tier1（浮条基础）与 Tier2（剧本驱动）**共用**：
//   - Tier1：用 buildBasicCharacterFixation / buildBasicSceneFixation 的基础默认（最基础那一档，谁都能用）。
//   - Tier2：调 buildFixationPrompt，喂**从剧本反推**的 expressions/outfits/props/palette 等贴合清单。
//
// 规律来源（实测固化，改这里前必读）：
//   docs/design/2026-06-06-character-scene-fixation-design.md §5.7（出图好的 10 条）+ §5.7.1（两条订正）。
//   订正1：每个标签必须**逐字列出**，不能让模型自由发挥（否则出光秃秃没字的图）。
//   订正2：内容必须**剧本驱动**，通用清单覆盖不到具体剧本（实测 v2 ≫ v1）。
// 模板结构对标已验证出图质量的 tests/ux/kie-direct-image2-v2.mjs。

import { getRuntimeLocale } from '../../../i18n/runtimeLocale'
import type { SupportedLocale } from '../../../i18n/translations'

export type FixationSubject = 'character' | 'scene'

export type FixationStyle = 'cinematic' | 'anime' | 'painterly' | 'cyber'

/** 风格行（规律7：用摄影/画风语言，不用 stunning/masterpiece 空词）。 */
export const FIXATION_STYLE_ROW: Record<FixationStyle, Record<SupportedLocale, string>> = {
  cinematic: {
    'zh-CN': '干净的电影感艺术书插画，35mm 柔光 + bounce，真实材质细节（布料褶皱、金属反光、做旧磨损）',
    en: 'clean cinematic art-book illustration, 35mm soft light + bounce, realistic material details (fabric folds, metal reflections, worn edges)',
    ru: 'чистая кинематографичная иллюстрация для артбука, мягкий свет 35mm + bounce, реалистичные материалы (складки ткани, металл, потертости)',
  },
  anime: {
    'zh-CN': '日系设定集画风，干净线稿，cel shading，高可读性',
    en: 'Japanese production-design sheet style, clean line art, cel shading, highly readable shapes',
    ru: 'японский стиль production design sheet, чистый лайн, cel shading, хорошо читаемые формы',
  },
  painterly: {
    'zh-CN': '半写实概念设定厚涂，painterly 渲染，强材质表现',
    en: 'semi-realistic painterly concept design, thick-brush rendering, strong material definition',
    ru: 'полуреалистичный painterly concept design, плотная живописная подача, сильная читаемость материалов',
  },
  cyber: {
    'zh-CN': 'techwear 设定页，UI 式排版，schematic 标注，金属/工业质感',
    en: 'techwear design sheet, UI-like layout, schematic callouts, metal and industrial material feel',
    ru: 'techwear design sheet, UI-композиция, schematic подписи, металл и индустриальные материалы',
  },
}

export type FixationIdBlock = {
  code?: string
  role?: string
  age?: string
  personality?: string[]
  signature?: string
  quote?: string
}

export type FixationContext = {
  subject: FixationSubject
  /** 角色名 / 场景名（放 prompt 前段当身份标签，规律4：首 10 词锁身份）。 */
  name: string
  style: FixationStyle
  /** 画面比例，缺省 16:9（实测身份板最佳）。 */
  aspectRatio?: string
  /** ID 信息块（规律9：简洁、逐行）。 */
  idBlock?: FixationIdBlock
  // —— 角色区块（剧本反推填，Tier1 用基础默认）——
  turnaround?: boolean // 三视图（正/侧/背）
  /** 表情清单：**逐字**列出（订正1）。如 ['冷峻警戒','罕见温柔']。 */
  expressions?: string[]
  /** 服装变体：逐字。如 ['雪地战斗服','日常休闲装']。 */
  outfits?: string[]
  /** 道具/装备：逐字 + 部位（用于引出线）。如 ['磁吸冲击护臂（左前臂）']。 */
  props?: string[]
  /** 剪影研究数量（0 = 不要）。 */
  silhouettes?: number
  // —— 场景区块 ——
  /** 时段：逐字。如 ['白天','黑夜','黄昏','雨']。 */
  times?: string[]
  /** 机位：逐字。如 ['广角','俯视','过肩']。 */
  angles?: string[]
  // —— 通用 ——
  /** 色板：hex + 中文角色（规律5）。 */
  palette?: { hex: string; role: string }[]
  /** UI/output locale. Defaults to the current interface language. */
  locale?: SupportedLocale
}

function joinList(items: readonly string[]): string {
  return items.filter((s) => s && s.trim()).map((s) => s.trim()).join(' / ')
}

type FixationCopy = {
  master: Record<FixationSubject, string>
  subject: string
  taskLabel: string
  boardName: Record<FixationSubject, string>
  background: string
  layout: (isScene: boolean) => string
  labelRule: string
  turnaround: string
  turnaroundItems: string
  expression: string
  outfit: string
  outfitTail: string
  props: string
  propsTail: string
  silhouette: string
  silhouetteTail: string
  times: string
  timesTail: string
  angles: string
  anglesTail: string
  palette: string
  paletteTail: string
  idInfo: string
  idTail: string
  quote: string
  idLabels: {
    name: string
    code: string
    role: string
    age: string
    personality: string
    signature: string
  }
  personalityJoin: string
  structureLock: string
  identityLock: string
  style: string
  styleReadable: string
  negative: string
}

const COPY: Record<SupportedLocale, FixationCopy> = {
  'zh-CN': {
    master: {
      character: '你是顶尖游戏/动漫概念美术大师，擅长详尽的角色身份板（character identity board）。',
      scene: '你是顶尖游戏/影视概念美术大师，擅长详尽的场景设定板（scene design board）。',
    },
    subject: '【主体】',
    taskLabel: '【任务】',
    boardName: { character: '角色身份板', scene: '场景设定板' },
    background: '柔和米白色纸质背景',
    layout: (isScene) => `电影感艺术书式**不对称**布局，**绝不用网格**——${isScene ? '主图（环境广角）略偏中心作视觉锚点' : '英雄全身立绘略偏中心作视觉锚点'}，周围以干净间距环绕排列各区块，细灰引导线连接，每块独立清晰、有呼吸空间、不堆叠、不裁切、不合并。`,
    labelRule: '【强制中文标注 — 缺任何一项视为失败】每个分组写中文章节大标题；每个子图下方写中文小标签，逐字如下：',
    turnaround: '三视图',
    turnaroundItems: '正面 / 侧面 / 背面',
    expression: '表情研究',
    outfit: '服装变体',
    outfitTail: '（各一张全身小图）',
    props: '道具与材质',
    propsTail: '（部位特写，用引出线连到中心人物对应部位）',
    silhouette: '剪影研究',
    silhouetteTail: '个黑色侧影',
    times: '时段',
    timesTail: '（**保持建筑结构/布局/机位完全相同，只改光照与天气**）',
    angles: '机位',
    anglesTail: '（保持场景所有元素/材质/配色完全相同，只改机位）',
    palette: '色板',
    paletteTail: '（色块横排，块下写 hex + 中文角色）',
    idInfo: 'ID 信息',
    idTail: '（左上角，简洁无衬线，每行短句）',
    quote: '右下角手写体引文',
    idLabels: { name: '名称', code: '代号', role: '身份', age: '年龄', personality: '性格', signature: '标志' },
    personalityJoin: '、',
    structureLock: '【结构锁定】所有视图保持相同建筑结构、相同布局、相同材质、相同视觉风格——同一个场景；比例一致，避免夸张透视。',
    identityLock: '【身份锁定】所有视角保持**相同面部 / 相同面部比例 / 相同发型 / 相同服装版型 / 相同身体比例 / 相同姿势语言 / 相同视觉个性**——同一个人；比例一致，避免夸张透视。',
    style: '【风格】',
    styleReadable: '。中文文字干净可读，章节标题与正文小字层次清楚。',
    negative: '【负向】不合并视角、不堆叠、不裁切肢体、不用网格；除标注文字外画面无其它文字、无水印。',
  },
  en: {
    master: {
      character: 'You are a top game/anime concept artist specializing in detailed character identity boards.',
      scene: 'You are a top game/film concept artist specializing in detailed scene design boards.',
    },
    subject: '[Subject] ',
    taskLabel: '[Task] ',
    boardName: { character: 'character identity board', scene: 'scene design board' },
    background: 'soft warm off-white paper background',
    layout: (isScene) => `cinematic art-book **asymmetrical** layout, **never a grid** — ${isScene ? 'main environment wide shot slightly off-center as the visual anchor' : 'hero full-body character illustration slightly off-center as the visual anchor'}, with surrounding sections arranged in clean spacing, thin gray guide lines, every block separate and readable, breathing room, no stacking, no cropping, no merging.`,
    labelRule: '[Required English labels - missing any item counts as failure] Each group must have an English section title; each sub-image must have the exact English label below it:',
    turnaround: 'Turnaround',
    turnaroundItems: 'Front / Side / Back',
    expression: 'Expression study',
    outfit: 'Outfit variants',
    outfitTail: '(one small full-body image for each)',
    props: 'Props and materials',
    propsTail: '(close-up detail, with callout lines connected to the matching body part)',
    silhouette: 'Silhouette study',
    silhouetteTail: 'black silhouettes',
    times: 'Time of day',
    timesTail: '(**keep the same architecture / layout / camera angle; only change lighting and weather**)',
    angles: 'Camera angles',
    anglesTail: '(keep every scene element / material / color palette identical; only change the camera angle)',
    palette: 'Color palette',
    paletteTail: '(horizontal swatches; write hex + role below each swatch)',
    idInfo: 'ID info',
    idTail: '(top-left, clean sans-serif, short lines)',
    quote: 'Bottom-right handwritten quote',
    idLabels: { name: 'Name', code: 'Code', role: 'Role', age: 'Age', personality: 'Personality', signature: 'Signature' },
    personalityJoin: ', ',
    structureLock: '[Structure lock] All views keep the same architecture, same layout, same materials, same visual style — the same scene. Consistent scale; avoid exaggerated perspective.',
    identityLock: '[Identity lock] All views keep the **same face / same facial proportions / same hairstyle / same outfit cut / same body proportions / same posture language / same visual personality** — the same person. Consistent scale; avoid exaggerated perspective.',
    style: '[Style] ',
    styleReadable: '. English text must be clean and readable, with clear hierarchy between section titles and small captions.',
    negative: '[Negative] Do not merge views, do not stack blocks, do not crop limbs, do not use a grid; no extra text except labels, no watermark.',
  },
  ru: {
    master: {
      character: 'Вы ведущий concept artist для игр/аниме и делаете подробные character identity boards.',
      scene: 'Вы ведущий concept artist для игр/кино и делаете подробные scene design boards.',
    },
    subject: '[Объект] ',
    taskLabel: '[Задача] ',
    boardName: { character: 'character identity board', scene: 'scene design board' },
    background: 'мягкий теплый бумажный фон off-white',
    layout: (isScene) => `кинематографичная артбук-композиция, **асимметричная**, **не сетка** — ${isScene ? 'главный широкий кадр окружения слегка смещен от центра как визуальный якорь' : 'герой в полный рост слегка смещен от центра как визуальный якорь'}, вокруг чисто разнесенные блоки, тонкие серые выносные линии, каждый блок отдельный и читаемый, есть воздух, без наложений, без обрезок, без слияния блоков.`,
    labelRule: '[Обязательные русские подписи - отсутствие любого пункта считается ошибкой] У каждой группы должен быть русский заголовок; под каждым подкадром должна быть точная русская подпись:',
    turnaround: 'Разворот персонажа',
    turnaroundItems: 'Спереди / Сбоку / Сзади',
    expression: 'Эмоции',
    outfit: 'Варианты костюма',
    outfitTail: '(по одному маленькому изображению в полный рост)',
    props: 'Предметы и материалы',
    propsTail: '(крупный план детали, с выносной линией к нужной части тела)',
    silhouette: 'Силуэты',
    silhouetteTail: 'черных силуэта',
    times: 'Время суток',
    timesTail: '(**сохранять ту же архитектуру / планировку / камеру; менять только свет и погоду**)',
    angles: 'Камеры',
    anglesTail: '(сохранять все элементы сцены / материалы / палитру; менять только камеру)',
    palette: 'Палитра',
    paletteTail: '(горизонтальные свотчи; под каждым написать hex + роль)',
    idInfo: 'ID инфо',
    idTail: '(слева сверху, чистый sans-serif, короткие строки)',
    quote: 'Рукописная цитата справа внизу',
    idLabels: { name: 'Имя', code: 'Код', role: 'Роль', age: 'Возраст', personality: 'Характер', signature: 'Особая примета' },
    personalityJoin: ', ',
    structureLock: '[Фиксация структуры] Во всех видах сохранять ту же архитектуру, ту же планировку, те же материалы и тот же визуальный стиль — это одна и та же сцена. Единый масштаб; избегать утрированной перспективы.',
    identityLock: '[Фиксация личности] Во всех ракурсах сохранять **то же лицо / те же пропорции лица / ту же прическу / тот же крой одежды / те же пропорции тела / тот же язык позы / ту же визуальную индивидуальность** — это один и тот же персонаж. Единый масштаб; избегать утрированной перспективы.',
    style: '[Стиль] ',
    styleReadable: '. Русский текст должен быть чистым и читаемым, с понятной иерархией заголовков и мелких подписей.',
    negative: '[Негатив] Не объединять ракурсы, не накладывать блоки, не обрезать конечности, не использовать сетку; без лишнего текста кроме подписей, без водяных знаков.',
  },
}

function quoteLabel(locale: SupportedLocale, label: string): string {
  return locale === 'zh-CN' ? `「${label}」` : `"${label}"`
}

function sectionLine(locale: SupportedLocale, label: string, value: string, tail = ''): string {
  if (locale === 'zh-CN') return `· ${quoteLabel(locale, label)}：${value}${tail}`
  return `· ${quoteLabel(locale, label)}: ${value}${tail}`
}

function idLine(locale: SupportedLocale, label: string, value: string): string {
  return locale === 'zh-CN' ? `${label}：${value}` : `${label}: ${value}`
}

function taskLine(locale: SupportedLocale, aspect: string, isScene: boolean, copy: FixationCopy): string {
  if (locale === 'zh-CN') {
    return `${copy.taskLabel}基于参考图，制作一张 ${aspect} ${copy.boardName[isScene ? 'scene' : 'character']}。${copy.background}，${copy.layout(isScene)}`
  }
  if (locale === 'ru') {
    return `${copy.taskLabel}На основе референса создайте ${aspect} ${copy.boardName[isScene ? 'scene' : 'character']}. ${copy.background}; ${copy.layout(isScene)}`
  }
  return `${copy.taskLabel}Using the reference image, create a ${aspect} ${copy.boardName[isScene ? 'scene' : 'character']}. ${copy.background}; ${copy.layout(isScene)}`
}

/**
 * 拼出「定妆/定景」身份板 prompt。始终注入 10 条规律的脚手架；按 ctx 勾选的区块逐字列标签。
 * 这是 Tier1/Tier2 唯一的 prompt 真相源。
 */
export function buildFixationPrompt(ctx: FixationContext): string {
  const locale = ctx.locale || getRuntimeLocale()
  const copy = COPY[locale]
  const aspect = ctx.aspectRatio || '16:9'
  const isScene = ctx.subject === 'scene'
  const lines: string[] = []

  // [规律1] 人设打底
  lines.push(copy.master[ctx.subject])

  // [规律4] 身份标签放前段
  const idTagBits = [ctx.name, ctx.idBlock?.role, ctx.idBlock?.signature].filter(Boolean) as string[]
  if (idTagBits.length) lines.push(`${copy.subject}${idTagBits.join(' ｜ ')}`)

  // 任务 + [规律2] 布局：中心锚点 + 不对称环绕，绝不网格
  lines.push(taskLine(locale, aspect, isScene, copy))

  // 强制逐字标注（订正1）
  lines.push(copy.labelRule)

  if (!isScene) {
    if (ctx.turnaround) lines.push(sectionLine(locale, copy.turnaround, copy.turnaroundItems))
    if (ctx.expressions?.length) lines.push(sectionLine(locale, copy.expression, joinList(ctx.expressions)))
    if (ctx.outfits?.length) lines.push(sectionLine(locale, copy.outfit, joinList(ctx.outfits), copy.outfitTail))
    if (ctx.props?.length) lines.push(sectionLine(locale, copy.props, joinList(ctx.props), copy.propsTail))
    if (ctx.silhouettes && ctx.silhouettes > 0) lines.push(sectionLine(locale, copy.silhouette, `${ctx.silhouettes} ${copy.silhouetteTail}`))
  } else {
    if (ctx.times?.length) lines.push(sectionLine(locale, copy.times, joinList(ctx.times), copy.timesTail))
    if (ctx.angles?.length) lines.push(sectionLine(locale, copy.angles, joinList(ctx.angles), copy.anglesTail))
  }

  // 色板（规律5）
  if (ctx.palette?.length) {
    lines.push(sectionLine(locale, copy.palette, ctx.palette.map((p) => `${p.hex} ${p.role}`).join(' / '), copy.paletteTail))
  }

  // ID 信息块（规律9）
  if (ctx.idBlock) {
    const id = ctx.idBlock
    const idLines = [
      idLine(locale, copy.idLabels.name, ctx.name),
      id.code ? idLine(locale, copy.idLabels.code, id.code) : '',
      id.role ? idLine(locale, copy.idLabels.role, id.role) : '',
      id.age ? idLine(locale, copy.idLabels.age, id.age) : '',
      id.personality?.length ? idLine(locale, copy.idLabels.personality, id.personality.join(copy.personalityJoin)) : '',
      id.signature ? idLine(locale, copy.idLabels.signature, id.signature) : '',
    ].filter(Boolean)
    const idSeparator = locale === 'zh-CN' ? '；' : '; '
    const idColon = locale === 'zh-CN' ? '：' : ': '
    lines.push(`· ${quoteLabel(locale, copy.idInfo)}${copy.idTail}${idColon}${idLines.join(idSeparator)}`)
    if (id.quote) lines.push(`· ${copy.quote}: ${locale === 'zh-CN' ? `「${id.quote}」` : `"${id.quote}"`}`)
  }

  // [规律3] 身份锁定 7 连（场景换成结构锁定）
  lines.push(isScene ? copy.structureLock : copy.identityLock)

  // [规律7/8] 风格 + 材质
  lines.push(`${copy.style}${FIXATION_STYLE_ROW[ctx.style][locale]}${copy.styleReadable}`)

  // [规律10] 负向约束
  lines.push(copy.negative)

  return lines.join('\n')
}

// —— Tier1 基础默认（最基础那一档：通用、谁都能用，但只到基础） ——

const BASIC_EXPRESSIONS: Record<SupportedLocale, string[]> = {
  'zh-CN': ['平静', '微笑', '愤怒', '惊讶'],
  en: ['Calm', 'Smile', 'Angry', 'Surprised'],
  ru: ['Спокойствие', 'Улыбка', 'Злость', 'Удивление'],
}

const BASIC_TIMES: Record<SupportedLocale, string[]> = {
  'zh-CN': ['白天', '黑夜', '黄昏'],
  en: ['Day', 'Night', 'Dusk'],
  ru: ['День', 'Ночь', 'Сумерки'],
}

const BASIC_ANGLES: Record<SupportedLocale, string[]> = {
  'zh-CN': ['广角', '俯视'],
  en: ['Wide angle', 'Top-down'],
  ru: ['Широкий план', 'Вид сверху'],
}

function extractLegacySection(prompt: string, label: string): string[] {
  const match = prompt.match(new RegExp(`(?:·\\s*)?[「"]${label}[」"]\\s*[：:]\\s*([^\\n（(]+)`))
  if (!match?.[1]) return []
  return match[1].split('/').map((part) => part.trim()).filter(Boolean)
}

function extractLegacyName(prompt: string): string {
  const subject = prompt.match(/【主体】([^\n]+)/)?.[1]?.trim()
  if (subject) return subject.split(/[｜|]/)[0]?.trim() || 'Image'
  const idName = prompt.match(/名称[:：]([^；;\n]+)/)?.[1]?.trim()
  return idName || 'Image'
}

function extractLegacyRole(prompt: string): string | undefined {
  return prompt.match(/身份[:：]([^；;\n]+)/)?.[1]?.trim()
}

function extractLegacyAspect(prompt: string): string | undefined {
  return prompt.match(/制作一张\s+([0-9]+:[0-9]+)/)?.[1]
}

function sameItems(items: readonly string[], expected: readonly string[]): boolean {
  return items.length === expected.length && items.every((item, index) => item === expected[index])
}

/**
 * Upgrade prompts created by the pre-i18n Look lock template. This deliberately
 * only touches prompts with exact legacy markers, so regular user-written
 * Chinese prompts remain user content.
 */
export function localizeLegacyFixationPrompt(prompt: string | undefined, locale: SupportedLocale): string | null {
  if (!prompt || locale === 'zh-CN') return null
  if (!prompt.includes('【强制中文标注') || (!prompt.includes('身份板') && !prompt.includes('设定板'))) return null

  const subject: FixationSubject = prompt.includes('场景设定板') ? 'scene' : 'character'
  const name = extractLegacyName(prompt)
  const role = extractLegacyRole(prompt)
  const aspectRatio = extractLegacyAspect(prompt)

  if (subject === 'scene') {
    const legacyTimes = extractLegacySection(prompt, '时段')
    const legacyAngles = extractLegacySection(prompt, '机位')
    return buildFixationPrompt({
      subject,
      name,
      style: 'cinematic',
      aspectRatio,
      times: sameItems(legacyTimes, BASIC_TIMES['zh-CN']) ? BASIC_TIMES[locale] : (legacyTimes.length ? legacyTimes : BASIC_TIMES[locale]),
      angles: sameItems(legacyAngles, BASIC_ANGLES['zh-CN']) ? BASIC_ANGLES[locale] : (legacyAngles.length ? legacyAngles : BASIC_ANGLES[locale]),
      idBlock: role ? { role } : undefined,
      locale,
    })
  }

  const legacyExpressions = extractLegacySection(prompt, '表情研究')
  const silhouettes = Number(prompt.match(/剪影研究[」"]\s*[：:]\s*(\d+)/)?.[1] || 3)
  return buildFixationPrompt({
    subject,
    name,
    style: 'cinematic',
    aspectRatio,
    turnaround: prompt.includes('三视图'),
    expressions: sameItems(legacyExpressions, BASIC_EXPRESSIONS['zh-CN'])
      ? BASIC_EXPRESSIONS[locale]
      : (legacyExpressions.length ? legacyExpressions : BASIC_EXPRESSIONS[locale]),
    silhouettes: Number.isFinite(silhouettes) ? silhouettes : 3,
    idBlock: role ? { role } : undefined,
    locale,
  })
}

/** Tier1 角色基础定妆：三视图 + 4 基础表情 + 剪影 + ID 块。只需名字（+ 可选一句设定）。 */
export function buildBasicCharacterFixation(name: string, opts: { tagline?: string; style?: FixationStyle; locale?: SupportedLocale } = {}): string {
  const locale = opts.locale || getRuntimeLocale()
  return buildFixationPrompt({
    subject: 'character',
    name,
    style: opts.style || 'cinematic',
    turnaround: true,
    expressions: BASIC_EXPRESSIONS[locale],
    silhouettes: 3,
    idBlock: { role: opts.tagline },
    locale,
  })
}

/** Tier1 场景基础定景：3 时段 + 2 机位。 */
export function buildBasicSceneFixation(name: string, opts: { tagline?: string; style?: FixationStyle; locale?: SupportedLocale } = {}): string {
  const locale = opts.locale || getRuntimeLocale()
  return buildFixationPrompt({
    subject: 'scene',
    name,
    style: opts.style || 'cinematic',
    times: BASIC_TIMES[locale],
    angles: BASIC_ANGLES[locale],
    idBlock: opts.tagline ? { role: opts.tagline } : undefined,
    locale,
  })
}
