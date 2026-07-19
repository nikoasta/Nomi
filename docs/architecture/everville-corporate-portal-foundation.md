# Everville Corporate Portal Foundation

Status: implementation slice started

Date: 2026-07-19

Beads task: `evmedia-r20.13`

Live shell: `https://cut.eva.mba/#/studio`

## Purpose

This document captures the first implementation bridge from the live static
Nomi shell to the full Everville corporate collaborative media portal.

The goal of this slice is not to pretend that collaboration is complete. The
goal is to add a typed, test-covered platform boundary so future web backend
work can land without leaking provider secrets, breaking Electron, or rewriting
upstream Nomi project internals.

## Implemented Boundary

Code added in this slice:

- `src/platform/collaboration/contracts.ts`
- `src/platform/collaboration/contracts.test.ts`
- `src/platform/organizations/contracts.ts`
- `src/platform/organizations/contracts.test.ts`
- `src/platform/webPortalClient.ts`
- `src/platform/webPortalClient.test.ts`
- `src/platform/webPortalSession.ts`
- `src/platform/webPortalSession.test.ts`
- `supabase/migrations/20260719141528_everville_portal_auth_rls.sql`

`PlatformClient` now has explicit portal collaboration capabilities:

- `portal.projects.list`
- `portal.projects.create`
- `portal.project-revisions.save`
- `portal.review-queue.list`
- `portal.approvals.decide`
- `portal.audit-events.append`

Current runtime behavior:

- Browser static shell: typed `UNSUPPORTED_CAPABILITY` until configured with a
  Supabase endpoint, publishable key, and user bearer session.
- Electron runtime: typed `UNSUPPORTED_CAPABILITY`.
- Web portal adapter: lists organizations, workspaces, and memberships through
  the Supabase Data API in the `app` schema using publishable browser headers
  plus a user bearer session.
- Browser session wiring: reads `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY`, parses Supabase magic-link callback tokens
  from the URL hash/search, stores a bounded local session, cleans tokens from
  the visible URL, and configures `getPlatformClient()` only while the user
  session is current.
- Future web backend/BFF: will implement write-side collaboration methods
  against Supabase and server-side workers.

This is intentional. The app now has a safe contract shape while still failing
closed until the backend exists.

## Portal Objects

The first contract covers:

- Organization and workspace scope.
- Organization, workspace, and membership records.
- Project records with classification and status.
- Immutable project revision records with optimistic revision checks.
- Approval gates bound to project, asset version, and policy snapshot digest.
- Audit events with metadata sanitization.

Persisted portal records must not contain:

- runtime locators such as `nomi-local://`, `file:`, `blob:`, or absolute paths;
- public/provider CDN URLs;
- cookies, bearer tokens, API keys, credentials, authorization headers, or raw
  provider responses;
- storage bucket/object keys in generic metadata.

Runtime locators and signed URLs are transient resolution outputs only. The
portable cloud identity is an opaque project/asset/version ID plus digest.

## Approval Baseline

Classification maps to approval gates as follows:

| Classification | Required gates |
| --- | --- |
| `internal` | Producer review |
| `public` | Producer review, Brand approval |
| `partner` | Producer review, Brand approval |
| `restricted` | Producer review, Brand approval, Legal approval |
| `investor` | Producer review, Brand approval, Legal approval, Executive approval |

Approval decisions are atomic: `decision`, `decidedByPrincipalId`, and
`decidedAt` must all be present together or absent together.

## Supabase First Model

Use Supabase Auth for identity, but do not use frontend session claims as final
authorization authority. Product authority belongs in Postgres tables and RLS.

Recommended schemas:

- `app`: exposed product tables after explicit grants and RLS.
- `app_private`: non-exposed helpers and server-only implementation details.

Recommended first tables:

- `app.organizations`
- `app.workspaces`
- `app.workspace_memberships`
- `app.projects`
- `app.project_memberships`
- `app.project_revisions`
- `app.assets`
- `app.asset_versions`
- `app.review_queue_items`
- `app.approvals`
- `app.provider_credential_refs`
- `app.audit_events`

Every exposed table must have:

- RLS enabled;
- explicit grants to `authenticated` only where required;
- no `anon` access for product records;
- policies scoped through active organization/workspace/project membership;
- update policies with both `USING` and `WITH CHECK`;
- no authorization decisions based on user-editable metadata.

Service-role keys and provider credentials are server/worker-only. Browser code
may use only `sb_publishable_*` Supabase keys plus a user bearer session; legacy
JWT-shaped API keys are rejected by the web portal adapter.

## RLS Pattern Draft

The first migration was created with the Supabase CLI, not hand-named:

- `supabase/migrations/20260719141528_everville_portal_auth_rls.sql`

This document is still the architecture model; the migration file is the
reviewable implementation artifact.

The reviewed auth/RLS draft now lives in:

- `docs/architecture/everville-supabase-auth-rls-draft.md`

```sql
create schema if not exists app;
create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app to authenticated;
```

Each product table follows this policy shape:

```sql
alter table app.projects enable row level security;
alter table app.projects force row level security;

grant select, insert, update on app.projects to authenticated;

create policy "projects_select_member"
on app.projects
for select
to authenticated
using (
  exists (
    select 1
    from app.project_memberships pm
    where pm.project_id = projects.id
      and pm.user_id = (select auth.uid())
      and pm.status = 'active'
      and 'project.read' = any(pm.permissions)
  )
);
```

Storage should use private buckets and object paths derived from opaque IDs:

```text
org/{organization_id}/workspace/{workspace_id}/project/{project_id}/asset/{asset_id}/version/{version_id}
```

Clients never persist those paths in portal metadata. They request a resolution
for a purpose such as display, download, or provider input.

## Provider Boundary

Current Electron credentials remain local-only. They must not be synced to
Supabase.

Cloud generation should use durable jobs:

1. Browser submits a job ID and project-scoped request.
2. Server checks membership, classification, approval/spend policy, and provider
   eligibility.
3. Worker resolves credential references server-side.
4. Worker writes outputs as `asset_versions` with provenance and cost audit.
5. Browser receives asset/version IDs, not provider secrets or raw credentials.

Higgsfield CLI remains an Electron/local capability until Everville explicitly
approves cloud credential custody.

## Verification For This Slice

Required checks:

```bash
pnpm vitest run src/platform/webPortalSession.test.ts src/platform/webPortalClient.test.ts
pnpm vitest run src/platform/webPortalClient.test.ts src/platform/supabaseRlsMigration.test.ts
pnpm vitest run src/platform/collaboration/contracts.test.ts src/platform/platformClient.boundary.test.ts src/platform/platformClient.contract.test.ts
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm run check:i18n
pnpm run check:secrets
pnpm run build:renderer
curl -I https://cut.eva.mba
```

Before applying the generated migration to a live Supabase project:

- run current Supabase docs/changelog review;
- test two organizations and two users for cross-tenant denial;
- test `anon` denial and scoped `authenticated` access;
- test Storage object RLS and signed URL resolution;
- run Supabase advisors before applying to production.

## Explicit Defers

- Live Supabase project creation/linking and migration application.
- Auth UI and magic-link/OAuth route.
- Server/BFF implementation.
- Cloud storage upload and signed URL resolver.
- Durable generation worker and Higgsfield cloud custody.
- Presence, realtime editing, leases, and conflict resolution UI.
