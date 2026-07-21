import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const MIGRATION = 'supabase/migrations/20260719141528_everville_portal_auth_rls.sql'
const INDEX_MIGRATION = 'supabase/migrations/20260720014246_app_fk_indexes.sql'
const REVISION_RPC_MIGRATION = 'supabase/migrations/20260720030000_portal_revision_rpc.sql'
const APPROVAL_RPC_MIGRATION = 'supabase/migrations/20260720034022_portal_approval_rpc.sql'
const PUBLIC_BFF_RPC_MIGRATION = 'supabase/migrations/20260720040006_portal_public_bff_rpc.sql'
const DEFAULT_CREATOR_PERMISSIONS_MIGRATION =
  'supabase/migrations/20260720154000_portal_default_creator_permissions.sql'
const DROPBOX_ASSET_STORAGE_MIGRATION =
  'supabase/migrations/20260721070857_dropbox_asset_storage.sql'

function sql(): string {
  return readFileSync(MIGRATION, 'utf8')
}

function indexSql(): string {
  return readFileSync(INDEX_MIGRATION, 'utf8')
}

function revisionRpcSql(): string {
  return readFileSync(REVISION_RPC_MIGRATION, 'utf8')
}

function approvalRpcSql(): string {
  return readFileSync(APPROVAL_RPC_MIGRATION, 'utf8')
}

function publicBffRpcSql(): string {
  return readFileSync(PUBLIC_BFF_RPC_MIGRATION, 'utf8')
}

function defaultCreatorPermissionsSql(): string {
  return readFileSync(DEFAULT_CREATOR_PERMISSIONS_MIGRATION, 'utf8')
}

