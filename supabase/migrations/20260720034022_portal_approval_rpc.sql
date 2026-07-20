alter table app.approval_gates
  add column if not exists required_role text not null default 'admin'
  check (required_role in ('admin', 'standards-owner', 'producer', 'creator', 'reviewer', 'viewer'));

create or replace function app.decide_approval_gate(
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
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  locked_gate app.approval_gates%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication is required'
      using errcode = '28000';
  end if;

  if request_decision not in ('approved', 'changes-requested', 'rejected') then
    raise exception 'Invalid approval decision'
      using errcode = '22023';
  end if;

  if request_expected_policy_snapshot_digest !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid policy snapshot digest'
      using errcode = '22023';
  end if;

  select *
  into locked_gate
  from app.approval_gates gate
  where gate.id = request_approval_gate_id
    and gate.organization_id = request_organization_id
    and gate.workspace_id = request_workspace_id
    and gate.project_id = request_project_id
  for update;

  if not found then
    raise exception 'Approval gate not found'
      using errcode = 'P0002';
  end if;

  if locked_gate.policy_snapshot_digest is distinct from request_expected_policy_snapshot_digest then
    raise exception 'Approval policy changed'
      using errcode = '40001';
  end if;

  if not app_private.has_project_permission(
    request_organization_id,
    request_workspace_id,
    request_project_id,
    locked_gate.required_permission
  ) then
    raise exception 'Insufficient approval permission'
      using errcode = '42501';
  end if;

  update app.approval_gates gate
  set
    decision = request_decision,
    decided_by_user_id = actor_id,
    decided_at = now(),
    updated_at = now()
  where gate.id = locked_gate.id
  returning
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
  into
    id,
    organization_id,
    workspace_id,
    project_id,
    kind,
    required_role,
    required,
    policy_snapshot_digest,
    asset_version_id,
    decision,
    decided_by_user_id,
    decided_at,
    created_at,
    updated_at;

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
    'approval.decide',
    'approval_gate',
    request_approval_gate_id::text,
    jsonb_strip_nulls(
      jsonb_build_object(
        'decision',
        request_decision,
        'comment',
        nullif(trim(coalesce(request_comment, '')), '')
      )
    )
  );

  return next;
end;
$$;

revoke all on function app.decide_approval_gate(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function app.decide_approval_gate(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text
) to authenticated;
