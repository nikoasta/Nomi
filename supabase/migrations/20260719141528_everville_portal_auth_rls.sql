-- Everville Media Portal auth/RLS foundation.
-- Generated with: supabase migration new everville_portal_auth_rls
--
-- Browser clients may use only publishable keys. Authority is derived from
-- auth.uid() plus membership rows; request-supplied org/workspace/project IDs
-- are selectors only.

create schema if not exists app;
create schema if not exists app_private;

revoke all on schema app from public, anon;
grant usage on schema app to authenticated;

revoke all on schema app_private from public, anon, authenticated;

create table if not exists app.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 160),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 160),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  unique (organization_id, slug)
);

create table if not exists app.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive', 'invited')),
  roles text[] not null default '{}',
  organization_permissions text[] not null default '{}',
  workspace_permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id),
  foreign key (workspace_id, organization_id) references app.workspaces(id, organization_id) on delete cascade,
  check (cardinality(roles) <= 16),
  check (cardinality(organization_permissions) <= 32),
  check (cardinality(workspace_permissions) <= 64)
);

create table if not exists app.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 256),
  classification text not null check (classification in ('public', 'partner', 'investor', 'internal', 'restricted')),
  status text not null default 'draft' check (status in ('draft', 'in-production', 'in-review', 'approved', 'archived')),
  current_revision_id uuid,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id, workspace_id),
  foreign key (workspace_id, organization_id) references app.workspaces(id, organization_id) on delete cascade,
  unique (workspace_id, slug)
);

create table if not exists app.project_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id),
  foreign key (project_id, organization_id, workspace_id) references app.projects(id, organization_id, workspace_id) on delete cascade,
  check (cardinality(permissions) <= 64)
);

create table if not exists app.project_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  snapshot_digest text not null check (snapshot_digest ~ '^[0-9a-f]{64}$'),
  snapshot jsonb not null,
  parent_revision_id uuid references app.project_revisions(id),
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id, revision_number),
  unique (project_id, snapshot_digest),
  foreign key (project_id, organization_id, workspace_id) references app.projects(id, organization_id, workspace_id) on delete cascade
);

alter table app.projects
  add constraint projects_current_revision_fk
  foreign key (current_revision_id)
  references app.project_revisions(id)
  deferrable initially deferred;

create table if not exists app.approval_gates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  kind text not null check (kind in ('producer-review', 'brand-approval', 'legal-approval', 'executive-approval')),
  required_permission text not null default 'approval.decide',
  required boolean not null default true,
  policy_snapshot_digest text not null check (policy_snapshot_digest ~ '^[0-9a-f]{64}$'),
  asset_version_id uuid,
  decision text check (decision in ('approved', 'changes-requested', 'rejected')),
  decided_by_user_id uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (project_id, organization_id, workspace_id) references app.projects(id, organization_id, workspace_id) on delete cascade,
  check (
    (decision is null and decided_by_user_id is null and decided_at is null)
    or
    (decision is not null and decided_by_user_id is not null and decided_at is not null)
  )
);

create table if not exists app.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid references app.workspaces(id) on delete cascade,
  project_id uuid references app.projects(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id),
  action text not null check (length(action) between 1 and 128),
  target_type text not null check (length(target_type) between 1 and 128),
  target_id text not null check (length(target_id) between 1 and 256),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  foreign key (workspace_id, organization_id) references app.workspaces(id, organization_id) on delete cascade,
  foreign key (project_id, organization_id, workspace_id) references app.projects(id, organization_id, workspace_id) on delete cascade
);

create index if not exists workspace_memberships_user_idx
  on app.workspace_memberships (user_id, organization_id, workspace_id)
  where status = 'active';

create index if not exists project_memberships_user_idx
  on app.project_memberships (user_id, organization_id, workspace_id, project_id)
  where status = 'active';

create or replace function app_private.is_workspace_member(
  requested_organization_id uuid,
  requested_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.workspace_memberships wm
    join app.workspaces w on w.id = wm.workspace_id
    where (select auth.uid()) is not null
      and wm.organization_id = requested_organization_id
      and wm.workspace_id = requested_workspace_id
      and w.organization_id = requested_organization_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
  );
$$;

create or replace function app_private.has_workspace_permission(
  requested_organization_id uuid,
  requested_workspace_id uuid,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.workspace_memberships wm
    join app.workspaces w on w.id = wm.workspace_id
    where (select auth.uid()) is not null
      and wm.organization_id = requested_organization_id
      and wm.workspace_id = requested_workspace_id
      and w.organization_id = requested_organization_id
      and wm.user_id = (select auth.uid())
      and wm.status = 'active'
      and (
        requested_permission = any(wm.workspace_permissions)
        or 'organization.admin' = any(wm.organization_permissions)
      )
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
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from app.project_memberships pm
    join app.projects p on p.id = pm.project_id
    where (select auth.uid()) is not null
      and pm.organization_id = requested_organization_id
      and pm.workspace_id = requested_workspace_id
      and pm.project_id = requested_project_id
      and p.organization_id = requested_organization_id
      and p.workspace_id = requested_workspace_id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
      and requested_permission = any(pm.permissions)
  )
  or app_private.has_workspace_permission(requested_organization_id, requested_workspace_id, requested_permission);
