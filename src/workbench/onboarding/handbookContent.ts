/**
 * 新手上手手册的唯一内容源（纯数据 + 文案，无 React、无样式）。
 *
 * 两处出口共用这一份：
 *   ① App 内 `HandbookPanel.tsx`（React overlay，把 iconKey 映射成已登记的 tabler 组件）
 *   ② `scripts/build-handbook-html.mjs`（渲成独立 marketing/handbook.html，发群 + 挂官网）
 * 改文案只改这里，两处自动同步。iconKey = tabler 图标名去掉 `Icon` 前缀的 kebab（如 `pencil`）：
 * html 渲 `ti ti-<iconKey>`；React panel 用 HANDBOOK_ICON map（key→vendor 组件，都已登记，build 安全）。
 */
import type { SupportedLocale } from '../../i18n/translations'

export type HandbookPipelineStep = { iconKey: string; label: string; accent?: boolean }
export type HandbookFirstWinStep = { n: number; title: string; body: string }
export type HandbookIntentRoute = {
  iconKey: string
  title: string
  body: string
  /** 标新能力（0.16）。 */
  badge?: string
  /** 缺口诚实标——渲成 warning 配色。 */
  warn?: boolean
}
export type HandbookGotcha = { iconKey: string; title: string; body: string }

/** 顶部一行流水线图：写故事 → 拆分镜 → 落画布 → 锁身份/运镜 → 时间轴 → 导出。 */
export const HANDBOOK_PIPELINE: HandbookPipelineStep[] = [
  { iconKey: 'pencil', label: '写故事' },
  { iconKey: 'scissors', label: 'AI 拆分镜' },
  { iconKey: 'layout-grid', label: '落画布' },
  { iconKey: 'wand', label: '锁身份/运镜' },
  { iconKey: 'timeline', label: '时间轴' },
  { iconKey: 'movie', label: '导出 MP4', accent: true },
]

/** 90 秒先尝甜头：不用读完手册，先看一条片自己跑出来。 */
export const HANDBOOK_FIRST_WIN: HandbookFirstWinStep[] = [
  { n: 1, title: '看回放', body: '首页点「60 秒看 Nomi 怎么出片」，零额度看整条流水线跑一遍。' },
  { n: 2, title: '接一个模型', body: '用自己的 Key，或接 Agnes 免费网关（文 / 图 / 视全解锁）。' },
  { n: 3, title: '写一句 + 拆镜', body: '在创作区写下故事，说「拆成镜头」——可选图片分镜（先定画面，满意再转视频）或视频分镜，一键铺成画布。' },
  { n: 4, title: '生成 + 导出', body: '点镜头卡的生成出图，排进时间轴，右上导出 MP4。' },
]

/** 「我想做 X → 走这条路」：能做的指清楚路径，做不到的当场标 ⚠️。 */
export const HANDBOOK_INTENT_ROUTES: HandbookIntentRoute[] = [
  {
    iconKey: 'user-check',
    title: '让同一个人每个镜头长一样',
    body: '用身份卡锁脸 → 连到每个镜头当参考。Nomi 的招牌能力。',
  },
  {
    iconKey: 'box',
    title: '控制谁站哪、朝哪',
    body: '用 3D 站位图摆一下 → AI 照着画。',
  },
  {
    iconKey: 'device-gamepad-2',
    title: '让角色走起来、做动作、要运镜',
    body: '游戏式 3D 操控：WASD 走位 + 动作库 + 摆相机，录一段 take 导出成参考视频喂生成。',
    badge: '0.16 新',
  },
  {
    iconKey: 'gift',
    title: '没有 API 额度，想先白嫖试试',
    body: '模型设置接 Agnes AI，一个 Key 解锁文本 / 图 / 视频，无限期免费。',
    badge: '0.16 新',
  },
  {
    iconKey: 'typography',
    title: '加字幕、标题卡',
    body: '进时间轴预览区，节奏你说了算。',
  },
  {
    iconKey: 'alert-triangle',
    title: '想要精确对口型 / 唇形同步',
    body: '暂不支持，这段先跳过——不藏不糊弄。',
    warn: true,
  },
]

/** 卡住了看这里：四个真实坑（都在反馈雷达 / changelog 里真出现过）。 */
export const HANDBOOK_GOTCHAS: HandbookGotcha[] = [
  {
    iconKey: 'plug-connected-x',
    title: '接了模型却不能生成',
    body: '多半缺「文本大脑」。模型设置里加一个文本模型，拆镜 / 对话才转得起来。',
  },
  {
    iconKey: 'mood-confuzed',
    title: '每个镜头脸都不一样',
    body: '把身份卡连到镜头当参考——没连，模型就分不清谁是谁。',
  },
  {
    iconKey: 'alert-circle',
    title: '模型「连了用不了」',
    body: '看报错提示：多半是账号档位（要会员 / 企业 Key / 网页授权），按提示开通即可。',
  },
  {
    iconKey: 'volume-off',
    title: '导出后没声音',
    body: '确认音频已在时间轴的音频轨上；最新版导出混音已修。',
  },
]