function dropboxAssetStorageSql(): string {
  return readFileSync(DROPBOX_ASSET_STORAGE_MIGRATION, 'utf8')
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

describe('Everville Supabase portal revision RPC migration', () => {
  it('saves revisions through an authenticated transactional RPC without public execute', () => {
    const source = revisionRpcSql()

    expect(source).toContain('create or replace function app.save_project_revision')
    expect(source).toContain('security definer')
    expect(source).toContain("set search_path = ''")
    expect(source).toContain('actor_id uuid := (select auth.uid())')
    expect(source).toContain('for update;')
    expect(source).toContain('locked_current_revision_id is distinct from request_expected_current_revision_id')
    expect(source).toContain("app_private.has_project_permission(\n    request_organization_id")
    expect(source).toContain("request_project_id,\n    'project.write'")
    expect(source).toContain('revoke all on function app.save_project_revision')
    expect(source).toContain('from public, anon, authenticated')
    expect(source).toContain('grant execute on function app.save_project_revision')
    expect(source).toContain('to authenticated')
    expect(source).not.toMatch(/grant\s+execute[^;]+to\s+anon/i)
  })
})

describe('Everville Supabase portal approval RPC migration', () => {
  it('decides approval gates through an authenticated transactional RPC without public execute', () => {
    const source = approvalRpcSql()

    expect(source).toContain('add column if not exists required_role')
    expect(source).toContain('create or replace function app.decide_approval_gate')
    expect(source).toContain('security definer')
    expect(source).toContain("set search_path = ''")
    expect(source).toContain('actor_id uuid := (select auth.uid())')
    expect(source).toContain('for update;')
    expect(source).toContain('locked_gate.policy_snapshot_digest is distinct from request_expected_policy_snapshot_digest')
    expect(source).toContain('locked_gate.required_permission')
    expect(source).toContain('decided_by_user_id = actor_id')
    expect(source).toContain("action,\n    target_type")
    expect(source).toContain("'approval.decide'")
    expect(source).toContain('revoke all on function app.decide_approval_gate')
    expect(source).toContain('from public, anon, authenticated')
    expect(source).toContain('grant execute on function app.decide_approval_gate')
    expect(source).toContain('to authenticated')
    expect(source).not.toMatch(/grant\s+execute[^;]+to\s+anon/i)
  })
})

describe('Everville Supabase portal public BFF RPC migration', () => {
  it('exposes only authenticated public RPC wrappers and keeps audit writes server-derived', () => {
    const source = publicBffRpcSql()

    for (const name of [
      'nomi_portal_list_organizations',
      'nomi_portal_list_workspaces',
      'nomi_portal_list_memberships',
      'nomi_portal_list_projects',
      'nomi_portal_create_project',
      'nomi_portal_save_project_revision',
      'nomi_portal_list_review_queue',
      'nomi_portal_decide_approval_gate',
      'nomi_portal_append_audit_event',
    ]) {
      expect(source).toContain(`create or replace function public.${name}`)
      expect(source).toContain(`revoke all on function public.${name}`)
      expect(source).toContain(`grant execute on function public.${name}`)
    }

    expect(source).toContain("set search_path = ''")
    expect(source).toContain('actor_id uuid := (select auth.uid())')
    expect(source).toContain('revoke insert on app.audit_events from authenticated')
    expect(source).toContain('actor_id,\n      request_action')
    expect(source).toContain("request_action not in ('project.create', 'project.view', 'project.revision.save', 'approval.decide')")
    expect(source).toContain("from public, anon, authenticated")
    expect(source).toContain('to authenticated')
    expect(source).not.toMatch(/grant\s+execute[^;]+to\s+anon/i)
  })
})

describe('Everville Supabase portal default creator permissions migration', () => {
  it('keeps Telegram-created members able to create shared projects without granting organization admin', () => {
    const source = defaultCreatorPermissionsSql()

    expect(source).toContain('create or replace function public.nomi_portal_find_or_create_member_by_telegram')
    expect(source).toContain("array['creator']::text[]")
    expect(source).toContain("'project.read'")
    expect(source).toContain("'project.write'")
    expect(source).toContain("'asset.read'")
    expect(source).toContain("'asset.write'")
    expect(source).toContain("'generation-job.create'")
    expect(source).toContain("workspace.slug = 'content-studio'")
    expect(source).toContain("not ('project.write' = any(membership.workspace_permissions))")
    expect(source).toContain("grant execute on function public.nomi_portal_find_or_create_member_by_telegram")
    expect(source).toContain('to service_role')
    expect(source).not.toContain("'organization.admin'")
    expect(source).not.toMatch(/grant\s+execute[^;]+to\s+(?:anon|authenticated)/i)
  })
})

describe('Everville Dropbox asset storage migration', () => {
  it('keeps Dropbox locators private and exposes only membership-scoped asset RPCs', () => {
    const source = dropboxAssetStorageSql()

    for (const table of ['assets', 'asset_versions', 'asset_ingestions']) {
      expect(source).toContain(`alter table app.${table} enable row level security;`)
      expect(source).toContain(`alter table app.${table} force row level security;`)
    }
    expect(source).toContain('create table if not exists app_private.asset_storage_objects')
    expect(source).toContain('revoke all on app_private.asset_storage_objects from public, anon, authenticated;')
    expect(source).toContain("when 'asset.read' then 'project.read'")
    expect(source).toContain("when 'asset.write' then 'project.write'")
    expect(source).toContain('nomi_portal_service_register_asset')
    expect(source).toContain('nomi_portal_service_resolve_asset')
    expect(source).toContain("if (select auth.role()) <> 'service_role'")
    expect(source).toContain('pg_advisory_xact_lock')
    expect(source).toContain('hashtextextended')
    expect(source).not.toMatch(/grant\s+(?:select|insert|update|delete|all)[^;]+to\s+(?:anon|authenticated)/i)
  })

  it('enforces immutable idempotent provider output registration', () => {
    const source = dropboxAssetStorageSql()

    expect(source).toContain('unique (organization_id, project_id, provider, provider_task_id, output_index)')
    expect(source).toContain('unique (organization_id, project_id, idempotency_hash)')
    expect(source).toContain("raise exception 'Idempotency key was rebound'")
    expect(source).toContain("request_validation, request_provenance, request_actor_user_id")
  })
})