$$;

revoke all on function app_private.is_workspace_member(uuid, uuid) from public, anon, authenticated;
revoke all on function app_private.has_workspace_permission(uuid, uuid, text) from public, anon, authenticated;
revoke all on function app_private.has_project_permission(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function app_private.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function app_private.has_workspace_permission(uuid, uuid, text) to authenticated;
grant execute on function app_private.has_project_permission(uuid, uuid, uuid, text) to authenticated;

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
alter table app.project_revisions enable row level security;
alter table app.project_revisions force row level security;
alter table app.approval_gates enable row level security;
alter table app.approval_gates force row level security;
alter table app.audit_events enable row level security;
alter table app.audit_events force row level security;

revoke all on all tables in schema app from anon;
grant select on
  app.organizations,
  app.workspaces,
  app.workspace_memberships,
  app.projects,
  app.project_memberships,
  app.project_revisions,
  app.approval_gates,
  app.audit_events
to authenticated;
grant insert, update on app.projects, app.project_revisions, app.approval_gates to authenticated;
grant insert on app.audit_events to authenticated;

drop policy if exists organizations_select_member on app.organizations;
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

drop policy if exists workspaces_select_member on app.workspaces;
create policy workspaces_select_member
on app.workspaces
for select
to authenticated
using (app_private.is_workspace_member(organization_id, id));

drop policy if exists workspace_memberships_select_scoped on app.workspace_memberships;
create policy workspace_memberships_select_scoped
on app.workspace_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.has_workspace_permission(organization_id, workspace_id, 'organization.admin')
);

drop policy if exists projects_select_member on app.projects;
create policy projects_select_member
on app.projects
for select
to authenticated
using (app_private.has_project_permission(organization_id, workspace_id, id, 'project.read'));

drop policy if exists projects_insert_workspace_writer on app.projects;
create policy projects_insert_workspace_writer
on app.projects
for insert
to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and app_private.has_workspace_permission(organization_id, workspace_id, 'project.write')
);

drop policy if exists projects_update_project_writer on app.projects;
create policy projects_update_project_writer
on app.projects
for update
to authenticated
using (app_private.has_project_permission(organization_id, workspace_id, id, 'project.write'))
with check (app_private.has_project_permission(organization_id, workspace_id, id, 'project.write'));

drop policy if exists project_memberships_select_scoped on app.project_memberships;
create policy project_memberships_select_scoped
on app.project_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.has_project_permission(organization_id, workspace_id, project_id, 'project.read')
);

drop policy if exists project_revisions_select_reader on app.project_revisions;
create policy project_revisions_select_reader
on app.project_revisions
for select
to authenticated
using (app_private.has_project_permission(organization_id, workspace_id, project_id, 'project.read'));

drop policy if exists project_revisions_insert_writer on app.project_revisions;
create policy project_revisions_insert_writer
on app.project_revisions
for insert
to authenticated
with check (
  created_by_user_id = (select auth.uid())
  and app_private.has_project_permission(organization_id, workspace_id, project_id, 'project.write')
);

drop policy if exists approval_gates_select_reader on app.approval_gates;
create policy approval_gates_select_reader
on app.approval_gates
for select
to authenticated
using (app_private.has_project_permission(organization_id, workspace_id, project_id, 'approval.read'));

drop policy if exists approval_gates_update_decider on app.approval_gates;
create policy approval_gates_update_decider
on app.approval_gates
for update
to authenticated
using (app_private.has_project_permission(organization_id, workspace_id, project_id, required_permission))
with check (
  decided_by_user_id = (select auth.uid())
  and app_private.has_project_permission(organization_id, workspace_id, project_id, required_permission)
);

drop policy if exists audit_events_select_reader on app.audit_events;
create policy audit_events_select_reader
on app.audit_events
for select
to authenticated
using (
  (project_id is null and app_private.is_workspace_member(organization_id, workspace_id))
  or app_private.has_project_permission(organization_id, workspace_id, project_id, 'project.read')
);

drop policy if exists audit_events_insert_actor on app.audit_events;
create policy audit_events_insert_actor
on app.audit_events
for insert
to authenticated
with check (
  actor_user_id = (select auth.uid())
  and (
    (project_id is null and app_private.is_workspace_member(organization_id, workspace_id))
    or app_private.has_project_permission(organization_id, workspace_id, project_id, 'project.read')
  )
);
