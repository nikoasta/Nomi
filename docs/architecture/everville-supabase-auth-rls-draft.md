# Everville Supabase Auth And RLS Draft

Status: implementation draft, not applied to a live database

Date: 2026-07-19

Beads task: `evmedia-r20.9.2`

## Purpose

This draft defines the first server-side authorization model for the Everville
corporate media portal. It backs the runtime-neutral contracts in
`src/platform/organizations` and the collaboration contracts in
`src/platform/collaboration`.

This is not a production migration. The live migration must be created with:

```bash
supabase migration new everville_portal_auth_rls
```

Then copy the reviewed SQL shape into the generated file, run local RLS tests,
run Supabase advisors, and only then apply it to the target project.

## Current Docs Check

Supabase guidance checked on 2026-07-19:

- Browser applications use a publishable key plus RLS; secret and service-role
  keys are backend-only because they bypass RLS.
- Product tables exposed through the Data API need explicit privileges and RLS.
- Policies should use `to authenticated` plus membership predicates, not
  `auth.role()` as an authorization shortcut.
- Authorization must not rely on user-editable metadata or stale role claims.
- For sensitive operations, session freshness can require server-side checks
  against `auth.sessions`.

## Authority Model

Supabase Auth identifies a human. Product authority lives in Postgres rows:

- `app.organizations`
- `app.workspaces`
- `app.workspace_memberships`
- `app.projects`
- `app.project_memberships`
- `app.project_revisions`
- `app.approval_gates`
- `app.audit_events`

Request fields such as `organizationId`, `workspaceId`, `projectId`, and
`approvalGateId` are selectors only. They never prove authority. RLS and BFF
handlers must derive authority from `(select auth.uid())` plus active
membership rows.

Actor fields are server-derived:

- `created_by_user_id`
- `updated_by_user_id`
- `actor_user_id`
- `decided_by_user_id`

Browser JSON may request an action, but it must not authoritatively set those
columns.

## Schema Shape

```sql
create schema if not exists app;
create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;
revoke all on schema app from public, anon;
grant usage on schema app to authenticated;

create table app.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  status text not null check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table app.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'inactive', 'invited')),
  roles text[] not null default '{}',
  organization_permissions text[] not null default '{}',
  workspace_permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  check (cardinality(roles) <= 16),
  check (cardinality(organization_permissions) <= 32),
  check (cardinality(workspace_permissions) <= 64)
);

create table app.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  slug text not null,
  title text not null,
  classification text not null check (classification in ('public', 'partner', 'investor', 'internal', 'restricted')),
  status text not null check (status in ('draft', 'in-production', 'in-review', 'approved', 'archived')),
  current_revision_id uuid,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table app.project_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'inactive')),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id),
  check (cardinality(permissions) <= 64)
);
```

## Private Helpers

Helpers stay in `app_private`, outside exposed schemas. They use `security
invoker` by default and are granted only when needed.

```sql
create or replace function app_private.has_workspace_permission(
  requested_organization_id uuid,
  requested_workspace_id uuid,
  requested_permission text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from app.workspace_memberships wm
    join app.workspaces w on w.id = wm.workspace_id
    where wm.organization_id = requested_organization_id
      and wm.workspace_id = requested_workspace_id
      and w.organization_id = requested_organization_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and requested_permission = any(wm.workspace_permissions)
  );
$$;

create or replace function app_private.has_project_permission(
  requested_organization_id uuid,
  requested_workspace_id uuid,
  requested_project_id uuid,
  requested_permission text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from app.project_memberships pm
    join app.projects p on p.id = pm.project_id
    where pm.organization_id = requested_organization_id
      and pm.workspace_id = requested_workspace_id
      and pm.project_id = requested_project_id
      and p.organization_id = requested_organization_id
      and p.workspace_id = requested_workspace_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
      and requested_permission = any(pm.permissions)
  );
$$;
```

## Policy Shape

```sql
alter table app.organizations enable row level security;
alter table app.organizations force row level security;
alter table app.workspaces enable row level security;
alter table app.workspaces force row level security;
alter table app.workspace_memberships enable row level security;
alter table app.workspace_memberships force row level security;
alter table app.projects enable row level security;
alter table app.projects force row level security;
alter table app.project_memberships enable row level security;
alter table app.project_memberships force row level security;

grant select on app.organizations, app.workspaces, app.workspace_memberships, app.projects, app.project_memberships
to authenticated;

create policy organizations_select_member
on app.organizations
for select
to authenticated
using (
  exists (
    select 1
    from app.workspace_memberships wm
    where wm.organization_id = organizations.id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  )
);

create policy workspaces_select_member
on app.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from app.workspace_memberships wm
    where wm.organization_id = workspaces.organization_id
      and wm.workspace_id = workspaces.id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  )
);

create policy projects_select_member
on app.projects
for select
to authenticated
using (
  app_private.has_project_permission(organization_id, workspace_id, id, 'project.read')
);
```

Every insert/update policy must include both `using` and `with check`, and must
verify that the request cannot move a row into another organization or
workspace after it is created.

## Required RLS Tests

- `anon` cannot select or mutate any `app.*` portal table.
- User A in Org A cannot read Org B rows by guessed IDs.
- User A in Workspace A cannot read Workspace B in the same organization unless
  a membership row exists.
- Project reads require `project.read` on the exact
  organization/workspace/project chain.
- Project writes require `project.write`; updates include `with check`.
- A browser request cannot forge actor columns.
- Removed or inactive membership loses access without waiting for JWT role
  refresh.
- Approval decisions require active scoped permission and matching policy
  snapshot digest.
- Browser bundle/env scans contain no service-role keys or provider secrets.

## Defers

- Live Supabase project linking.
- Generated migration file.
- BFF route handlers and lazy server clients.
- Storage buckets and signed URL resolver.
- Auth UI and session refresh policy.
