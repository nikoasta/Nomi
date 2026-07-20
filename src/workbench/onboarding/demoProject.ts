/**
 * 引导旅途的预置内容：「修好一个小机器人」示例片。
 *
 * 全是事先备好的数据——剧本文本（打字回放用）+ 分镜方案（落画布走真实流水线
 * storyboardPlanToCreateNodesArgs + create_canvas_nodes）。零模型、零额度、零网络。
 * 两个固定角色（小孩 + 小机器人）正好演「身份锁」卖点；屋顶夕阳镜演站位 + 运镜。
 */
import { buildAnchorSheetPrompt, type StoryboardPlan } from '../generationCanvas/agent/storyboardPlan'
import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/translations'
import type { WorkbenchProjectRecordV1, WorkbenchProjectPayload } from '../project/projectRecordSchema'

/** 示例项目名（带「示例：」前缀，和用户真项目一眼区分）。 */
export const DEMO_PROJECT_NAME = '示例：修好一个小机器人'

/** seedKey：带它的项目永不被空壳 GC 回收，且与真项目隔离（projectRepository 机制）。 */
export const DEMO_PROJECT_SEED_KEY = 'example:robot-rescue'

type DemoAnchor = StoryboardPlan['anchors'][number]
type DemoShot = StoryboardPlan['shots'][number]

type DemoProjectContent = {
  projectName: string
  storyTitle: string
  storyLines: string[]
  anchors: DemoAnchor[]
  shots: DemoShot[]
}

