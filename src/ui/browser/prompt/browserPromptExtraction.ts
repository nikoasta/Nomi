import type { TaskResultDto } from '../../../workbench/api/taskApi'
import { getRuntimeLocale } from '../../../i18n/runtimeLocale'
import type { SupportedLocale } from '../../../i18n/translations'

export type BrowserPromptExtraction = {
  title: string
  prompt: string
}

export type BrowserPromptExtractionMode = 'replicate' | 'style'

export const BROWSER_PROMPT_EXTRACTION_MODE_LABELS: Record<BrowserPromptExtractionMode, string> = {
  replicate: 'Image replication',
  style: 'Visual style',
}

export const BROWSER_IMAGE_REPLICATE_PROMPT_EXTRACTION_PROMPT = [
  'You are a senior AI visual prompt engineer for Nomi. Break reference images into reproducible image-generation prompts.',
  'Goal: generate high-fidelity, commercially safe, editable prompts from the reference image. Faithfully describe visible details and do not invent hidden information.',
  'Safety: if the image may include brands, public figures, copyrighted characters, or living-artist style, describe neutral observable visual traits instead of asking to copy protected identity, logos, or style.',
  'Analyze: subject, count, pose/facing, composition, camera/viewpoint, lighting direction and quality, shadows/reflections, color, material texture, environment, props, visible text placement, mood, style, and aspect-ratio clues.',
  'Return English as the primary result. You may include localized English and Chinese variants, but the top-level prompt/prompts fields must be English.',
  'negativePrompt reduces low quality, structural errors, wrong text, extra objects, blur, bad crop, oversaturation, and artifacts.',
  'Return JSON only. No Markdown, no code fence. JSON shape:',
  '{',
  '  "title": "English topic under 8 words",',
  '  "localizedTitles": { "en": "English topic under 8 words", "zh-CN": "Chinese topic under 8 words" },',
  '  "summary": "One-sentence summary of the image and the visual details that must be preserved",',
  '  "prompts": {',
  '    "faithful": "High-fidelity English reconstruction prompt covering subject, composition, lighting, material, background, camera, and details",',
  '    "commercial": "Commercial-safe English prompt preserving subject, composition, lighting, and detail level",',
  '    "creative": "More creative English prompt preserving the core subject, composition, color, lighting, and material clues"',
  '  },',
  '  "platformPrompts": {',
  '    "openai": "natural-language high-detail English prompt for OpenAI image models",',
  '    "midjourney": "English Midjourney prompt with useful parameters such as --ar when inferable",',
  '    "flux": "clear Flux reconstruction prompt emphasizing subject, material, lighting, composition, and texture",',
  '    "stableDiffusion": "positive Stable Diffusion prompt without negative terms"',
  '  },',
  '  "localizedPrompts": {',
  '    "en": { "faithful": "English faithful prompt", "commercial": "English commercial prompt", "creative": "English creative prompt" },',
  '    "zh-CN": { "faithful": "Simplified Chinese faithful prompt", "commercial": "Simplified Chinese commercial prompt", "creative": "Simplified Chinese creative prompt" }',
  '  },',
  '  "components": {',
  '    "subject": "subject and action",',
  '    "composition": "composition and camera",',
  '    "lighting": "lighting",',
  '    "color": "color",',
  '    "material": "material and texture",',
  '    "background": "background and environment",',
  '    "style": "visual style"',
  '  },',
  '  "negativePrompt": "low quality, blurry, distorted, extra objects, wrong text, bad crop, oversaturation, artifacts",',
  '  "promptType": "image"',
  '}',
].join('\n')

export const BROWSER_IMAGE_PROMPT_EXTRACTION_PROMPT = BROWSER_IMAGE_REPLICATE_PROMPT_EXTRACTION_PROMPT

export const BROWSER_IMAGE_STYLE_PROMPT_EXTRACTION_PROMPT = [
  'You are a senior visual style analyst for Nomi. Break reference images into transferable, reusable visual style specifications.',
  'Goal: extract the image style as JSON: palette, typography, composition, effects, and related design language.',
  'Analyze only observable visual style. Do not copy brand logos, public-figure identity, copyrighted characters, or living-artist personal style.',
  'Do not require preserving the original subject identity. Focus on transferable design language, camera language, texture, and mood.',
  'Return JSON only. No Markdown, no code fence. JSON shape:',
  '{',
  '  "title": "English style name under 8 words",',
  '  "summary": "One-sentence summary of the overall visual style",',
  '  "stylePrompt": "English prompt for generating the same visual style, emphasizing palette, typography, composition, effects, lighting, material, and mood without binding to the original subject",',
  '  "style": {',
  '    "colorPalette": [{ "name": "color name", "hex": "#RRGGBB", "usage": "usage" }],',
  '    "typography": { "fontStyle": "font style", "weight": "weight", "spacing": "spacing / layout rhythm", "textTreatment": "text treatment" },',
  '    "composition": { "layout": "layout structure", "framing": "framing / negative space", "hierarchy": "visual hierarchy", "balance": "balance method" },',
  '    "lighting": { "direction": "lighting direction", "contrast": "contrast", "mood": "lighting mood" },',
  '    "materials": ["materials and textures"],',
  '    "effects": ["post-processing / filters / effects / grain / blur / outline, etc."],',
  '    "mood": "mood keywords",',
  '    "dos": ["rules to preserve when reusing this style"],',
  '    "donts": ["deviations to avoid when reusing this style"]',
  '  },',
  '  "promptType": "image",',
  '  "extractionMode": "style"',
  '}',
].join('\n')