export const HANDBOOK_TITLE = 'Nomi 一页上手'
export const HANDBOOK_SUBTITLE = '本地优先的 AI 视频创作台 · 从一句话到一条成片'

export type HandbookContent = {
  title: string
  subtitle: string
  pipelineIntro: string
  firstWinTitle: string
  firstWinBody: string
  routesTitle: string
  routesBody: string
  gotchasTitle: string
  pipeline: HandbookPipelineStep[]
  firstWin: HandbookFirstWinStep[]
  intentRoutes: HandbookIntentRoute[]
  gotchas: HandbookGotcha[]
}

const HANDBOOK_CONTENT_ZH: HandbookContent = {
  title: HANDBOOK_TITLE,
  subtitle: HANDBOOK_SUBTITLE,
  pipelineIntro: '一条流水线，全程在你眼皮底下',
  firstWinTitle: '90 秒先尝到甜头',
  firstWinBody: '不用读完手册——先看一条片自己跑出来，再上手做你自己的。',
  routesTitle: '我想做 X → 走这条路',
  routesBody: '能做的指清楚路径，做不到的当场标，不让你撞墙找半天。',
  gotchasTitle: '卡住了看这里',
  pipeline: HANDBOOK_PIPELINE,
  firstWin: HANDBOOK_FIRST_WIN,
  intentRoutes: HANDBOOK_INTENT_ROUTES,
  gotchas: HANDBOOK_GOTCHAS,
}

const HANDBOOK_CONTENT_EN: HandbookContent = {
  title: 'Nomi one-page guide',
  subtitle: 'Local-first AI video studio · from one sentence to a finished cut',
  pipelineIntro: 'One pipeline, visible from start to finish',
  firstWinTitle: 'Get a first win in 90 seconds',
  firstWinBody: 'You do not need to read the whole guide first. Watch one video run itself, then make your own.',
  routesTitle: 'I want to do X → take this route',
  routesBody: 'Supported paths are clear, and missing features are marked upfront.',
  gotchasTitle: 'If you get stuck',
  pipeline: [
    { iconKey: 'pencil', label: 'Write story' },
    { iconKey: 'scissors', label: 'AI shot breakdown' },
    { iconKey: 'layout-grid', label: 'Canvas' },
    { iconKey: 'wand', label: 'Identity / camera' },
    { iconKey: 'timeline', label: 'Timeline' },
    { iconKey: 'movie', label: 'Export MP4', accent: true },
  ],
  firstWin: [
    { n: 1, title: 'Watch the replay', body: 'On the home screen, start the 60-second Nomi walkthrough and see the full pipeline with no credits spent.' },
    { n: 2, title: 'Connect one model', body: 'Use your own key, or connect the Agnes free gateway to unlock text, image, and video.' },
    { n: 3, title: 'Write one line + split shots', body: 'Write a story in the creation area and ask for shot breakdown. Choose image-first boards or video boards, then place them on the canvas.' },
    { n: 4, title: 'Generate + export', body: 'Generate from the shot cards, arrange them on the timeline, and export MP4 from the top right.' },
  ],
  intentRoutes: [
    {
      iconKey: 'user-check',
      title: 'Keep the same person across shots',
      body: 'Use an identity card to lock the face, then connect it to every shot as a reference.',
    },
    {
      iconKey: 'box',
      title: 'Control who stands where',
      body: 'Set up a 3D staging reference and AI follows the layout.',
    },
    {
      iconKey: 'device-gamepad-2',
      title: 'Make characters move or add camera motion',
      body: 'Use game-style 3D controls: WASD movement, action presets, camera placement, and a recorded take as generation reference.',
      badge: 'New in 0.16',
    },
    {
      iconKey: 'gift',
      title: 'No API credits yet',
      body: 'Connect Agnes AI in model setup: one key unlocks text, image, and video for free.',
      badge: 'New in 0.16',
    },
    {
      iconKey: 'typography',
      title: 'Add captions and title cards',
      body: 'Use the timeline preview area and tune the rhythm yourself.',
    },
    {
      iconKey: 'alert-triangle',
      title: 'Precise lip sync',
      body: 'Not supported yet. This is marked honestly instead of hidden behind vague wording.',
      warn: true,
    },
  ],
  gotchas: [
    {
      iconKey: 'plug-connected-x',
      title: 'Model connected but generation does not work',
      body: 'Most often the text brain is missing. Add a text model in model setup so shot breakdown and chat can run.',
    },
    {
      iconKey: 'mood-confuzed',
      title: 'Faces change between shots',
      body: 'Connect the identity card to the shot as a reference. Without it, the model cannot know who is who.',
    },
    {
      iconKey: 'alert-circle',
      title: 'Model is connected but unusable',
      body: 'Check the error message. It is often an account tier, membership, enterprise key, or web authorization requirement.',
    },
    {
      iconKey: 'volume-off',
      title: 'No sound after export',
      body: 'Confirm that audio is on the timeline audio track. Export mixing is fixed in the latest build.',
    },
  ],
}

