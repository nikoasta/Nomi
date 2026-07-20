-- Service-role-only member lookup for the Nomi portal auth BFF.
--
-- This function lets the Vercel server verify that a magic-link request
-- belongs to an existing active workspace member before generating a custom
-- Supabase Auth link. It is intentionally not granted to anon/authenticated.

create or replace function public.nomi_portal_find_member_by_email(
  request_email text
)
returns table (
  user_id uuid,
  email text,
  organization_id uuid,
  workspace_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return query
    select
      auth_user.id,
      auth_user.email::text,
      membership.organization_id,
      membership.workspace_id
    from auth.users auth_user
    join app.workspace_memberships membership on membership.user_id = auth_user.id
    join app.workspaces workspace on workspace.id = membership.workspace_id
    join app.organizations organization on organization.id = membership.organization_id
    where lower(auth_user.email) = lower(trim(request_email))
      and auth_user.deleted_at is null
      and membership.status = 'active'
      and workspace.status = 'active'
      and organization.status = 'active'
    order by membership.updated_at desc
    limit 1;
end;
$$;

revoke all on function public.nomi_portal_find_member_by_email(text) from public, anon, authenticated;
grant execute on function public.nomi_portal_find_member_by_email(text) to service_role;
