import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION = 'supabase/migrations/20260719141528_everville_portal_auth_rls.sql'
const INDEX_MIGRATION = 'supabase/migrations/20260720014246_app_fk_indexes.sql'

function sql(): string {
  return readFileSync(MIGRATION, 'utf8')
}

function indexSql(): string {
  return readFileSync(INDEX_MIGRATION, 'utf8')
}

describe('Everville Supabase auth/RLS migration', () => {
  it('keeps product tables in the app schema with private helpers outside the exposed API schema', () => {
    const source = sql()

    expect(source).toContain('create schema if not exists app;')
    expect(source).toContain('create schema if not exists app_private;')
    expect(source).toContain('revoke all on schema app_private from public, anon, authenticated;')
    expect(source).toContain('create or replace function app_private.has_project_permission')
    expect(source).toContain("set search_path = ''")
  })

  it('enables and forces RLS on every first-slice product table', () => {
    const source = sql()
    const tables = [
      'organizations',
      'workspaces',
      'workspace_memberships',
      'projects',
      'project_memberships',
      'project_revisions',
      'approval_gates',
      'audit_events',
    ]

    for (const table of tables) {
      expect(source).toContain(`alter table app.${table} enable row level security;`)
      expect(source).toContain(`alter table app.${table} force row level security;`)
    }
  })

  it('does not grant product table access to anon or derive authority from request claims', () => {
    const source = sql()

    expect(source).toContain('revoke all on all tables in schema app from anon;')
    expect(source).not.toMatch(/grant\s+(?:select|insert|update|delete|all)[^;]+to\s+anon/i)
    expect(source).not.toMatch(/raw_user_meta_data|user_metadata|auth\.jwt\(\)\s*->\s*'user_role'/i)
    expect(source).toMatch(/wm\.user_id = \(select auth\.uid\(\)\)/)
    expect(source).toMatch(/pm\.user_id = \(select auth\.uid\(\)\)/)
    expect(source).toMatch(/\(select auth\.uid\(\)\) is not null/)
  })

  it('requires full organization workspace project chain checks for project policies', () => {
    const source = sql()

    expect(source).toContain('and p.organization_id = requested_organization_id')
    expect(source).toContain('and p.workspace_id = requested_workspace_id')
    expect(source).toContain('and pm.project_id = requested_project_id')
    expect(source).toContain('projects_select_member')
    expect(source).toContain("app_private.has_project_permission(organization_id, workspace_id, id, 'project.read')")
  })

  it('enforces organization workspace project consistency at the database layer', () => {
    const source = sql()

    expect(source).toContain('unique (id, organization_id)')
    expect(source).toContain('unique (id, organization_id, workspace_id)')
    expect(source).toContain(
      'foreign key (workspace_id, organization_id) references app.workspaces(id, organization_id) on delete cascade',
    )
    expect(source).toContain(
      'foreign key (project_id, organization_id, workspace_id) references app.projects(id, organization_id, workspace_id) on delete cascade',
    )
  })

  it('keeps actor and approval decision fields server-derived by policy', () => {
    const source = sql()

    expect(source).toContain('created_by_user_id = (select auth.uid())')
    expect(source).toContain('decided_by_user_id = (select auth.uid())')
    expect(source).toContain('actor_user_id = (select auth.uid())')
    expect(source).toContain('approval_gates_update_decider')
    expect(source).toContain('audit_events_insert_actor')
    expect(source).not.toContain('project_id is null\n  or app_private.has_project_permission')
    expect(source).toContain('(project_id is null and app_private.is_workspace_member(organization_id, workspace_id))')
  })
})

describe('Everville Supabase app FK index migration', () => {
  it('covers the team portal foreign-key paths that grow with collaboration data', () => {
    const source = indexSql()

    for (const expected of [
      'workspace_memberships_workspace_organization_idx',
      'workspace_memberships_user_id_idx',
      'projects_workspace_organization_idx',
      'projects_created_by_user_id_idx',
      'project_memberships_project_organization_workspace_idx',
      'project_memberships_user_id_idx',
      'project_revisions_project_organization_workspace_idx',
      'approval_gates_project_organization_workspace_idx',
      'audit_events_workspace_organization_idx',
      'audit_events_project_organization_workspace_idx',
    ]) {
      expect(source).toContain(`create index if not exists ${expected}`)
    }
  })
})
