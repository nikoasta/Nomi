import React from 'react'

import { getPlatformClient } from '../../platform/client'
import type { PortalProjectRecord, PortalScope } from '../../platform/collaboration/contracts'
import type { OrganizationRecord, WorkspaceRecord } from '../../platform/organizations/contracts'
import { WEB_PORTAL_AUTH_CHANGE_EVENT } from '../../platform/webPortalSession'

export type PortalWorkspaceLoadState =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      organization: OrganizationRecord
      workspace: WorkspaceRecord
      projects: PortalProjectRecord[]
      creating: boolean
      error: string | null
    }

function portalProjectSlug(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  const fallback = base || 'shared-project'
  return `${fallback}-${Date.now().toString(36)}`
}

function resultMessage(result: { error: { code: string; message: string } }): string {
  return `${result.error.code}: ${result.error.message}`
}

export function usePortalWorkspace(): {
  state: PortalWorkspaceLoadState
  refresh: () => void
  createSharedProject: (title: string) => Promise<PortalProjectRecord | null>
} {
  const [state, setState] = React.useState<PortalWorkspaceLoadState>({ kind: 'hidden' })
  const [reloadToken, setReloadToken] = React.useState(0)
  const scopeRef = React.useRef<(PortalScope & { organization: OrganizationRecord; workspace: WorkspaceRecord }) | null>(
    null,
  )

  const refresh = React.useCallback(() => setReloadToken((value) => value + 1), [])

  React.useEffect(() => {
    let cancelled = false
    const client = getPlatformClient()
    if (!client.supports('portal.projects.list') || !client.supports('org.organizations.list')) {
      scopeRef.current = null
      setState({ kind: 'hidden' })
      return () => {
        cancelled = true
      }
    }

    setState((current) =>
      current.kind === 'ready'
        ? { ...current, error: null }
        : current.kind === 'hidden'
          ? { kind: 'loading' }
          : current,
    )

    async function load(): Promise<void> {
      const organizations = await client.organizations.listOrganizations({ limit: 1 })
      if (cancelled) return
      if (!organizations.ok) {
        scopeRef.current = null
        setState({ kind: 'error', message: resultMessage(organizations) })
        return
      }
      const organization = organizations.value.items[0]
      if (!organization) {
        scopeRef.current = null
        setState({ kind: 'empty' })
        return
      }

      const workspaces = await client.organizations.listWorkspaces({
        organizationId: organization.id,
        status: 'active',
        limit: 1,
      })
      if (cancelled) return
      if (!workspaces.ok) {
        scopeRef.current = null
        setState({ kind: 'error', message: resultMessage(workspaces) })
        return
      }
      const workspace = workspaces.value.items[0]
      if (!workspace) {
        scopeRef.current = null
        setState({ kind: 'empty' })
        return
      }

      const projects = await client.collaboration.listProjects({
        organizationId: organization.id,
        workspaceId: workspace.id,
        limit: 12,
      })
      if (cancelled) return
      if (!projects.ok) {
        scopeRef.current = null
        setState({ kind: 'error', message: resultMessage(projects) })
        return
      }
      scopeRef.current = {
        organizationId: organization.id,
        workspaceId: workspace.id,
        organization,
        workspace,
      }
      setState({
        kind: 'ready',
        organization,
        workspace,
        projects: projects.value.items,
        creating: false,
        error: null,
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  React.useEffect(() => {
    const listener = () => refresh()
    window.addEventListener(WEB_PORTAL_AUTH_CHANGE_EVENT, listener)
    return () => window.removeEventListener(WEB_PORTAL_AUTH_CHANGE_EVENT, listener)
  }, [refresh])

  const createSharedProject = React.useCallback(
    async (title: string): Promise<PortalProjectRecord | null> => {
      const scope = scopeRef.current
      const safeTitle = title.trim()
      if (!scope || !safeTitle) return null
      const client = getPlatformClient()
      setState((current) => (current.kind === 'ready' ? { ...current, creating: true, error: null } : current))
      const project = await client.collaboration.createProject({
        organizationId: scope.organizationId,
        workspaceId: scope.workspaceId,
        title: safeTitle,
        slug: portalProjectSlug(safeTitle),
        classification: 'internal',
        idempotencyKey: `portal-project-${Date.now().toString(36)}`,
      })
      if (!project.ok) {
        setState((current) =>
          current.kind === 'ready' ? { ...current, creating: false, error: resultMessage(project) } : current,
        )
        return null
      }
      void client.collaboration.appendAuditEvent({
        organizationId: scope.organizationId,
        workspaceId: scope.workspaceId,
        projectId: project.value.id,
        action: 'project.create',
        targetType: 'project',
        targetId: project.value.id,
        metadata: { source: 'web-portal' },
        idempotencyKey: `portal-audit-${Date.now().toString(36)}`,
      })
      setState((current) =>
        current.kind === 'ready'
          ? {
              ...current,
              creating: false,
              error: null,
              projects: [project.value, ...current.projects.filter((item) => item.id !== project.value.id)].slice(0, 12),
            }
          : current,
      )
      refresh()
      return project.value
    },
    [refresh],
  )

  return { state, refresh, createSharedProject }
}
