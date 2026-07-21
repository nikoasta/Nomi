const BUILD_META_PATH = '/build-meta.json'
const CHECK_INTERVAL_MS = 60_000
const CHECK_DEBOUNCE_MS = 5_000

type BuildMeta = { buildId?: unknown }

export function shouldReloadForBuild(currentBuildId: string, latestBuildId: string): boolean {
  return currentBuildId.length > 0 && latestBuildId.length > 0 && currentBuildId !== latestBuildId
}

export function buildRefreshUrl(href: string, latestBuildId: string): string {
  const url = new URL(href)
  url.searchParams.set('nomiBuild', latestBuildId)
  return url.toString()
}

function readCurrentBuildId(): string {
  return typeof __NOMI_BUILD_ID__ === 'string' ? __NOMI_BUILD_ID__.trim() : ''
}

function readLatestBuildId(value: BuildMeta): string {
  return typeof value.buildId === 'string' ? value.buildId.trim() : ''
}

export function startWebBuildFreshnessMonitor(): () => void {
  if (window.location.protocol !== 'https:' && window.location.protocol !== 'http:') return () => undefined

  const currentBuildId = readCurrentBuildId()
  if (!currentBuildId) return () => undefined

  let stopped = false
  let inFlight = false
  let lastCheckedAt = 0

  const check = async (): Promise<void> => {
    const now = Date.now()
    if (stopped || inFlight || now - lastCheckedAt < CHECK_DEBOUNCE_MS) return
    inFlight = true
    lastCheckedAt = now
    try {
      const response = await window.fetch(BUILD_META_PATH, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      if (!response.ok) return
      const latestBuildId = readLatestBuildId((await response.json()) as BuildMeta)
      if (!shouldReloadForBuild(currentBuildId, latestBuildId)) return
      window.location.replace(buildRefreshUrl(window.location.href, latestBuildId))
    } catch {
      // Offline and transient deployment checks must never interrupt editing.
    } finally {
      inFlight = false
    }
  }

  const checkWhenVisible = (): void => {
    if (document.visibilityState === 'visible') void check()
  }

  const initialTimer = window.setTimeout(checkWhenVisible, 1_500)
  const interval = window.setInterval(checkWhenVisible, CHECK_INTERVAL_MS)
  window.addEventListener('focus', checkWhenVisible)
  window.addEventListener('pageshow', checkWhenVisible)
  document.addEventListener('visibilitychange', checkWhenVisible)

  return () => {
    stopped = true
    window.clearTimeout(initialTimer)
    window.clearInterval(interval)
    window.removeEventListener('focus', checkWhenVisible)
    window.removeEventListener('pageshow', checkWhenVisible)
    document.removeEventListener('visibilitychange', checkWhenVisible)
  }
}
