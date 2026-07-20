import { describe, expect, it } from 'vitest'
import {
  DEMO_PROJECT_NAME,
  buildDemoStoryboardPlan,
  getDemoProjectName,
  getDemoStory,
  localizeDemoProjectRecord,
  translateDemoProjectText,
} from './demoProject'
import { buildAnchorSheetPrompt, storyboardPlanToCreateNodesArgs } from '../generationCanvas/agent/storyboardPlan'
import { createDefaultWorkbenchProjectPayload, type WorkbenchProjectRecordV1 } from '../project/projectRecordSchema'
import { buildStoryDocument } from '../library/tryNowExamples'

const CJK_RE = /[\u3400-\u9fff]/

function planStrings(locale: 'en' | 'ru'): string[] {
  const plan = buildDemoStoryboardPlan(locale)
  return [
    plan.title,
    ...plan.anchors.flatMap((anchor) => [anchor.name, anchor.description]),
    ...plan.shots.map((shot) => shot.prompt),
  ]
}

describe('demo project localization', () => {
  it('creates the learning project in the active English locale', () => {
    expect(getDemoProjectName('en')).toBe('Example: Repairing a little robot')
    expect(getDemoStory('en')).not.toMatch(CJK_RE)
    expect(planStrings('en').join('\n')).not.toMatch(CJK_RE)
    expect(storyboardPlanToCreateNodesArgs(buildDemoStoryboardPlan('en'), { promptLocale: 'en' }).nodes.map((node) => node.prompt).join('\n')).not.toMatch(CJK_RE)
  })

  it('creates the learning project in the active Russian locale', () => {
    expect(getDemoProjectName('ru')).toBe('Пример: ремонт маленького робота')
    expect(getDemoStory('ru')).not.toMatch(CJK_RE)
    expect(planStrings('ru').join('\n')).not.toMatch(CJK_RE)
  })

  it('translates already persisted demo text between supported locales', () => {
    expect(translateDemoProjectText('en', DEMO_PROJECT_NAME)).toBe('Example: Repairing a little robot')
    expect(translateDemoProjectText('ru', 'Example: Repairing a little robot')).toBe('Пример: ремонт маленького робота')
    expect(translateDemoProjectText('en', '小机器人')).toBe('Little robot')
  })

  it('translates already persisted demo reference-sheet prompts', () => {
    const chineseRobotAnchor = buildDemoStoryboardPlan('zh-CN').anchors.find((anchor) => anchor.id === 'robot')
    expect(chineseRobotAnchor).toBeTruthy()
    const oldPrompt = buildAnchorSheetPrompt(chineseRobotAnchor!, 'zh-CN')
    expect(translateDemoProjectText('en', oldPrompt)).toContain('Character reference sheet')
    expect(translateDemoProjectText('en', oldPrompt)).toContain('Little robot')
    expect(translateDemoProjectText('ru', oldPrompt)).toContain('Референс персонажа')
    expect(translateDemoProjectText('ru', oldPrompt)).not.toMatch(CJK_RE)
  })

  it('localizes an already persisted Chinese learning project payload on hydrate', () => {
    const payload = createDefaultWorkbenchProjectPayload()
    const record: WorkbenchProjectRecordV1 = {
      id: 'project-demo',
      name: DEMO_PROJECT_NAME,
      version: 1,
      createdAt: 1,
      updatedAt: 1,
      seedKey: 'example:robot-rescue',
      payload: {
        ...payload,
        workbenchDocument: buildStoryDocument(getDemoStory('zh-CN'), DEMO_PROJECT_NAME),
        storyboardPlan: buildDemoStoryboardPlan('zh-CN'),
        generationCanvas: {
          ...payload.generationCanvas,
          nodes: [
            {
              id: 'shot-1',
              kind: 'video',
              title: '镜头 1',
              prompt: buildDemoStoryboardPlan('zh-CN').shots[0]?.prompt,
            },
            {
              id: 'robot',
              kind: 'character',
              title: '小机器人',
              prompt: buildAnchorSheetPrompt(buildDemoStoryboardPlan('zh-CN').anchors[1]!, 'zh-CN'),
            },
          ],
        },
      },
    }

    const localized = localizeDemoProjectRecord('en', record)
    const localizedSurface = JSON.stringify({
      name: localized.name,
      workbenchDocument: localized.payload.workbenchDocument,
      storyboardPlan: localized.payload.storyboardPlan,
      generationNodes: localized.payload.generationCanvas.nodes,
    })

    expect(localized.name).toBe('Example: Repairing a little robot')
    expect(localized.payload.storyboardPlan?.title).toBe('Repairing a little robot')
    expect(localizedSurface).not.toMatch(CJK_RE)
  })
})
