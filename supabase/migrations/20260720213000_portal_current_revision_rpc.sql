-- Read the current Nomi portal project revision with the caller's auth context.
--
-- The Vercel BFF calls this public wrapper with a user bearer token. The
-- function keeps app.project_revisions off the browser surface while preserving
-- auth.uid() and project permission checks inside Postgres.

create or replace function public.nomi_portal_get_current_project_revision(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid
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
  created_at timestamptz,
  snapshot jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if not app_private.has_project_permission(
    request_organization_id,
    request_workspace_id,
    request_project_id,
    'project.read'
  ) then
    raise exception 'Project read permission is required'
      using errcode = '42501';
  end if;

  return query
    select
      revision.id,
      revision.organization_id,
      revision.workspace_id,
      revision.project_id,
      revision.revision_number,
      revision.snapshot_digest,
      revision.parent_revision_id,
      revision.created_by_user_id,
      revision.created_at,
      revision.snapshot
    from app.projects project
    join app.project_revisions revision
      on revision.id = project.current_revision_id
     and revision.organization_id = project.organization_id
     and revision.workspace_id = project.workspace_id
     and revision.project_id = project.id
    where project.id = request_project_id
      and project.organization_id = request_organization_id
      and project.workspace_id = request_workspace_id
    limit 1;
end;
$$;

revoke all on function public.nomi_portal_get_current_project_revision(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.nomi_portal_get_current_project_revision(uuid, uuid, uuid) to authenticated;
