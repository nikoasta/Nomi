-- Public-schema RPC facade for the Vercel portal BFF.
--
-- The Supabase Data API for this project intentionally does not expose the
-- app schema. Browser code talks to /api/portal, and that server route calls
-- these authenticated RPCs with the user's bearer token. These wrappers keep
-- the browser off unrelated public-schema tables while preserving auth.uid()
-- and app_private permission checks.

revoke insert on app.audit_events from authenticated;

create or replace function public.nomi_portal_list_organizations(
  request_limit integer default 50
)
returns table (
  id uuid,
  slug text,
  name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(request_limit, 50), 1), 100);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  return query
    select distinct
      org.id,
      org.slug,
      org.name,
      org.status,
      org.created_at,
      org.updated_at
    from app.organizations org
    join app.workspace_memberships wm on wm.organization_id = org.id
    where wm.user_id = actor_id
      and wm.status = 'active'
    order by org.name asc
    limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_list_workspaces(
  request_organization_id uuid,
  request_status text default null,
  request_limit integer default 50
)
returns table (
  id uuid,
  organization_id uuid,
  slug text,
  name text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(request_limit, 50), 1), 100);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_status is not null and request_status not in ('active', 'archived') then
    raise exception 'Invalid workspace status'
      using errcode = '22023';
  end if;

  return query
    select
      workspace.id,
      workspace.organization_id,
      workspace.slug,
      workspace.name,
      workspace.status,
      workspace.created_at,
      workspace.updated_at
    from app.workspaces workspace
    where workspace.organization_id = request_organization_id
      and app_private.is_workspace_member(request_organization_id, workspace.id)
      and (request_status is null or workspace.status = request_status)
    order by workspace.name asc
    limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_list_memberships(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_status text default null,
  request_limit integer default 50
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  user_id uuid,
  status text,
  roles text[],
  organization_permissions text[],
  workspace_permissions text[],
  project_memberships jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(request_limit, 50), 1), 100);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_status is not null and request_status not in ('active', 'inactive', 'invited') then
    raise exception 'Invalid membership status'
      using errcode = '22023';
  end if;

  return query
    select
      wm.id,
      wm.organization_id,
      wm.workspace_id,
      wm.user_id,
      wm.status,
      wm.roles,
      wm.organization_permissions,
      wm.workspace_permissions,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'project_id', pm.project_id,
              'permissions', pm.permissions
            )
            order by pm.created_at asc
          )
          from app.project_memberships pm
          where pm.organization_id = wm.organization_id
            and pm.workspace_id = wm.workspace_id
            and pm.user_id = wm.user_id
            and pm.status = 'active'
        ),
        '[]'::jsonb
      ) as project_memberships,
      wm.created_at,
      wm.updated_at
    from app.workspace_memberships wm
    where wm.organization_id = request_organization_id
      and wm.workspace_id = request_workspace_id
      and (request_status is null or wm.status = request_status)
      and (
        wm.user_id = actor_id
        or app_private.has_workspace_permission(request_organization_id, request_workspace_id, 'organization.admin')
      )
    order by wm.created_at asc
    limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_list_projects(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_status text default null,
  request_limit integer default 50
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  slug text,
  title text,
  classification text,
  status text,
  current_revision_id uuid,
  created_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(request_limit, 50), 1), 100);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_status is not null and request_status not in ('draft', 'in-production', 'in-review', 'approved', 'archived') then
    raise exception 'Invalid project status'
      using errcode = '22023';
  end if;

  return query
    select
      project.id,
      project.organization_id,
      project.workspace_id,
      project.slug,
      project.title,
      project.classification,
      project.status,
      project.current_revision_id,
      project.created_by_user_id,
      project.created_at,
      project.updated_at
    from app.projects project
    where project.organization_id = request_organization_id
      and project.workspace_id = request_workspace_id
      and app_private.has_project_permission(request_organization_id, request_workspace_id, project.id, 'project.read')
      and (request_status is null or project.status = request_status)
    order by project.updated_at desc
    limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_create_project(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_slug text,
  request_title text,
  request_classification text
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  slug text,
  title text,
  classification text,
  status text,
  current_revision_id uuid,
  created_by_user_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid project slug'
      using errcode = '22023';
  end if;

  if length(request_title) < 1 or length(request_title) > 256 then
    raise exception 'Invalid project title'
      using errcode = '22023';
  end if;

  if request_classification not in ('public', 'partner', 'investor', 'internal', 'restricted') then
    raise exception 'Invalid project classification'
      using errcode = '22023';
  end if;

  if not app_private.has_workspace_permission(request_organization_id, request_workspace_id, 'project.write') then
    raise exception 'Project write permission is required'
      using errcode = '42501';
  end if;

  return query
    insert into app.projects (
      organization_id,
      workspace_id,
      slug,
      title,
      classification,
      status,
      created_by_user_id
    )
    values (
      request_organization_id,
      request_workspace_id,
      request_slug,
      request_title,
      request_classification,
      'draft',
      actor_id
    )
    returning
      app.projects.id,
      app.projects.organization_id,
      app.projects.workspace_id,
      app.projects.slug,
      app.projects.title,
      app.projects.classification,
      app.projects.status,
      app.projects.current_revision_id,
      app.projects.created_by_user_id,
      app.projects.created_at,
      app.projects.updated_at;
end;
$$;

create or replace function public.nomi_portal_save_project_revision(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid,
  request_expected_current_revision_id uuid,
  request_snapshot_digest text,
  request_snapshot jsonb
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  project_id uuid,
  revision_number integer,
  snapshot_digest text,
  parent_revision_id uuid,
  created_by_user_id uuid,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select *
  from app.save_project_revision(
    request_organization_id,
    request_workspace_id,
    request_project_id,
    request_expected_current_revision_id,
    request_snapshot_digest,
    request_snapshot
  );
$$;

create or replace function public.nomi_portal_list_review_queue(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid default null,
  request_limit integer default 50
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  project_id uuid,
  kind text,
  required_role text,
  required boolean,
  policy_snapshot_digest text,
  asset_version_id uuid,
  decision text,
  decided_by_user_id uuid,
  decided_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  safe_limit integer := least(greatest(coalesce(request_limit, 50), 1), 100);
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  return query
    select
      gate.id,
      gate.organization_id,
      gate.workspace_id,
      gate.project_id,
      gate.kind,
      gate.required_role,
      gate.required,
      gate.policy_snapshot_digest,
      gate.asset_version_id,
      gate.decision,
      gate.decided_by_user_id,
      gate.decided_at,
      gate.created_at,
      gate.updated_at
    from app.approval_gates gate
    where gate.organization_id = request_organization_id
      and gate.workspace_id = request_workspace_id
      and (request_project_id is null or gate.project_id = request_project_id)
      and app_private.has_project_permission(request_organization_id, request_workspace_id, gate.project_id, 'approval.read')
    order by gate.updated_at desc
    limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_decide_approval_gate(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid,
  request_approval_gate_id uuid,
  request_decision text,
  request_expected_policy_snapshot_digest text,
  request_comment text default null
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  project_id uuid,
  kind text,
  required_role text,
  required boolean,
  policy_snapshot_digest text,
  asset_version_id uuid,
  decision text,
  decided_by_user_id uuid,
  decided_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select *
  from app.decide_approval_gate(
    request_organization_id,
    request_workspace_id,
    request_project_id,
    request_approval_gate_id,
    request_decision,
    request_expected_policy_snapshot_digest,
    request_comment
  );
$$;

create or replace function public.nomi_portal_append_audit_event(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid,
  request_action text,
  request_target_type text,
  request_target_id text,
  request_metadata jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  organization_id uuid,
  workspace_id uuid,
  project_id uuid,
  actor_user_id uuid,
  action text,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_action not in ('project.create', 'project.view', 'project.revision.save', 'approval.decide') then
    raise exception 'Invalid audit action'
      using errcode = '22023';
  end if;

  if request_target_type not in ('project', 'approval_gate') then
    raise exception 'Invalid audit target type'
      using errcode = '22023';
  end if;

  if length(request_target_id) < 1 or length(request_target_id) > 256 then
    raise exception 'Invalid audit target id'
      using errcode = '22023';
  end if;

  if pg_column_size(coalesce(request_metadata, '{}'::jsonb)) > 8192 then
    raise exception 'Audit metadata is too large'
      using errcode = '22023';
  end if;

  if not (
    (request_project_id is null and app_private.is_workspace_member(request_organization_id, request_workspace_id))
    or app_private.has_project_permission(request_organization_id, request_workspace_id, request_project_id, 'project.read')
  ) then
    raise exception 'Project read permission is required'
      using errcode = '42501';
  end if;

  return query
    insert into app.audit_events (
      organization_id,
      workspace_id,
      project_id,
      actor_user_id,
      action,
      target_type,
      target_id,
      metadata
    )
    values (
      request_organization_id,
      request_workspace_id,
      request_project_id,
      actor_id,
      request_action,
      request_target_type,
      request_target_id,
      coalesce(request_metadata, '{}'::jsonb)
    )
    returning
      app.audit_events.id,
      app.audit_events.organization_id,
      app.audit_events.workspace_id,
      app.audit_events.project_id,
      app.audit_events.actor_user_id,
      app.audit_events.action,
      app.audit_events.target_type,
      app.audit_events.target_id,
      app.audit_events.metadata,
      app.audit_events.created_at;
end;
$$;

revoke all on function public.nomi_portal_list_organizations(integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_list_workspaces(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_list_memberships(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_list_projects(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_create_project(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.nomi_portal_save_project_revision(uuid, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.nomi_portal_list_review_queue(uuid, uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_decide_approval_gate(uuid, uuid, uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.nomi_portal_append_audit_event(uuid, uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;

grant execute on function public.nomi_portal_list_organizations(integer) to authenticated;
grant execute on function public.nomi_portal_list_workspaces(uuid, text, integer) to authenticated;
grant execute on function public.nomi_portal_list_memberships(uuid, uuid, text, integer) to authenticated;
grant execute on function public.nomi_portal_list_projects(uuid, uuid, text, integer) to authenticated;
grant execute on function public.nomi_portal_create_project(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.nomi_portal_save_project_revision(uuid, uuid, uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.nomi_portal_list_review_queue(uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.nomi_portal_decide_approval_gate(uuid, uuid, uuid, uuid, text, text, text) to authenticated;
grant execute on function public.nomi_portal_append_audit_event(uuid, uuid, uuid, text, text, text, jsonb) to authenticated;
