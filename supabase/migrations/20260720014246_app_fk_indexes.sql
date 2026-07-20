create index if not exists workspace_memberships_organization_id_idx
  on app.workspace_memberships (organization_id);

create index if not exists workspace_memberships_workspace_organization_idx
  on app.workspace_memberships (workspace_id, organization_id);

create index if not exists workspace_memberships_user_id_idx
  on app.workspace_memberships (user_id);

create index if not exists projects_organization_id_idx
  on app.projects (organization_id);

create index if not exists projects_workspace_organization_idx
  on app.projects (workspace_id, organization_id);

create index if not exists projects_created_by_user_id_idx
  on app.projects (created_by_user_id);

create index if not exists projects_current_revision_id_idx
  on app.projects (current_revision_id);

create index if not exists project_memberships_organization_id_idx
  on app.project_memberships (organization_id);

create index if not exists project_memberships_workspace_id_idx
  on app.project_memberships (workspace_id);

create index if not exists project_memberships_project_organization_workspace_idx
  on app.project_memberships (project_id, organization_id, workspace_id);

create index if not exists project_memberships_user_id_idx
  on app.project_memberships (user_id);

create index if not exists project_revisions_organization_id_idx
  on app.project_revisions (organization_id);

create index if not exists project_revisions_workspace_id_idx
  on app.project_revisions (workspace_id);

create index if not exists project_revisions_project_organization_workspace_idx
  on app.project_revisions (project_id, organization_id, workspace_id);

create index if not exists project_revisions_parent_revision_id_idx
  on app.project_revisions (parent_revision_id);

create index if not exists project_revisions_created_by_user_id_idx
  on app.project_revisions (created_by_user_id);

create index if not exists approval_gates_decided_by_user_id_idx
  on app.approval_gates (decided_by_user_id);

create index if not exists approval_gates_organization_id_idx
  on app.approval_gates (organization_id);

create index if not exists approval_gates_workspace_id_idx
  on app.approval_gates (workspace_id);

create index if not exists approval_gates_project_id_idx
  on app.approval_gates (project_id);

create index if not exists approval_gates_project_organization_workspace_idx
  on app.approval_gates (project_id, organization_id, workspace_id);

create index if not exists audit_events_actor_user_id_idx
  on app.audit_events (actor_user_id);

create index if not exists audit_events_organization_id_idx
  on app.audit_events (organization_id);

create index if not exists audit_events_workspace_id_idx
  on app.audit_events (workspace_id);

create index if not exists audit_events_workspace_organization_idx
  on app.audit_events (workspace_id, organization_id);

create index if not exists audit_events_project_id_idx
  on app.audit_events (project_id);

create index if not exists audit_events_project_organization_workspace_idx
  on app.audit_events (project_id, organization_id, workspace_id);
