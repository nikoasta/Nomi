import { buildVideoPlaybackUrl } from './videoPlaybackUrl'
import { getRuntimeLocale } from '../i18n/runtimeLocale'
import type { SupportedLocale } from '../i18n/translations'

export type VideoPlaybackFailureDiagnostics = {
  rawVideoUrl: string
  playbackUrl: string
  mediaErrorCode: number | null
  mediaErrorMessage: string
  probeMessage: string
}

async function readResponseMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  const text = await response.text().catch(() => '')
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(trimmed) as { message?: unknown; error?: unknown; code?: unknown }
      const message = typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : ''
      if (message) return message
      const error = typeof parsed.error === 'string' && parsed.error.trim() ? parsed.error.trim() : ''
      if (error) return error
      const code = typeof parsed.code === 'string' && parsed.code.trim() ? parsed.code.trim() : ''
      if (code) return code
    } catch {
      // fall through to raw text
    }
  }
  return trimmed.slice(0, 240)
}

const VIDEO_DIAGNOSTIC_TEXT = {
  'zh-CN': {
    emptyUrl: '视频地址为空',
    proxyReturned: '视频代理返回 {{status}}',
    proxyReturnedWithMessage: '视频代理返回 {{status}}：{{message}}',
    proxyRequestFailed: '视频代理请求失败：{{message}}',
    unknownPlayback: '视频无法播放（原因未知）',
    mediaErrors: {
      1: '视频加载被取消',
      2: '视频传输中断（地址可达，但数据没读完）',
      3: '视频解码失败（文件可能损坏，或编码不受支持）',
      4: '视频格式不受支持，或该地址没有返回视频内容',
    },
  },
  en: {
    emptyUrl: 'Video URL is empty',
    proxyReturned: 'Video proxy returned {{status}}',
    proxyReturnedWithMessage: 'Video proxy returned {{status}}: {{message}}',
    proxyRequestFailed: 'Video proxy request failed: {{message}}',
    unknownPlayback: 'Video cannot be played (unknown reason)',
    mediaErrors: {
      1: 'Video loading was canceled',
      2: 'Video transfer was interrupted (the URL is reachable, but the data did not finish loading)',
      3: 'Video decoding failed (the file may be damaged, or the codec is not supported)',
      4: 'The video format is unsupported, or the URL did not return video content',
    },
  },
  ru: {
    emptyUrl: 'URL видео пустой',
    proxyReturned: 'Video proxy вернул {{status}}',
    proxyReturnedWithMessage: 'Video proxy вернул {{status}}: {{message}}',
    proxyRequestFailed: 'Ошибка запроса к video proxy: {{message}}',
    unknownPlayback: 'Видео не воспроизводится (причина неизвестна)',
    mediaErrors: {
      1: 'Загрузка видео отменена',
      2: 'Передача видео прервалась (URL доступен, но данные не загрузились полностью)',
      3: 'Не удалось декодировать видео (файл может быть поврежден или кодек не поддерживается)',
      4: 'Формат видео не поддерживается, или этот URL не вернул видеоконтент',
    },
  },
} as const

function videoText(locale: SupportedLocale, key: keyof (typeof VIDEO_DIAGNOSTIC_TEXT)['zh-CN'], params?: Record<string, string>): string {
  const value = VIDEO_DIAGNOSTIC_TEXT[locale][key]
  if (typeof value !== 'string') return key
  if (!params) return value
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => params[name] ?? match)
}

export async function probeVideoPlaybackFailure(rawVideoUrl: string, locale: SupportedLocale = getRuntimeLocale()): Promise<string> {
  const playbackUrl = buildVideoPlaybackUrl(rawVideoUrl)
  if (!playbackUrl) return videoText(locale, 'emptyUrl')

  try {
    const response = await fetch(playbackUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Range: 'bytes=0-0',
      },
    })
    if (response.ok) return ''

    const message = await readResponseMessage(response)
    const statusText = response.status ? String(response.status) : 'unknown'
    return message
      ? videoText(locale, 'proxyReturnedWithMessage', { status: statusText, message })
      : videoText(locale, 'proxyReturned', { status: statusText })
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'unknown error'
    return videoText(locale, 'proxyRequestFailed', { message })
  }
}

export async function diagnoseVideoPlaybackFailure(
  rawVideoUrl: string,
  mediaError?: MediaError | null,
  locale: SupportedLocale = getRuntimeLocale(),
): Promise<VideoPlaybackFailureDiagnostics> {
  const playbackUrl = buildVideoPlaybackUrl(rawVideoUrl)
  const probeMessage = await probeVideoPlaybackFailure(rawVideoUrl, locale)
  return {
    rawVideoUrl,
    playbackUrl,
    mediaErrorCode: typeof mediaError?.code === 'number' ? mediaError.code : null,
    mediaErrorMessage: typeof mediaError?.message === 'string' ? mediaError.message : '',
    probeMessage,
  }
}

export function logVideoPlaybackFailure(diagnostics: VideoPlaybackFailureDiagnostics): void {
  console.error('[nomi-video-playback-failure]', diagnostics)
}

// MediaError.code → 人话。地址已被探针证实可读时，失败一定出在「媒体本身」（解码/格式/传输），
// 不是代理；这些文案绝不甩锅给代理（修旧 fallback「代理无法读取该视频地址」的误导）。
/**
 * 把一次播放失败诊断翻成给用户看的一句话——唯一真相源（UI 各处共用，别再各自手搓 fallback）。
 *
 * 判定顺序遵循诊断本身的因果：
 *  1) 探针报错（probeMessage 非空）= 地址根本读不到（网络/HTTP/代理）→ 探针消息最具体，直接用。
 *  2) 探针成功但 <video> 仍失败 = 地址可读、问题在媒体本身 → 按 MediaError.code 说人话，
 *     绝不再说「代理无法读取该视频地址」（探针刚证明读得到，那句是自相矛盾的谎）。
 */
export function describeVideoPlaybackFailure(
  diagnostics: VideoPlaybackFailureDiagnostics,
  locale: SupportedLocale = getRuntimeLocale(),
): string {
  if (diagnostics.probeMessage) return diagnostics.probeMessage
  if (diagnostics.mediaErrorCode) {
    const message = VIDEO_DIAGNOSTIC_TEXT[locale].mediaErrors[diagnostics.mediaErrorCode as 1 | 2 | 3 | 4]
    if (message) return message
  }
  if (diagnostics.mediaErrorMessage) return diagnostics.mediaErrorMessage
  return videoText(locale, 'unknownPlayback')
}
