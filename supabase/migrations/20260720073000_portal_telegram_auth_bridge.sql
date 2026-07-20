-- Service-role-only Telegram auth bridge for the Nomi portal.
--
-- This lets the Vercel BFF reuse the approved EVA team roster while still
-- issuing sessions only for the private Nomi workspace. The function is not
-- exposed to browser roles.

create or replace function public.nomi_portal_find_or_create_member_by_telegram(
  request_telegram_id text,
  request_telegram_username text default null
)
returns table (
  user_id uuid,
  email text,
  organization_id uuid,
  workspace_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  telegram_numeric bigint;
  normalized_username text;
  team_member public.team_members%rowtype;
  target_organization_id uuid;
  target_workspace_id uuid;
  resolved_user_id uuid;
  resolved_email text;
begin
  if request_telegram_id is null or btrim(request_telegram_id) !~ '^[0-9]{1,18}$' then
    return;
  end if;

  telegram_numeric := btrim(request_telegram_id)::bigint;
  normalized_username := nullif(regexp_replace(coalesce(request_telegram_username, ''), '^@+', ''), '');
  if normalized_username is not null and normalized_username !~ '^[A-Za-z0-9_]{5,32}$' then
    normalized_username := null;
  end if;

  select *
  into team_member
  from public.team_members candidate
  where candidate.is_approved = true
    and candidate.telegram_id = telegram_numeric
  order by candidate.updated_at desc nulls last
  limit 1;

  if team_member.id is null and normalized_username is not null then
    update public.team_members
    set telegram_id = telegram_numeric,
        updated_at = now()
    where id = (
      select candidate.id
      from public.team_members candidate
      where candidate.is_approved = true
        and candidate.telegram_id is null
        and lower(candidate.telegram_username) = lower(normalized_username)
      order by candidate.updated_at desc nulls last
      limit 1
    )
      and telegram_id is null
    returning * into team_member;
  end if;

  if team_member.id is null then
    return;
  end if;

  resolved_user_id := team_member.auth_user_id;
  if resolved_user_id is null and team_member.email is not null then
    select auth_user.id
    into resolved_user_id
    from auth.users auth_user
    where lower(auth_user.email) = lower(team_member.email)
      and auth_user.deleted_at is null
    order by auth_user.created_at desc
    limit 1;
  end if;

  if resolved_user_id is null then
    return;
  end if;

  select auth_user.email::text
  into resolved_email
  from auth.users auth_user
  where auth_user.id = resolved_user_id
    and auth_user.deleted_at is null
  limit 1;

  if resolved_email is null then
    return;
  end if;

  select organization.id, workspace.id
  into target_organization_id, target_workspace_id
  from app.organizations organization
  join app.workspaces workspace on workspace.organization_id = organization.id
  where organization.slug = 'everville'
    and workspace.slug = 'content-studio'
    and organization.status = 'active'
    and workspace.status = 'active'
  limit 1;

  if target_organization_id is null or target_workspace_id is null then
    return;
  end if;

  insert into app.workspace_memberships (
    organization_id,
    workspace_id,
    user_id,
    status,
    roles,
    organization_permissions,
    workspace_permissions
  )
  values (
    target_organization_id,
    target_workspace_id,
    resolved_user_id,
    'active',
    array['member']::text[],
    '{}'::text[],
    '{}'::text[]
  )
  on conflict on constraint workspace_memberships_workspace_id_user_id_key
  do update
    set status = 'active',
        updated_at = now()
    where app.workspace_memberships.status <> 'active';

  return query
    select
      resolved_user_id,
      resolved_email,
      target_organization_id,
      target_workspace_id;
end;
$$;

revoke all on function public.nomi_portal_find_or_create_member_by_telegram(text, text) from public, anon, authenticated;
grant execute on function public.nomi_portal_find_or_create_member_by_telegram(text, text) to service_role;