export function browserPromptExtractionPromptForMode(mode: BrowserPromptExtractionMode): string {
  return mode === 'style'
    ? BROWSER_IMAGE_STYLE_PROMPT_EXTRACTION_PROMPT
    : BROWSER_IMAGE_REPLICATE_PROMPT_EXTRACTION_PROMPT
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = asTrimmedString(value)
    if (text) return text
  }
  return ''
}

function textFromContentParts(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''
  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (!part || typeof part !== 'object') return ''
      const record = part as Record<string, unknown>
      return firstText(record.text, record.content, record.output_text)
    })
    .filter(Boolean)
    .join('')
    .trim()
}

export function extractTextFromTaskResult(result: TaskResultDto): string {
  if (!result || result.status !== 'succeeded') return ''
  const raw = result.raw
  if (!raw || typeof raw !== 'object') return ''
  const record = raw as Record<string, unknown>
  const direct = firstText(record.output_text, record.text)
  if (direct) return direct

  const choices = record.choices
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown> | undefined
    const message = first?.message as Record<string, unknown> | undefined
    const messageText = textFromContentParts(message?.content)
    if (messageText) return messageText
    const legacyText = firstText(first?.text)
    if (legacyText) return legacyText
  }

  const output = record.output
  if (Array.isArray(output)) {
    const outputText = output
      .map((item) => {
        if (!item || typeof item !== 'object') return ''
        const itemRecord = item as Record<string, unknown>
        return textFromContentParts(itemRecord.content)
      })
      .filter(Boolean)
      .join('\n')
      .trim()
    if (outputText) return outputText
  }

  return textFromContentParts(record.content)
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const normalized = text.trim()
  if (!normalized) return null
  const jsonText = normalized.startsWith('{')
    ? normalized
    : normalized.slice(normalized.indexOf('{'), normalized.lastIndexOf('}') + 1)
  if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) return null
  try {
    const parsed = JSON.parse(jsonText)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function promptFromNestedAnalysis(record: Record<string, unknown>, locale: SupportedLocale): string {
  const localizedPrompts = record.localizedPrompts as Record<string, unknown> | undefined
  const localePrompts = localizedPrompts?.[locale] as Record<string, unknown> | undefined
  const enPrompts = localizedPrompts?.en as Record<string, unknown> | undefined
  const zhPrompts = localizedPrompts?.['zh-CN'] as Record<string, unknown> | undefined
  const prompts = record.prompts as Record<string, unknown> | undefined
  const platformPrompts = record.platformPrompts as Record<string, unknown> | undefined
  return firstText(
    record.prompt,
    localePrompts?.faithful,
    localePrompts?.commercial,
    enPrompts?.faithful,
    enPrompts?.commercial,
    prompts?.faithful,
    prompts?.commercial,
    platformPrompts?.openai,
    zhPrompts?.faithful,
    zhPrompts?.commercial,
  )
}

function stylePromptFromAnalysis(record: Record<string, unknown>): string {
  const formatted = JSON.stringify(record, null, 2)
  return firstText(record.stylePrompt, record.prompt, formatted)
}

export function parseBrowserPromptExtraction(
  text: string,
  mode: BrowserPromptExtractionMode = 'replicate',
): BrowserPromptExtraction {
  const locale = getRuntimeLocale()
  const parsed = parseJsonObject(text)
  if (parsed) {
    const localizedTitles = parsed.localizedTitles as Record<string, unknown> | undefined
    const prompt = mode === 'style' ? stylePromptFromAnalysis(parsed) : promptFromNestedAnalysis(parsed, locale)
    if (prompt) {
      return {
        title:
          firstText(localizedTitles?.[locale], localizedTitles?.en, parsed.title, localizedTitles?.['zh-CN']) ||
          (mode === 'style' ? 'Visual style' : 'Image prompt'),
        prompt,
      }
    }
  }
  const fallback = text.trim()
  return {
    title: mode === 'style' ? 'Visual style' : 'Image prompt',
    prompt: fallback,
  }
}