const DEMO_CONTENT: Record<SupportedLocale, DemoProjectContent> = {
  'zh-CN': {
    projectName: DEMO_PROJECT_NAME,
    storyTitle: '修好一个小机器人',
    storyLines: [
      '黄昏的小巷，一个坏掉的小机器人歪在墙角，零件散落一地。',
      '放学路过的小孩蹲下来，好奇地看着它。',
      '他把小机器人抱回家，在台灯下一颗螺丝一颗螺丝地修。',
      '当最后一颗螺丝拧紧，小机器人的眼睛「叮」地亮了起来。',
      '两个人爬上屋顶，并排坐着，看夕阳一点点沉下去。',
    ],
    anchors: [
      {
        id: 'kid',
        kind: 'character',
        name: '小孩',
        description: '约十岁的小男孩，短发，黄色连帽卫衣，背一个旧书包，眼神好奇温和。',
        carrier: 'visual',
      },
      {
        id: 'robot',
        kind: 'character',
        name: '小机器人',
        description: '巴掌大的圆头旧机器人，磨损的银色外壳，胸口一盏会亮的暖黄小灯，动作笨拙可爱。',
        carrier: 'visual',
      },
      {
        id: 'rooftop',
        kind: 'scene',
        name: '黄昏屋顶',
        description: '城市旧居民楼的屋顶，水箱与晾衣绳，远处楼群被夕阳染成橘金色。',
        carrier: 'visual',
      },
    ],
    shots: [
      { index: 1, durationSec: 4, anchorIds: ['robot'], prompt: '黄昏小巷远景，坏掉的小机器人歪在墙角，零件散落，暖光斜照。' },
      { index: 2, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: '小孩蹲下，好奇地看着墙角的小机器人，中景。' },
      { index: 3, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: '小孩抱起小机器人走回家，背影跟镜。' },
      { index: 4, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: '台灯下，小孩用螺丝刀专注地修理，手部特写。' },
      { index: 5, durationSec: 3, anchorIds: ['robot'], prompt: '小机器人胸口的暖黄小灯「叮」地亮起，眼睛点亮，特写。' },
      { index: 6, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: '小孩与小机器人对视，机器人歪头，双人中景。' },
      { index: 7, durationSec: 4, anchorIds: ['kid', 'robot', 'rooftop'], prompt: '屋顶上两个并排坐着，背对镜头看远方，中景。' },
      { index: 8, durationSec: 5, anchorIds: ['kid', 'robot', 'rooftop'], prompt: '夕阳下定格，相机缓缓拉远，剪影与橘金天空。' },
    ],
  },
  en: {
    projectName: 'Example: Repairing a little robot',
    storyTitle: 'Repairing a little robot',
    storyLines: [
      'At dusk in a narrow alley, a broken little robot leans against the wall with parts scattered around it.',
      'A child walking home from school crouches down and looks at it with curiosity.',
      'He carries the robot home and repairs it under a desk lamp, screw by screw.',
      'When the last screw is tightened, the robot eyes light up with a tiny chime.',
      'The two climb onto the rooftop, sit side by side, and watch the sun slowly sink.',
    ],
    anchors: [
      {
        id: 'kid',
        kind: 'character',
        name: 'Child',
        description: 'A boy around ten years old, short hair, yellow hoodie, old backpack, curious and gentle eyes.',
        carrier: 'visual',
      },
      {
        id: 'robot',
        kind: 'character',
        name: 'Little robot',
        description: 'A palm-sized old robot with a round head, scuffed silver shell, warm amber chest light, clumsy and adorable movement.',
        carrier: 'visual',
      },
      {
        id: 'rooftop',
        kind: 'scene',
        name: 'Dusk rooftop',
        description: 'The rooftop of an old city apartment building, water tanks and clotheslines, distant buildings tinted orange-gold by sunset.',
        carrier: 'visual',
      },
    ],
    shots: [
      { index: 1, durationSec: 4, anchorIds: ['robot'], prompt: 'Wide shot of a dusk alley, the broken little robot leaning against a wall, scattered parts, warm sidelight.' },
      { index: 2, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: 'The child crouches and looks curiously at the little robot in the corner, medium shot.' },
      { index: 3, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: 'The child carries the little robot home, following from behind.' },
      { index: 4, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: 'Under a desk lamp, the child repairs the robot with a screwdriver, close-up on the hands.' },
      { index: 5, durationSec: 3, anchorIds: ['robot'], prompt: 'The robot warm amber chest light turns on with a tiny chime, eyes lighting up, close-up.' },
      { index: 6, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: 'The child and the robot look at each other; the robot tilts its head, two-shot medium.' },
      { index: 7, durationSec: 4, anchorIds: ['kid', 'robot', 'rooftop'], prompt: 'On the rooftop, the two sit side by side with their backs to camera, looking into the distance, medium shot.' },
      { index: 8, durationSec: 5, anchorIds: ['kid', 'robot', 'rooftop'], prompt: 'Final sunset moment, camera slowly pulls back, silhouettes against an orange-gold sky.' },
    ],
  },
  ru: {
    projectName: 'Пример: ремонт маленького робота',
    storyTitle: 'Ремонт маленького робота',
    storyLines: [
      'В сумеречном переулке сломанный маленький робот прислонился к стене, вокруг рассыпаны детали.',
      'Ребенок возвращается из школы, приседает рядом и с любопытством смотрит на него.',
      'Он приносит робота домой и чинит его под настольной лампой, винтик за винтиком.',
      'Когда последний винтик закручен, глаза робота загораются с тихим звоном.',
      'Они вдвоем поднимаются на крышу, садятся рядом и смотрят, как солнце медленно садится.',
    ],
    anchors: [
      {
        id: 'kid',
        kind: 'character',
        name: 'Ребенок',
        description: 'Мальчик около десяти лет, короткие волосы, желтая худи, старый рюкзак, любопытный и добрый взгляд.',
        carrier: 'visual',
      },
      {
        id: 'robot',
        kind: 'character',
        name: 'Маленький робот',
        description: 'Старый робот размером с ладонь, круглая голова, потертый серебристый корпус, теплый янтарный огонек на груди, неуклюжий и милый.',
        carrier: 'visual',
      },
      {
        id: 'rooftop',
        kind: 'scene',
        name: 'Крыша на закате',
        description: 'Крыша старого городского дома, баки и бельевые веревки, дальние здания окрашены закатом в оранжево-золотой цвет.',
        carrier: 'visual',
      },
    ],
    shots: [
      { index: 1, durationSec: 4, anchorIds: ['robot'], prompt: 'Общий план сумеречного переулка: сломанный маленький робот у стены, разбросанные детали, теплый боковой свет.' },
      { index: 2, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: 'Ребенок приседает и с любопытством смотрит на маленького робота в углу, средний план.' },
      { index: 3, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: 'Ребенок несет маленького робота домой, камера следует со спины.' },
      { index: 4, durationSec: 4, anchorIds: ['kid', 'robot'], prompt: 'Под настольной лампой ребенок чинит робота отверткой, крупный план рук.' },
      { index: 5, durationSec: 3, anchorIds: ['robot'], prompt: 'Теплый янтарный огонек на груди робота включается с тихим звоном, глаза загораются, крупный план.' },
      { index: 6, durationSec: 3, anchorIds: ['kid', 'robot'], prompt: 'Ребенок и робот смотрят друг на друга; робот наклоняет голову, средний план на двоих.' },
      { index: 7, durationSec: 4, anchorIds: ['kid', 'robot', 'rooftop'], prompt: 'На крыше они сидят рядом спиной к камере и смотрят вдаль, средний план.' },
      { index: 8, durationSec: 5, anchorIds: ['kid', 'robot', 'rooftop'], prompt: 'Финальный момент на закате: камера медленно отъезжает, силуэты на фоне оранжево-золотого неба.' },
    ],
  },
}

