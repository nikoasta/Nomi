# Everville Dropbox Asset Storage

Status: implemented for production rollout

Date: 2026-07-21

Beads task: `evmedia-r20.8.2`

## Purpose

Nomi web and desktop share project metadata through Supabase, while immutable
generated media is stored in the Everville Dropbox Team Space. Provider result
URLs are treated as temporary transport only and are never the durable project
record.

The storage boundary is deliberately split:

- Dropbox owns private immutable bytes.
- Supabase owns tenant authorization, asset identity, integrity, provenance,
  and the server-only Dropbox locator.
- The portal BFF authenticates every upload, resolution, and byte-range read.
- Web and portal-bound desktop projects use the same `assetId` and
  `assetVersionId`; local-only desktop projects retain local Electron storage.

## Dropbox Layout

The dedicated `Everville Nomi Storage` scoped app has only account identity and
file metadata/content read-write scopes. Offline OAuth supplies a refresh token.
All API calls are rooted to the Everville Team Space namespace with
`Dropbox-API-Path-Root`.

```text
/Content/NOMI/projects/{project-id}/generated/images/{asset-id}.{ext}
/Content/NOMI/projects/{project-id}/generated/videos/{asset-id}.{ext}
/Content/NOMI/projects/{project-id}/generated/audio/{asset-id}.{ext}
```

The implementation never creates public or shared Dropbox links. Existing
conflicts are adopted only when byte size and Dropbox content hash match.

## Supabase Registry

Migration `supabase/migrations/20260721070857_dropbox_asset_storage.sql`
creates:

- `app.assets`
- `app.asset_versions`
- `app.asset_ingestions`
- `app_private.asset_storage_objects`

Authenticated users receive only membership-scoped RPCs. They have no direct
table access and never receive Dropbox paths, file IDs, revisions, refresh
tokens, or provider URLs. Service-role RPCs register and resolve private
locators after the BFF has authorized the caller.

Provider output identity is deterministic across retries. A transaction-level
advisory lock serializes concurrent web, desktop, and recovery attempts for the
same idempotency key.

## Runtime Flow

1. A provider task succeeds with a temporary URL or immediate byte result.
2. The BFF verifies the portal bearer/cookie session and `project.write` scope.
3. It fetches only public HTTPS sources after DNS and redirect SSRF checks, or
   accepts a bounded authenticated binary upload.
4. It streams bytes to Dropbox, calculates SHA-256 and Dropbox content hashes,
   and records immutable metadata/provenance in Supabase.
5. The project snapshot stores only stable opaque IDs and
   `/api/portal/assets/content` URLs.
6. Display/download requests reauthorize `project.read`, resolve the private
   locator with the service role, and stream Dropbox bytes with Range support.
7. Provider inputs obtain a short-lived Dropbox temporary link server-side;
   that link is never persisted.

## Required Production Environment

Set these only in the Vercel server runtime. Values must not be placed in Git,
client bundles, project snapshots, logs, or desktop preferences.

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
DROPBOX_APP_KEY
DROPBOX_APP_SECRET
DROPBOX_REFRESH_TOKEN
DROPBOX_ROOT_NAMESPACE_ID
DROPBOX_STORAGE_ROOT=/Content/NOMI
```

The desktop app calls the same authenticated portal BFF for portal-bound
projects. It does not receive or store Dropbox credentials.

## Recovery And Rotation

- Repeating a successful task poll is safe: the same provider output resolves
  to the same asset/version and matching Dropbox object.
- A content mismatch is a hard integrity error and is never silently replaced.
- Dropbox 401 refreshes the access token once; 429 and transient 5xx responses
  use bounded retry/backoff.
- Rotate the Dropbox app secret or refresh token by updating Vercel sensitive
  environment variables and redeploying. Existing objects and Supabase rows do
  not change.
- If Dropbox is temporarily unavailable, the provider task remains recoverable
  and may be polled again; the temporary provider URL is not promoted to a
  durable project snapshot.
- Database rollback removes the new RPCs/tables only after confirming no live
  snapshots reference `ast_*`/`av_*` IDs. Dropbox bytes should be retained until
  a separate provenance-backed cleanup is approved.

## Verification

Release verification includes:

```bash
pnpm vitest run src/platform/dropboxAssetStorage.test.ts
pnpm vitest run src/platform/supabaseRlsMigration.test.ts
pnpm vitest run src/platform/portalApiHandler.test.ts
pnpm vitest run src/platform/webPortalClient.test.ts
pnpm vitest run src/workbench/project/portalProjectSync.test.ts
pnpm run gates
```

Production smoke must additionally prove that an authenticated shared project
can save, list, Range-read, and reopen the same asset from web and desktop, and
that an unauthenticated request receives no media bytes. With the target
Supabase project linked and its server-only test credentials supplied in the
shell, run:

```bash
pnpm run smoke:portal-storage
```

The smoke creates and removes an isolated Supabase user/project fixture. Its
JSON result includes the exact `dropboxCleanupPath`; remove that isolated
Dropbox fixture after verification or retain it only as approved test evidence.
Never place the smoke credentials in tracked files or client-visible Vite
variables.