const HANDBOOK_CONTENT_RU: HandbookContent = {
  title: 'Nomi: короткое руководство',
  subtitle: 'Локальная AI-студия видео · от одной фразы до готового ролика',
  pipelineIntro: 'Один процесс, все шаги видны',
  firstWinTitle: 'Первый результат за 90 секунд',
  firstWinBody: 'Не нужно читать все руководство. Сначала посмотрите, как один ролик собирается сам, затем сделайте свой.',
  routesTitle: 'Я хочу сделать X → вот путь',
  routesBody: 'Поддержанные сценарии показаны прямо, а отсутствующие возможности отмечены заранее.',
  gotchasTitle: 'Если застряли',
  pipeline: [
    { iconKey: 'pencil', label: 'Сценарий' },
    { iconKey: 'scissors', label: 'AI разбивка' },
    { iconKey: 'layout-grid', label: 'Холст' },
    { iconKey: 'wand', label: 'Личность / камера' },
    { iconKey: 'timeline', label: 'Таймлайн' },
    { iconKey: 'movie', label: 'Экспорт MP4', accent: true },
  ],
  firstWin: [
    { n: 1, title: 'Посмотрите replay', body: 'На главном экране запустите 60-секундный показ Nomi и увидьте весь процесс без траты лимитов.' },
    { n: 2, title: 'Подключите модель', body: 'Используйте свой ключ или подключите бесплатный шлюз Agnes для текста, изображений и видео.' },
    { n: 3, title: 'Напишите фразу + разбейте на кадры', body: 'Напишите историю в области сценария и попросите разбить ее на кадры. Можно начать с картинок или сразу с видео.' },
    { n: 4, title: 'Сгенерируйте и экспортируйте', body: 'Запустите генерацию на карточках кадров, разложите их на таймлайне и экспортируйте MP4 сверху справа.' },
  ],
  intentRoutes: [
    {
      iconKey: 'user-check',
      title: 'Один и тот же человек во всех кадрах',
      body: 'Создайте карточку идентичности, чтобы зафиксировать лицо, и подключите ее к каждому кадру как reference.',
    },
    {
      iconKey: 'box',
      title: 'Контролировать, кто где стоит',
      body: 'Соберите 3D-референс расстановки, и AI будет следовать этой схеме.',
    },
    {
      iconKey: 'device-gamepad-2',
      title: 'Движение персонажей и камера',
      body: 'Используйте 3D-управление как в игре: WASD, набор действий, постановку камеры и записанный take как reference.',
      badge: 'Новое в 0.16',
    },
    {
      iconKey: 'gift',
      title: 'Пока нет API-лимитов',
      body: 'Подключите Agnes AI в настройке моделей: один ключ открывает текст, изображения и видео бесплатно.',
      badge: 'Новое в 0.16',
    },
    {
      iconKey: 'typography',
      title: 'Добавить субтитры и титры',
      body: 'Перейдите в предпросмотр таймлайна и настройте ритм.',
    },
    {
      iconKey: 'alert-triangle',
      title: 'Точный lip sync',
      body: 'Пока не поддерживается. Это отмечено честно, без размытых обещаний.',
      warn: true,
    },
  ],
  gotchas: [
    {
      iconKey: 'plug-connected-x',
      title: 'Модель подключена, но генерация не идет',
      body: 'Чаще всего не хватает текстовой модели. Добавьте ее в настройке моделей, чтобы работали чат и разбивка на кадры.',
    },
    {
      iconKey: 'mood-confuzed',
      title: 'Лица меняются от кадра к кадру',
      body: 'Подключите карточку идентичности к кадру как reference. Без нее модель не знает, кто есть кто.',
    },
    {
      iconKey: 'alert-circle',
      title: 'Модель подключена, но недоступна',
      body: 'Посмотрите текст ошибки. Часто нужен другой тариф, подписка, enterprise key или авторизация через веб.',
    },
    {
      iconKey: 'volume-off',
      title: 'После экспорта нет звука',
      body: 'Проверьте, что аудио лежит на аудиодорожке таймлайна. Сведение при экспорте исправлено в последней сборке.',
    },
  ],
}

export function getHandbookContent(locale: SupportedLocale): HandbookContent {
  if (locale === 'en') return HANDBOOK_CONTENT_EN
  if (locale === 'ru') return HANDBOOK_CONTENT_RU
  return HANDBOOK_CONTENT_ZH
}