function demoContent(locale: SupportedLocale): DemoProjectContent {
  return DEMO_CONTENT[locale] ?? DEMO_CONTENT['zh-CN']
}

const DEMO_TEXT_TRANSLATIONS = new Map<string, Record<SupportedLocale, string>>()

function rememberDemoText(values: Record<SupportedLocale, string>): void {
  SUPPORTED_LOCALES.forEach((sourceLocale) => {
    const source = values[sourceLocale]
    if (source) DEMO_TEXT_TRANSLATIONS.set(source, values)
  })
}

function seedDemoTextTranslations(): void {
  const zh = DEMO_CONTENT['zh-CN']
  rememberDemoText({
    'zh-CN': zh.projectName,
    en: DEMO_CONTENT.en.projectName,
    ru: DEMO_CONTENT.ru.projectName,
  })
  rememberDemoText({
    'zh-CN': zh.storyTitle,
    en: DEMO_CONTENT.en.storyTitle,
    ru: DEMO_CONTENT.ru.storyTitle,
  })
  rememberDemoText({
    'zh-CN': zh.storyLines.join('\n'),
    en: DEMO_CONTENT.en.storyLines.join('\n'),
    ru: DEMO_CONTENT.ru.storyLines.join('\n'),
  })
  zh.storyLines.forEach((line, index) => rememberDemoText({
    'zh-CN': line,
    en: DEMO_CONTENT.en.storyLines[index] ?? line,
    ru: DEMO_CONTENT.ru.storyLines[index] ?? line,
  }))
  zh.anchors.forEach((anchor, index) => {
    const enAnchor = DEMO_CONTENT.en.anchors[index]
    const ruAnchor = DEMO_CONTENT.ru.anchors[index]
    rememberDemoText({
      'zh-CN': anchor.name,
      en: enAnchor?.name ?? anchor.name,
      ru: ruAnchor?.name ?? anchor.name,
    })
    rememberDemoText({
      'zh-CN': anchor.description,
      en: enAnchor?.description ?? anchor.description,
      ru: ruAnchor?.description ?? anchor.description,
    })
    rememberDemoText({
      'zh-CN': buildAnchorSheetPrompt(anchor, 'zh-CN'),
      en: enAnchor ? buildAnchorSheetPrompt(enAnchor, 'en') : buildAnchorSheetPrompt(anchor, 'zh-CN'),
      ru: ruAnchor ? buildAnchorSheetPrompt(ruAnchor, 'ru') : buildAnchorSheetPrompt(anchor, 'zh-CN'),
    })
  })
  zh.shots.forEach((shot, index) => rememberDemoText({
    'zh-CN': shot.prompt,
    en: DEMO_CONTENT.en.shots[index]?.prompt ?? shot.prompt,
    ru: DEMO_CONTENT.ru.shots[index]?.prompt ?? shot.prompt,
  }))
}

function translateDemoValue(locale: SupportedLocale, value: string): string {
  const exact = DEMO_TEXT_TRANSLATIONS.get(value)?.[locale]
  if (exact) return exact
  const shotTitle = value.match(/^镜头\s*(\d+)$/u)
  if (shotTitle) {
    if (locale === 'ru') return `Кадр ${shotTitle[1]}`
    if (locale === 'en') return `Shot ${shotTitle[1]}`
  }
  return value
}

seedDemoTextTranslations()

export function translateDemoProjectText(locale: SupportedLocale, value: unknown): string {
  const text = typeof value === 'string' ? value : String(value ?? '')
  return translateDemoValue(locale, text)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function translateDemoPayloadValue(locale: SupportedLocale, value: unknown): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    const translated = translateDemoProjectText(locale, value)
    return { value: translated, changed: translated !== value }
  }
  if (Array.isArray(value)) {
    let changed = false
    const translated = value.map((item) => {
      const next = translateDemoPayloadValue(locale, item)
      changed ||= next.changed
      return next.value
    })
    return { value: changed ? translated : value, changed }
  }
  if (isPlainRecord(value)) {
    let changed = false
    const translated: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) {
      const next = translateDemoPayloadValue(locale, item)
      changed ||= next.changed
      translated[key] = next.value
    }
    return { value: changed ? translated : value, changed }
  }
  return { value, changed: false }
}

