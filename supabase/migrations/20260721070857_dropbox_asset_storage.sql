-- Durable private media registry for the Everville Nomi portal.
-- Dropbox owns immutable bytes. Supabase owns authorization, stable identity,
-- provenance, and the private Dropbox locator used only by the portal BFF.

create table if not exists app.assets (
  id text primary key check (id ~ '^ast_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, organization_id, workspace_id, project_id),
  foreign key (project_id, organization_id, workspace_id)
    references app.projects(id, organization_id, workspace_id) on delete cascade
);

create table if not exists app.asset_versions (
  id text primary key check (id ~ '^av_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  asset_id text not null references app.assets(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  predecessor_version_id text references app.asset_versions(id),
  derived_from_version_ids text[] not null default '{}',
  sha256_digest text not null check (sha256_digest ~ '^[0-9a-f]{64}$'),
  size_bytes bigint not null check (size_bytes >= 0),
  media_type text not null check (media_type ~ '^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$'),
  classification text not null check (classification in ('unknown', 'public', 'internal', 'confidential', 'restricted')),
  validation jsonb not null,
  provenance jsonb not null,
  created_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (id, asset_id, organization_id, workspace_id, project_id),
  foreign key (asset_id, organization_id, workspace_id, project_id)
    references app.assets(id, organization_id, workspace_id, project_id) on delete cascade,
  foreign key (project_id, organization_id, workspace_id)
    references app.projects(id, organization_id, workspace_id) on delete cascade
);

create table if not exists app.asset_ingestions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  provider text not null check (provider ~ '^[a-z0-9][a-z0-9._-]{0,63}$'),
  provider_task_id text not null check (length(provider_task_id) between 1 and 256),
  output_index integer not null check (output_index >= 0 and output_index <= 1024),
  idempotency_hash text not null check (idempotency_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  asset_id text not null references app.assets(id) on delete cascade,
  asset_version_id text not null references app.asset_versions(id) on delete cascade,
  status text not null default 'stored' check (status in ('stored', 'quarantined', 'failed')),
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_id, provider, provider_task_id, output_index),
  unique (organization_id, project_id, idempotency_hash),
  foreign key (project_id, organization_id, workspace_id)
    references app.projects(id, organization_id, workspace_id) on delete cascade
);

create table if not exists app_private.asset_storage_objects (
  asset_version_id text primary key references app.asset_versions(id) on delete cascade,
  organization_id uuid not null references app.organizations(id) on delete cascade,
  workspace_id uuid not null references app.workspaces(id) on delete cascade,
  project_id uuid not null references app.projects(id) on delete cascade,
  storage_provider text not null check (storage_provider = 'dropbox'),
  namespace_id text not null check (namespace_id ~ '^[0-9]+$'),
  file_id text not null check (file_id ~ '^id:[A-Za-z0-9_-]+$'),
  path_display text not null check (path_display like '/%'),
  revision text not null check (length(revision) between 1 and 256),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (namespace_id, file_id, revision),
  foreign key (project_id, organization_id, workspace_id)
    references app.projects(id, organization_id, workspace_id) on delete cascade
);

create index if not exists assets_project_created_idx
  on app.assets (organization_id, project_id, created_at desc, id);
create index if not exists asset_versions_project_created_idx
  on app.asset_versions (organization_id, project_id, created_at desc, id);
create index if not exists asset_ingestions_task_idx
  on app.asset_ingestions (organization_id, project_id, provider, provider_task_id, output_index);

alter table app.assets enable row level security;
alter table app.assets force row level security;
alter table app.asset_versions enable row level security;
alter table app.asset_versions force row level security;
alter table app.asset_ingestions enable row level security;
alter table app.asset_ingestions force row level security;
alter table app_private.asset_storage_objects enable row level security;
alter table app_private.asset_storage_objects force row level security;

revoke all on app.assets, app.asset_versions, app.asset_ingestions from public, anon, authenticated;
revoke all on app_private.asset_storage_objects from public, anon, authenticated;
grant select, insert, update on app.assets, app.asset_versions, app.asset_ingestions to service_role;
grant select, insert, update on app_private.asset_storage_objects to service_role;

create or replace function app_private.asset_bundle_json(
  asset_row app.assets,
  version_row app.asset_versions
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'asset', jsonb_build_object(
      'schemaVersion', 'asset.v1',
      'id', asset_row.id,
      'scope', jsonb_build_object('organizationId', asset_row.organization_id, 'projectId', asset_row.project_id),
      'createdAt', asset_row.created_at,
      'createdByPrincipalId', asset_row.created_by_user_id
    ),
    'version', jsonb_build_object(
      'schemaVersion', 'asset-version.v1',
      'id', version_row.id,
      'assetId', version_row.asset_id,
      'scope', jsonb_build_object('organizationId', version_row.organization_id, 'projectId', version_row.project_id),
      'predecessorVersionId', version_row.predecessor_version_id,
      'derivedFromVersionIds', to_jsonb(version_row.derived_from_version_ids),
      'integrity', jsonb_build_object(
        'algorithm', 'sha256',
        'digest', version_row.sha256_digest,
        'sizeBytes', version_row.size_bytes,
        'mediaType', version_row.media_type
      ),
      'classification', version_row.classification,
      'validation', version_row.validation,
      'provenance', version_row.provenance,
      'createdAt', version_row.created_at,
      'createdByPrincipalId', version_row.created_by_user_id
    )
  );
$$;

revoke all on function app_private.asset_bundle_json(app.assets, app.asset_versions) from public, anon, authenticated;
grant usage on schema app_private to service_role;

create or replace function public.nomi_portal_authorize_asset_scope(
  request_organization_id uuid,
  request_project_id uuid,
  request_permission text
)
returns table (organization_id uuid, workspace_id uuid, project_id uuid, actor_user_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  project_workspace_id uuid;
  effective_permission text;
begin
  if actor_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;
  if request_permission not in ('project.read', 'project.write', 'asset.read', 'asset.write') then
    raise exception 'Invalid asset permission' using errcode = '22023';
  end if;

  effective_permission := case request_permission
    when 'asset.read' then 'project.read'
    when 'asset.write' then 'project.write'
    else request_permission
  end;

  select project.workspace_id into project_workspace_id
  from app.projects project
  where project.id = request_project_id
    and project.organization_id = request_organization_id;

  if project_workspace_id is null or not app_private.has_project_permission(
    request_organization_id,
    project_workspace_id,
    request_project_id,
    effective_permission
  ) then
    raise exception 'Asset permission is required' using errcode = '42501';
  end if;

  return query select request_organization_id, project_workspace_id, request_project_id, actor_id;
end;
$$;

create or replace function public.nomi_portal_list_asset_bundles(
  request_organization_id uuid,
  request_project_id uuid,
  request_cursor text default null,
  request_limit integer default 100
)
returns table (bundle jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_workspace_id uuid;
  safe_limit integer := least(greatest(coalesce(request_limit, 100), 1), 500);
begin
  select scope.workspace_id into project_workspace_id
  from public.nomi_portal_authorize_asset_scope(request_organization_id, request_project_id, 'asset.read') scope;

  return query
  select app_private.asset_bundle_json(asset, version)
  from app.assets asset
  join app.asset_versions version on version.asset_id = asset.id
  where asset.organization_id = request_organization_id
    and asset.workspace_id = project_workspace_id
    and asset.project_id = request_project_id
    and (request_cursor is null or asset.id > request_cursor)
  order by asset.id asc, version.created_at desc
  limit safe_limit;
end;
$$;

create or replace function public.nomi_portal_get_asset_bundle(
  request_organization_id uuid,
  request_project_id uuid,
  request_asset_id text,
  request_version_id text
)
returns table (bundle jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_workspace_id uuid;
begin
  select scope.workspace_id into project_workspace_id
  from public.nomi_portal_authorize_asset_scope(request_organization_id, request_project_id, 'asset.read') scope;

  return query
  select app_private.asset_bundle_json(asset, version)
  from app.assets asset
  join app.asset_versions version on version.asset_id = asset.id
  where asset.organization_id = request_organization_id
    and asset.workspace_id = project_workspace_id
    and asset.project_id = request_project_id
    and asset.id = request_asset_id
    and version.id = request_version_id
  limit 1;
end;
$$;

create or replace function public.nomi_portal_service_register_asset(
  request_organization_id uuid,
  request_workspace_id uuid,
  request_project_id uuid,
  request_actor_user_id uuid,
  request_asset_id text,
  request_version_id text,
  request_provider text,
  request_provider_task_id text,
  request_output_index integer,
  request_idempotency_hash text,
  request_fingerprint text,
  request_sha256_digest text,
  request_size_bytes bigint,
  request_media_type text,
  request_classification text,
  request_validation jsonb,
  request_provenance jsonb,
  request_namespace_id text,
  request_file_id text,
  request_path_display text,
  request_revision text,
  request_content_hash text
)
returns table (bundle jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_fingerprint text;
  existing_asset_id text;
  existing_version_id text;
  created_at_value timestamptz := now();
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role is required' using errcode = '42501';
  end if;

  -- Serialize retries for the same provider output. This keeps a web request,
  -- a desktop retry, and a recovery poll from racing between the lookup and
  -- the four related inserts below.
  perform pg_advisory_xact_lock(
    hashtextextended(
      request_organization_id::text || ':' || request_project_id::text || ':' || request_idempotency_hash,
      0
    )
  );

  select ingestion.request_fingerprint, ingestion.asset_id, ingestion.asset_version_id
    into existing_fingerprint, existing_asset_id, existing_version_id
  from app.asset_ingestions ingestion
  where ingestion.organization_id = request_organization_id
    and ingestion.project_id = request_project_id
    and ingestion.idempotency_hash = request_idempotency_hash;

  if existing_asset_id is not null then
    if existing_fingerprint <> request_fingerprint then
      raise exception 'Idempotency key was rebound' using errcode = '23505';
    end if;
    return query
      select app_private.asset_bundle_json(asset, version)
      from app.assets asset
      join app.asset_versions version on version.asset_id = asset.id
      where asset.id = existing_asset_id and version.id = existing_version_id;
    return;
  end if;

  insert into app.assets (
    id, organization_id, workspace_id, project_id, created_by_user_id, created_at
  ) values (
    request_asset_id, request_organization_id, request_workspace_id, request_project_id,
    request_actor_user_id, created_at_value
  );

  insert into app.asset_versions (
    id, asset_id, organization_id, workspace_id, project_id,
    sha256_digest, size_bytes, media_type, classification, validation, provenance,
    created_by_user_id, created_at
  ) values (
    request_version_id, request_asset_id, request_organization_id, request_workspace_id, request_project_id,
    request_sha256_digest, request_size_bytes, request_media_type, request_classification,
    request_validation, request_provenance, request_actor_user_id, created_at_value
  );

  insert into app_private.asset_storage_objects (
    asset_version_id, organization_id, workspace_id, project_id, storage_provider,
    namespace_id, file_id, path_display, revision, content_hash, created_at
  ) values (
    request_version_id, request_organization_id, request_workspace_id, request_project_id, 'dropbox',
    request_namespace_id, request_file_id, request_path_display, request_revision, request_content_hash,
    created_at_value
  );

  insert into app.asset_ingestions (
    organization_id, workspace_id, project_id, provider, provider_task_id, output_index,
    idempotency_hash, request_fingerprint, asset_id, asset_version_id, status,
    created_by_user_id, created_at, updated_at
  ) values (
    request_organization_id, request_workspace_id, request_project_id, request_provider,
    request_provider_task_id, request_output_index, request_idempotency_hash, request_fingerprint,
    request_asset_id, request_version_id, 'stored', request_actor_user_id, created_at_value, created_at_value
  );

  return query
    select app_private.asset_bundle_json(asset, version)
    from app.assets asset
    join app.asset_versions version on version.asset_id = asset.id
    where asset.id = request_asset_id and version.id = request_version_id;
end;
$$;

create or replace function public.nomi_portal_service_resolve_asset(
  request_organization_id uuid,
  request_project_id uuid,
  request_asset_id text,
  request_version_id text
)
returns table (
  bundle jsonb,
  namespace_id text,
  file_id text,
  path_display text,
  revision text,
  content_hash text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'Service role is required' using errcode = '42501';
  end if;

  return query
    select
      app_private.asset_bundle_json(asset, version),
      storage.namespace_id,
      storage.file_id,
      storage.path_display,
      storage.revision,
      storage.content_hash
    from app.assets asset
    join app.asset_versions version on version.asset_id = asset.id
    join app_private.asset_storage_objects storage on storage.asset_version_id = version.id
    where asset.organization_id = request_organization_id
      and asset.project_id = request_project_id
      and asset.id = request_asset_id
      and version.id = request_version_id
    limit 1;
end;
$$;

revoke all on function public.nomi_portal_authorize_asset_scope(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.nomi_portal_list_asset_bundles(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.nomi_portal_get_asset_bundle(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.nomi_portal_service_register_asset(uuid, uuid, uuid, uuid, text, text, text, text, integer, text, text, text, bigint, text, text, jsonb, jsonb, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.nomi_portal_service_resolve_asset(uuid, uuid, text, text) from public, anon, authenticated;

grant execute on function public.nomi_portal_authorize_asset_scope(uuid, uuid, text) to authenticated;
grant execute on function public.nomi_portal_list_asset_bundles(uuid, uuid, text, integer) to authenticated;
grant execute on function public.nomi_portal_get_asset_bundle(uuid, uuid, text, text) to authenticated;
grant execute on function public.nomi_portal_service_register_asset(uuid, uuid, uuid, uuid, text, text, text, text, integer, text, text, text, bigint, text, text, jsonb, jsonb, text, text, text, text, text) to service_role;
grant execute on function public.nomi_portal_service_resolve_asset(uuid, uuid, text, text) to service_role;
