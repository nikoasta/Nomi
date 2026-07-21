import { describe, expect, it } from 'vitest'
import { buildRefreshUrl, shouldReloadForBuild } from './webBuildFreshness'

describe('web build freshness', () => {
  it('detects a new deployment without treating missing metadata as an update', () => {
    expect(shouldReloadForBuild('build-a', 'build-b')).toBe(true)
    expect(shouldReloadForBuild('build-a', 'build-a')).toBe(false)
    expect(shouldReloadForBuild('', 'build-b')).toBe(false)
    expect(shouldReloadForBuild('build-a', '')).toBe(false)
  })

  it('preserves the workspace route while cache-busting the document request', () => {
    expect(buildRefreshUrl('https://cut.eva.mba/?step=generate#/studio?projectId=project-123', 'build-b')).toBe(
      'https://cut.eva.mba/?step=generate&nomiBuild=build-b#/studio?projectId=project-123',
    )
  })
})