export function localizeDemoProjectPayload(locale: SupportedLocale, payload: WorkbenchProjectPayload): WorkbenchProjectPayload {
  const translated = translateDemoPayloadValue(locale, payload)
  return translated.changed ? translated.value as WorkbenchProjectPayload : payload
}

export function localizeDemoProjectRecord(
  locale: SupportedLocale,
  record: WorkbenchProjectRecordV1,
): WorkbenchProjectRecordV1 {
  if (record.seedKey !== DEMO_PROJECT_SEED_KEY) return record
  const name = translateDemoProjectText(locale, record.name)
  const payload = localizeDemoProjectPayload(locale, record.payload)
  if (name === record.name && payload === record.payload) return record
  return { ...record, name, payload }
}

export function getDemoProjectName(locale: SupportedLocale): string {
  return demoContent(locale).projectName
}

/** 打字回放的剧本（无台词暖系微叙事，逐字敲进创作编辑器）。 */
export const DEMO_STORY = DEMO_CONTENT['zh-CN'].storyLines.join('\n')

export function getDemoStory(locale: SupportedLocale): string {
  return demoContent(locale).storyLines.join('\n')
}

/**
 * 分镜方案：2 个角色锚（小孩 / 小机器人）+ 1 个场景锚（屋顶）+ 8 个镜头。
 * clientId 稳定（kid / robot / rooftop / shot-N），落画布后控制器靠 clientIdToNodeId
 * 拿到真实节点 id 给聚光精准指向。
 */
export function buildDemoStoryboardPlan(locale: SupportedLocale = 'zh-CN'): StoryboardPlan {
  const content = demoContent(locale)
  return {
    title: content.storyTitle,
    anchors: content.anchors,
    shots: content.shots,
  }
}

/**
 * 画布段每个聚光 beat 指向哪个 clientId（控制器落画布后用 clientIdToNodeId 解析成
 * `[data-node-id="…"]`）。staging/trajectory 指向对应镜头卡，气泡讲「这是什么 + 跟 AI 说一句」
 * ——这两个工具现状只有对话入口、没有 UI 按钮（诚实，不假装有按钮）。
 */
export const DEMO_CANVAS_SPOTLIGHTS: Record<'character' | 'staging' | 'trajectory' | 'generate', string> = {
  character: 'kid',
  staging: 'shot-7',
  trajectory: 'shot-8',
  generate: 'shot-1',
}

/**
 * 预置成图：clientId → 打包图 URL。用真 Nomi(Nano Banana + 角色参考锁一致)生成的 10 张
 * 「修好一个小机器人」成片，压成 720px JPEG 随包走（~920K，零网络零额度）。落画布后由 runner
 * 注入对应节点的 result(status=success) → 画布即显成片，像一个做完的示例项目。
 * 用 new URL(import.meta.url) 静态字面量 = Vite 标准资产处理，类型安全、随构建打包。
 * rooftop(场景卡)复用屋顶日落镜 shot-8;8 镜各用自己的成图。
 */
export const DEMO_NODE_IMAGES: Record<string, string> = {
  kid: new URL('./assets/robot/kid.jpg', import.meta.url).href,
  robot: new URL('./assets/robot/robot.jpg', import.meta.url).href,
  rooftop: new URL('./assets/robot/shot-8.jpg', import.meta.url).href,
  'shot-1': new URL('./assets/robot/shot-1.jpg', import.meta.url).href,
  'shot-2': new URL('./assets/robot/shot-2.jpg', import.meta.url).href,
  'shot-3': new URL('./assets/robot/shot-3.jpg', import.meta.url).href,
  'shot-4': new URL('./assets/robot/shot-4.jpg', import.meta.url).href,
  'shot-5': new URL('./assets/robot/shot-5.jpg', import.meta.url).href,
  'shot-6': new URL('./assets/robot/shot-6.jpg', import.meta.url).href,
  'shot-7': new URL('./assets/robot/shot-7.jpg', import.meta.url).href,
  'shot-8': new URL('./assets/robot/shot-8.jpg', import.meta.url).href,
}
