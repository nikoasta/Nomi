-- Transactional portal revision save RPC for the web client.
--
-- Browser callers pass only selectors and immutable content. Authority and
-- authorship are derived from auth.uid() plus RLS membership helpers.

create or replace function app.save_project_revision(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  locked_current_revision_id uuid;
  existing_revision_id uuid;
  next_revision_number integer;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_snapshot_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'snapshot digest must be canonical'
      using errcode = '22023';
  end if;

  select p.current_revision_id
    into locked_current_revision_id
  from app.projects p
  where p.id = request_project_id
    and p.organization_id = request_organization_id
    and p.workspace_id = request_workspace_id
  for update;

  if not found then
    raise exception 'Portal project not found'
      using errcode = '02000';
  end if;

  if not app_private.has_project_permission(
    request_organization_id,
    request_workspace_id,
    request_project_id,
    'project.write'
  ) then
    raise exception 'Project write permission is required'
      using errcode = '42501';
  end if;

  if locked_current_revision_id is distinct from request_expected_current_revision_id then
    raise exception 'Project revision conflict'
      using errcode = '40001';
  end if;

  select pr.id
    into existing_revision_id
  from app.project_revisions pr
  where pr.project_id = request_project_id
    and pr.snapshot_digest = request_snapshot_digest;

  if existing_revision_id is not null then
    update app.projects
      set current_revision_id = existing_revision_id,
          updated_at = now()
    where app.projects.id = request_project_id
      and app.projects.organization_id = request_organization_id
      and app.projects.workspace_id = request_workspace_id;
  else
    select coalesce(max(pr.revision_number), 0) + 1
      into next_revision_number
    from app.project_revisions pr
    where pr.project_id = request_project_id;

    insert into app.project_revisions (
      organization_id,
      workspace_id,
      project_id,
      revision_number,
      snapshot_digest,
      snapshot,
      parent_revision_id,
      created_by_user_id
    )
    values (
      request_organization_id,
      request_workspace_id,
      request_project_id,
      next_revision_number,
      request_snapshot_digest,
      request_snapshot,
      request_expected_current_revision_id,
      actor_id
    )
    returning app.project_revisions.id into existing_revision_id;

    update app.projects
      set current_revision_id = existing_revision_id,
          updated_at = now()
    where app.projects.id = request_project_id
      and app.projects.organization_id = request_organization_id
      and app.projects.workspace_id = request_workspace_id;
  end if;

  return query
    select
      pr.id,
      pr.organization_id,
      pr.workspace_id,
      pr.project_id,
      pr.revision_number,
      pr.snapshot_digest,
      pr.parent_revision_id,
      pr.created_by_user_id,
      pr.created_at
    from app.project_revisions pr
    where pr.id = existing_revision_id;
end;
$$;

revoke all on function app.save_project_revision(uuid, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function app.save_project_revision(uuid, uuid, uuid, uuid, text, jsonb) to authenticated;
