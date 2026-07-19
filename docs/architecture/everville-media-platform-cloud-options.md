# Everville Media Platform Cloud Options

Status: Architecture unapproved

Recommendation status: **PROPOSED**

Date: 2026-07-17

Beads parent: `evmedia-r20.4`

Babysitter effect: `01KXPTH8RXPJD6CHPFGCJ11502`

## Decision boundary

This document compares cloud topologies for the Everville Media Platform Alpha.
It does not approve a platform, region, migration, private delivery target,
Higgsfield cloud credential, direct-publishing scope, or CI/CD design. The
recommendation is a proposal for the architecture breakpoint.

The comparison preserves these repository and product constraints:

- Electron remains a supported client and execution environment.
- `PlatformClient` contracts separate product workflows from local and cloud
  implementations.
- `nomi-local://` remains a desktop runtime URL, never a persisted cloud asset
  identity.
- Provider and model IDs remain stable; localization changes display values
  only.
- Renderer and browser bundles never receive service-role, storage-signing, or
  provider credentials.
- `everville-core` remains the reviewed knowledge source. Dropbox and Atlas
  outputs are evidence, not automatic canonical writes.
- Beads is task truth and Babysitter journals are execution state. Neither is
  product workflow or audit state.
- Everville-specific backend, authorization, knowledge, and brand-policy work
  must not be pushed to the current public `origin`.

## Normalized Alpha assumptions

All options are compared against the same workload rather than their easiest
demo path:

- One real-estate pilot, one primary organization, and a small invited team.
- Organization, brand, campaign, role, classification, approval, and asset
  isolation are default-deny.
- PostgreSQL is authoritative for workflow metadata and audit history.
- Object storage owns cloud media bytes. PostgreSQL stores stable asset IDs,
  object keys, hashes, provenance, and versions.
- Realtime transports hints and presence; committed Postgres records remain
  authoritative.
- Generation and export jobs are durable, idempotent, retryable, observable,
  and never become approved or published merely because execution succeeded.
- Media upload and download use short-lived signed access after authorization.
- FFmpeg runs in a container or Electron, not in an edge function.
- Initial data plane is APAC. Singapore is the proposed common region because
  Supabase, Vercel, and Google Cloud all document Singapore service regions
  ([SRC-SUPA-REGION], [SRC-VERCEL-REGION], [SRC-GCP-RUN]).

## Options

### Option A: Vercel + Supabase + narrow managed media worker

The web portal and BFF deploy to Vercel. Supabase provides Auth, PostgreSQL,
Storage, Realtime, and a Postgres-backed queue. A narrowly scoped OCI worker on
Google Cloud Run Jobs handles FFmpeg and other long-running, binary-heavy work.
The existing Electron backend remains a `PlatformClient` implementation and is
the Alpha Higgsfield executor.

This is intentionally not a claim that pure Vercel + Supabase can run every
workload. Vercel Functions have finite duration, memory, payload, and bundle
limits, while hosted Supabase Edge Functions have a 256 MB memory limit, a 400
second paid-plan wall-clock limit, and 2 seconds of CPU time per request
([SRC-VERCEL-FN], [SRC-SUPA-FN]). Those constraints make either runtime a poor
home for general FFmpeg jobs. Cloud Run Jobs supports container tasks up to
seven days and explicitly supports video-processing workloads
([SRC-GCP-RUN], [SRC-GCP-GPU]).

### Option B: self-hosted TypeScript platform

Everville operates TypeScript API/realtime services, PostgreSQL, S3-compatible
object storage, a durable queue, and containerized workers on its own compute.
An OIDC provider authenticates users; API authorization and PostgreSQL RLS
enforce tenant and classification boundaries. FFmpeg and Higgsfield adapters
run in controlled worker pools.

This option offers the most runtime freedom and the least platform coupling,
but Everville owns patching, high availability, capacity, backups, restore
drills, queue recovery, certificate and key rotation, observability, incident
response, and on-call coverage. It is credible when operations ownership is a
deliberate capability, not when a single VM is treated as a production stack.

### Option C: Google Cloud managed suite

The full platform uses Cloud Run services and Jobs, Identity Platform, Cloud
SQL for PostgreSQL, Cloud Storage, Cloud Tasks or Pub/Sub, Secret Manager, and
Cloud Operations. Product roles remain application data; Cloud IAM authorizes
service-to-service access. Cloud SQL and Cloud Storage are available in
Singapore and Jakarta, while Cloud Run and GPU Jobs are available in Singapore
([SRC-GCP-SQL-REGION], [SRC-GCP-RUN], [SRC-GCP-GPU]).

This is the strongest single-cloud operational topology for media workers, but
it requires more platform engineering than Option A. Identity Platform tenant
silos do not replace application membership, role, classification, approval,
or PostgreSQL RLS rules ([SRC-GCP-ID]). Realtime collaboration needs either a
Cloud Run WebSocket service plus shared state, or a second realtime store.
Cloud Run supports WebSockets, but connections must reconnect at the service
timeout and multi-instance synchronization remains the application's job
([SRC-GCP-WS]).

## Normalized comparison

Scores are 1 (poor) through 5 (strong) for the stated Alpha assumptions. They
are decision aids, not approval.

| Criterion | Weight | A: Vercel + Supabase | B: Self-hosted | C: Google Cloud | Reason |
| --- | ---: | ---: | ---: | ---: | --- |
| Alpha delivery speed | 18 | 5 | 2 | 3 | A supplies integrated auth, RLS, storage, and realtime; B builds and operates them; C assembles more services. |
| Auth and tenant enforcement | 12 | 4 | 3 | 4 | A has direct Auth-to-RLS integration; B and C need more application glue and policy discipline. |
| Realtime collaboration | 10 | 4 | 3 | 3 | Supabase Broadcast/Presence is ready-made; B must operate it; C needs a WebSocket/shared-state design. |
| Queue and media workers | 12 | 4 | 5 | 5 | A needs the explicit worker addition; B and C naturally support containers and FFmpeg. |
| Operational burden | 12 | 4 | 1 | 3 | A has the smallest platform surface; B has the largest; C is managed but broad. |
| Portability and exit | 10 | 4 | 5 | 3 | Standard Postgres, object keys, and OCI workers help A; B controls all primitives; C has more IAM/service coupling. |
| Backup and restore | 8 | 3 | 4 | 5 | A needs separate database and object procedures; B can be strong only with disciplined operations; C has mature managed controls. |
| Observability | 6 | 3 | 4 | 5 | A spans vendors and needs trace export; B can standardize but must operate it; C has one integrated suite. |
| APAC region fit | 5 | 4 | 5 | 5 | A converges on Singapore; B can be placed freely; C offers Singapore and some Jakarta services. |
| Electron and upstream continuity | 7 | 5 | 5 | 5 | All pass only through runtime-neutral contracts and private product implementations. |
| **Weighted result / 500** | **100** | **411** | **340** | **388** | A ranks first for Alpha speed; C is the strongest managed consolidation path; B is an exit destination, not the Alpha default. |

## Capability evaluation

| Area | A: Vercel + Supabase | B: Self-hosted TypeScript | C: Google Cloud managed |
| --- | --- | --- | --- |
| Auth | Supabase Auth JWT/PKCE, MFA, and optional SSO. Electron and browser use public client credentials only. | OIDC client plus owned session policy, recovery, MFA, and identity operations. | Identity Platform with optional tenant silos, MFA/federation; application roles stay in Postgres. |
| Authorization and RLS | RLS on every exposed table and Storage object row. `service_role` is worker-only and never reaches a client. | API authorization plus PostgreSQL RLS; highest policy flexibility and highest test burden. | API authorization plus PostgreSQL RLS using verified identity context; Cloud IAM protects services, not product approvals. |
| PostgreSQL | Dedicated managed Postgres with SQL access and portable logical dumps. Auth and platform schemas add migration work. | Maximum extension/version control; Everville owns HA, pooling, WAL, upgrades, and PITR. | Managed Cloud SQL with HA, backups, PITR, replicas, and regional placement; higher baseline cost. |
| Object storage | Private Supabase Storage, RLS, S3/REST/TUS access, and signed URLs. Database backups do not restore object bytes. | S3-compatible private buckets, signed URLs, lifecycle, versioning, and replication selected and operated by Everville. | Cloud Storage signed URLs, object versioning, soft delete, lifecycle, and regional/multi-regional placement. |
| Realtime and collaboration | Private Broadcast for committed-change notifications and cursors; Presence for low-rate presence only. Conflict policy is still required. | Owned WebSocket/CRDT service and shared state. Most control, most implementation and operations. | Cloud Run WebSockets with reconnect and shared-state design, or a second managed realtime store with explicit dual-store rules. |
| Queue and workers | Supabase Queues/PGMQ is the durable request queue. A dispatcher starts idempotent Cloud Run Jobs. Vercel Queues remains Beta and is not the product job ledger. | Durable queue plus owned worker pools, leases, retries, dead-letter handling, and autoscaling. | Cloud Tasks for directed delivery/rate control and Cloud Run services/Jobs for execution; Pub/Sub where fan-out is required. |
| Signed media | BFF authorizes and returns short-lived Supabase signed upload/download URLs. Persist asset ID, bucket/key, hash, and version, never the URL. | Signing service uses S3-compatible credentials held only by API/worker. | Signing service uses a least-privilege service account; possession of a signed URL grants access until expiry. |
| FFmpeg | Cloud Run Job for cloud export; current Electron FFmpeg remains available and can produce the same artifact contract. | Native container worker with CPU/GPU tuning and no serverless bundle limit. | First-class Cloud Run Job workload; GPU is available if a measured workflow requires it. |
| Higgsfield | Existing Electron CLI path is preserved. Cloud execution is blocked pending approved machine/service auth. | Technically easy to run CLI, but credential approval and custody remain the same blocker. | Secret Manager and isolated Jobs are suitable only after vendor-supported non-personal auth is approved. |
| Regions | Proposed `sin1` Vercel + Singapore Supabase + `asia-southeast1` worker. Cross-vendor egress and outage boundaries remain. | Any selected host; resilience is entirely the operator's design. | Singapore for the complete stack; Jakarta may host Cloud SQL/Storage where supported, but service co-location must be verified. |
| Cost shape | Lowest managed Alpha floor, then usage and media egress. Cross-cloud worker traffic must be measured. | Infrastructure may look inexpensive at low load, but HA, backups, observability, and engineering/on-call dominate total cost. | Cloud SQL creates an always-on floor; Cloud Run Jobs scale with work; storage, logs, and egress remain variable. |
| Lock-in | Moderate: Supabase Auth/RLS/Realtime/Storage APIs and Vercel deployment features. Postgres and OCI worker reduce exit cost. | Low product lock-in, high operational commitment. | Moderate-high: Identity Platform, Cloud Tasks, IAM, logging, and deployment configuration are GCP-specific. |
| Backup/restore | Managed DB backups plus independent logical dumps and object replication/manifests. Restore is a coordinated DB + objects + auth exercise. | Everville owns WAL/PITR, object replication, secret escrow, and tested runbooks. | Managed DB backups/PITR plus Storage versioning/soft delete and cross-project backup policy. |
| Observability | OpenTelemetry correlation across Vercel, Supabase, worker, and Electron; drain logs to a retained system. | OpenTelemetry/log/metric stack selected and operated by Everville. | Cloud Trace/Logging/Monitoring for services and workers, with Electron telemetry exported through the same correlation model. |
| Migration/rollback | Best incremental path because cloud services can sit behind `PlatformClient` while Electron remains authoritative per phase. | Most flexible target, but platform construction precedes migration. | Strong staged deployments and data tools, but more adapters must be ready before pilot use. |
| Electron compatibility | Same domain contracts; local project, `nomi-local://`, safeStorage, CLI, browser capture, and FFmpeg paths remain valid. | Same, if self-host APIs do not leak into renderer domain contracts. | Same, if Google SDK and IAM types remain behind cloud adapters. |
| Upstream pullability | Strong when the generic contract is isolated and Everville implementations live on the private delivery surface. | Same contract rule; larger private backend codebase to maintain. | Same contract rule; generated cloud clients and IAM config must stay out of generic upstream commits. |

## Proposed Alpha topology

**CO-01 - PROPOSED, not approved:** adopt Option A with the following explicit
boundaries.

1. Vercel hosts the portal UI, SSR, and thin BFF in `sin1`, close to the
   Singapore data plane. It performs authentication checks, request validation,
   authorization prechecks, and signed-media mediation. It does not run FFmpeg
   or retain provider credentials.
2. Supabase Singapore is authoritative for product metadata, memberships,
   roles, classifications, workflow state, provenance, approvals, publications,
   and the product audit log. RLS is enabled and tested for every exposed table.
3. Supabase Storage holds cloud asset bytes in private buckets. A stable UUID is
   the asset identity; object location, checksum, generation, and provenance are
   mutable/versioned attributes.
4. Supabase Realtime sends private authorized hints for changed durable records
   and ephemeral collaboration events. It never adjudicates conflicts or
   approval state.
5. Supabase Queues holds durable job requests. A small dispatcher starts a
   pinned OCI image as a Cloud Run Job in `asia-southeast1`. The job locks the
   database row by job ID, is idempotent, records attempts and costs, writes the
   resulting asset version, and acknowledges only after durable terminal state.
6. Electron implements the same `PlatformClient` contracts for local projects,
   registered workspaces, local media, browser capture, provider credentials,
   Higgsfield, and FFmpeg. Sync/import is a separate adapter, not a renderer
   rewrite.
7. Higgsfield generation stays on the authenticated Electron CLI path for
   Alpha. A campaign job may record `executor = electron`, but no personal OAuth
   credential is copied into Vercel, Supabase, or Cloud Run.
8. The private Everville remote and CI/CD target must be selected before any
   implementation is pushed. The current public `origin` is not a delivery
   target.

### Job dispatch reliability

The API transaction writes the domain job and queue/outbox record together.
Dispatch is at-least-once. Worker acquisition uses a job ID, lease, attempt
number, and idempotency key. A sweeper re-dispatches expired leases. Success
requires a persisted asset version and provenance record. Failure cannot create
an approval or publication. Queue delivery order is never used as workflow
truth.

Supabase PGMQ provides visibility-timeout consumption and retains messages
until they are deleted or archived ([SRC-SUPA-QUEUE]). If the architecture
breakpoint chooses Vercel Queues instead, it must accept that the service is
currently Beta, has at-least-once approximate ordering, a maximum 24-hour
retention, and no built-in dead-letter queue ([SRC-VERCEL-QUEUE]). That is not
the proposed Alpha default.

### Auth and tenant policy

- Every business row carries `organization_id`; brand/campaign scope narrows
  access but never widens organization access.
- Membership and role checks are database-enforced. Authentication is not
  authorization.
- Standards Owner, Producer, Creator, and conditional approver capabilities are
  explicit operations, not broad CRUD roles.
- Restricted and Investor records require classification-aware policies and
  server-side approval gates.
- Publishing and signing a media URL are privileged server operations.
- Worker access uses least-privilege service credentials and explicit tenant
  context. No worker uses a browser JWT as its ambient identity.
- RLS bypass credentials never enter Electron renderer, browser code, logs,
  analytics, Beads, Babysitter prompts, or version control.

Supabase requires RLS on exposed schemas and warns that service keys can bypass
RLS and must never be exposed to customers ([SRC-SUPA-RLS]). MFA assurance is
available in JWT claims, but sensitive-action policy still has to enforce it
([SRC-SUPA-MFA]).

### Realtime and conflict semantics

Supabase documents Broadcast as the recommended scalable database-change path;
Presence is intended for slowly changing state and not high-frequency cursor
updates ([SRC-SUPA-REALTIME], [SRC-SUPA-PRESENCE]). The Alpha should use:

- durable optimistic concurrency (`version`/ETag) for briefs, storyboards,
  reviews, and approvals;
- append-only records for reviews, approvals, and publication events;
- Broadcast for invalidation and collaboration events;
- Presence only for online/active-document state;
- an explicit owner breakpoint before choosing CRDT or last-writer behavior for
  simultaneous storyboard/canvas editing.

## Higgsfield 1.1.13 inventory and custody

### Installed evidence

Local binary: `/opt/homebrew/bin/higgsfield`

Build: `higgsfield 1.1.13`
(`11bfed2733870848f3489335c1bf3d91961ccd4a`, built
`2026-07-11T00:09:17Z`).

The inventory below was taken from the installed binary's command help on
2026-07-17. The official CLI repository says automation should use the CLI
rather than direct undocumented HTTP calls because the CLI handles auth,
validation, uploads, retries, and polling ([SRC-HF-CLI]).

| Surface | Installed command capability |
| --- | --- |
| Authentication | `auth login`, `auth logout`, `auth token` |
| Account and billing | `account status`, `account transactions`; `workspace list`, `set`, `status`, `unset` |
| Catalog | `model list/get` for image, video, text, and audio models; `workflow list/get`; `voices list/get` |
| Media input | `upload create/list` for image, video, and audio; generation media flags accept upload IDs, prior job IDs, or auto-uploaded local paths |
| Generation | `generate create`, `cost`, `get`, `list`, `wait`, and `workflow`; image, video, audio, text, and 3D jobs; parameter schemas come from model/workflow inspection |
| Soul | `soul-id create/get/list/wait`, including Soul 2.0 and Soul Cinematic training from repeated images |
| Marketing Studio | `ad-formats list`; `ad-references create/get/list`; `avatars create/list`; `brand-kits fetch/get/list`; `dtc-ads generate`; `hooks list`; `products create/fetch/list`; `settings list`; `webproducts create/fetch/list` |
| Product pipelines | `product-photoshoot create` with mode, prompt enhancement, variants, brand/product context, and enhance-only mode; `marketplace-cards create` for main, secondary product, A+ modules, or full sets |
| Website platform | `website contest/create/deploy/list/publish/rename/repo-access/status`; read-only database `query/rows/schema/tables`; secret `set/list/delete` |
| Game platform | `game deploy` and `game publish` |
| Automation | Global `--json` machine output and `--no-color`; generation wait timeout/interval controls; `version` build information |

This is broader than the current Nomi integration, which exposes status,
install, OAuth login, catalog sync, model/workflow generation, polling, and
result normalization through Electron IPC. Installation is evidence of current
desktop capability, not approval to expose all commands in a shared portal.

### Alpha exposure policy

- **PROPOSED enabled:** typed catalog/workflow reads, upload, cost estimate,
  create/get/list/wait, generation results, and the currently supported Nomi
  model/workflow execution path.
- **PROPOSED product-gated:** Soul, Marketing Studio, product photoshoot,
  marketplace cards, and voices only after the relevant product workflow,
  budget, provenance, and approval rules exist.
- **DEFERRED:** website and game deployment/publishing. They are unrelated to
  the first media pilot and include high-impact publishing, repository, database,
  and secret operations.
- **PROHIBITED from product automation:** `auth token`, arbitrary command
  pass-through, `website repo-access`, and website secret read/write unless a
  later security review and explicit owner approval creates a typed operation.

Each enabled capability must be a typed adapter method. The platform must not
offer a generic endpoint that concatenates CLI arguments or returns raw tokens.

### Secret custody

The official Higgsfield integration guidance identifies the local credential
file as `~/.config/higgsfield/credentials.json` and warns against bypassing the
CLI ([SRC-HF-CUSTODY]). Therefore:

- Electron keeps the current OAuth 2.0 PKCE credential local and outside the
  renderer. The credential file is not synchronized as a project asset.
- The platform never invokes or logs `higgsfield auth token`.
- A personal token is not copied into a cloud secret manager or container image.
- Cloud Higgsfield execution is a **BREAKPOINT** until Higgsfield documents and
  Everville approves a non-personal machine/service credential and account or
  workspace ownership model.
- If approved later, the credential is injected only into an isolated worker,
  rotated independently, redacted from logs, scoped to an Everville billing
  workspace, and verified against the full command inventory before cutover.
- Direct private API calls are not assumed. A cloud adapter uses a pinned,
  checksum-verified CLI release and `--json`, unless Higgsfield publishes and
  approves a stable API/SDK contract with equivalent behavior.

## Cost model

Prices and service limits are volatile; these figures were checked against
primary vendor pages on 2026-07-17 and must be refreshed at approval.

| Option | Fixed floor | Variable drivers | Alpha cost risk |
| --- | --- | --- | --- |
| A | Vercel Pro lists $20/month per developer with $20 usage credit. Supabase Pro starts at $25/month and includes one Micro compute credit, 100 GB file storage, and seven-day daily backup retention ([SRC-VERCEL-PRICE], [SRC-SUPA-PRICE]). Cloud Run has no fixed worker floor when Jobs run on demand. | Media egress, uncached transfer, storage growth, realtime volume, function CPU/memory, logs, and FFmpeg duration. Supabase PITR currently starts at $100/month for seven days and does not protect Storage bytes. | Cross-vendor egress and fragmented observability can exceed the subscription floor. Instrument bytes and job seconds before pilot launch. |
| B | At least redundant compute, database, object storage, queue, backup target, monitoring, and secret service; exact provider is unapproved. | Capacity, replicas, egress, backup retention, upgrades, incidents, and engineering/on-call time. | A cheap single-node estimate is not comparable to managed production controls. Labor and recovery readiness are the dominant unknowns. |
| C | Cloud SQL is billed continuously for CPU, memory, storage, and HA; Cloud Run/Tasks/Storage/Identity add usage charges ([SRC-GCP-SQL-PRICE], [SRC-GCP-RUN-PRICE]). | Job CPU/GPU time, object storage and egress, logging, database sizing/HA, queue operations, and auth MAU. | More line items and platform expertise, but strong cost attribution and one-cloud network locality. |

Every generation job records expected provider cost before execution, actual
provider cost after execution, worker duration/resources, transfer bytes, and
the accountable campaign budget owner. Provider cost and infrastructure cost
remain separate fields.

## Backup, restore, and rollback

### Option A minimum controls

- Daily managed Supabase database backups plus independent encrypted logical
  dumps to a separate account/provider.
- PITR is a launch breakpoint based on recovery-point objective, not a default
  hidden in the subscription estimate.
- Versioned object manifest containing asset ID, object key, size, checksum,
  provenance ID, and storage generation.
- Object replication or scheduled verified export to a separate bucket/account.
- Quarterly restore into a disposable project, including auth mapping, RLS,
  queue cleanup, object reconciliation, and signed-media smoke tests.
- Vercel deployment rollback is independent of database rollback. Vercel can
  point traffic to a prior deployment, but external database/API state is not
  reverted with it ([SRC-VERCEL-ROLLBACK]).

Supabase states that database backups exclude Storage object bytes and that a
database restore makes the project unavailable during restoration
([SRC-SUPA-BACKUP]). A database-only backup is therefore not an Everville asset
recovery plan.

### Migration and rollback phases

| Phase | Authority and change | Entry/exit evidence | Rollback |
| --- | --- | --- | --- |
| 0. Contracts | Local Electron remains sole authority; add runtime-neutral identities and adapter contracts. | Contract tests map every current capability and preserve installed Electron behavior. | Remove unused cloud adapter; no data moved. |
| 1. Identity/tenancy | Create organizations, memberships, roles, and RLS with test tenants only. | Cross-tenant and role/classification denial suite passes. | Disable cloud login; local projects untouched. |
| 2. Shadow metadata import | Import versioned project snapshots to cloud as non-authoritative shadow records. | Per-project schema version, row counts, hashes, and provenance reconcile. | Delete shadow import by batch ID; local workspace remains authority. |
| 3. Shadow assets | Upload bytes under stable asset IDs and reconcile checksums; desktop continues to resolve local bytes. | 100% manifest/hash match and signed access denial tests. | Remove imported objects/metadata by batch; retain local originals. |
| 4. Pilot cloud authority | Explicitly select one pilot campaign as cloud-authoritative; Electron becomes a synchronized client/cache for that campaign. | Paper trace, online/offline Electron journey, conflict tests, approvals, export, audit reconstruction, backup, and restore drill pass. | Freeze cloud writes, export latest versioned snapshot/assets, validate locally, and switch the pilot authority marker back only with owner approval. |
| 5. Cloud media workers | Enable FFmpeg worker per deliverable type; Higgsfield remains local until its credential breakpoint passes. | Golden-file export checks, cost/timeout/failure tests, worker rollback, and Electron parity evidence. | Disable queue dispatch and use the proven Electron executor; queued jobs remain durable and visible. |

No phase rewrites native projects in place. Every import is versioned,
repeatable, attributable to a batch, and validated before authority changes.

## Observability and audit

Every request and job carries `correlation_id`, `organization_id`, `campaign_id`,
`job_id`, `asset_id`, `version_id`, executor, deployment version, and provider
request ID where available. Sensitive prompts and credentials are redacted by
classification policy.

Required signals include:

- auth success/failure, RLS/authorization denial, and sensitive-action MFA;
- queue age, dispatch attempts, lease expiry, retries, poison jobs, and terminal
  outcome;
- provider latency/status/cost and redacted error code;
- FFmpeg command plan hash, worker image digest, resource time, and result hash;
- asset upload/download/signing, version creation, and provenance completion;
- review, approval, publication, migration, restore, and rollback events;
- Electron sync status, local/cloud authority, and conflict evidence.

Product audit records live in the product database with an explicit retention
and access policy. They do not depend on vendor runtime-log retention. Vercel
Pro runtime logs currently retain one day unless Observability Plus is used;
the Alpha therefore needs an OpenTelemetry/log drain destination before relying
on those logs for incident reconstruction ([SRC-VERCEL-LOGS]).

## Exit strategy

Option A is acceptable only with an exercised exit path:

1. Keep domain schema in versioned SQL migrations and avoid business logic that
   exists only in dashboard configuration.
2. Export PostgreSQL roles/schema/data with tested tooling. Supabase documents a
   managed-to-self-hosted path, but auth tokens must be reissued and Storage
   objects move separately ([SRC-SUPA-EXIT]).
3. Keep app-owned user, organization, membership, role, and external identity
   mapping tables so a replacement IdP does not redefine product authority.
4. Keep asset identity independent of bucket, provider URL, CDN URL, and
   `nomi-local://`; maintain checksum manifests and a bulk object export tool.
5. Treat Realtime as replaceable transport. No canonical fact exists only in a
   channel, presence payload, or vendor message.
6. Use a queue abstraction around job ID, lease, attempt, idempotency, and
   outcome. Queue-specific delivery metadata is diagnostic only.
7. Package media workers as OCI images with configuration and secrets injected
   at runtime. The same image must run on Cloud Run, a self-hosted container
   host, or a replacement managed platform.
8. Keep Vercel-specific routing/deployment configuration at the application
   edge; the portal and BFF must build and smoke-test in a generic Node/container
   environment.
9. Run quarterly logical DB restore plus object reconciliation and an annual
   provider-exit rehearsal for the pilot dataset.

Exit triggers include unacceptable egress or observability cost, inability to
meet recovery objectives, region/compliance mismatch, prolonged queue/runtime
limitations, vendor feature withdrawal, or inability to preserve Electron and
upstream compatibility.

The planned exit destination is Option B or an equivalent managed Postgres +
S3-compatible storage + OCI worker platform. This is not approval to build the
self-hosted stack now.

## Upstream and delivery rules

- Define generic `PlatformClient` contracts and local Electron implementations
  without Everville organization names, policies, or credentials.
- Keep Everville tenancy, RLS, workflow, knowledge, deployment, and provider
  custody implementations on a future private remote and in private commits or
  packages.
- Never push this product branch to the current public `origin`.
- Pull upstream into a dedicated integration branch, resolve generic contract
  changes there, run local/cloud contract tests, then promote deliberately.
- Do not fork upstream provider IDs or persisted project schema merely to match
  a cloud SDK. Use adapters and versioned migrations.
- Configure private remote and CI/CD only after their separate decisions are
  approved.

## Decision register

| ID | Status | Owner | Date | Decision or breakpoint | Alternatives | Rationale and approval evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CO-01 | **PROPOSED** | Nikolay Asta | 2026-07-17 | Use Option A for Alpha: Vercel + Supabase + narrow Cloud Run media worker. | Option B self-hosted; Option C Google Cloud managed. | Fastest path that preserves Postgres/OCI exits and Electron continuity. Approval requires an explicit architecture breakpoint and cost envelope. |
| CO-02 | **PROPOSED** | Architecture owner | 2026-07-17 | Use Singapore for Vercel, Supabase, and Cloud Run Alpha data plane. | Another common APAC region; split regions. | All proposed services document Singapore availability ([SRC-SUPA-REGION], [SRC-VERCEL-REGION], [SRC-GCP-RUN]). Approval requires data-residency, latency, availability, and egress review. |
| CO-03 | **BREAKPOINT** | Security owner + provider owner | 2026-07-17 | Select Higgsfield cloud authentication/execution model. Keep Electron local until then. | Electron-only; approved cloud CLI worker; future official API/SDK. | Current official guidance documents user OAuth and CLI-mediated behavior ([SRC-HF-CUSTODY]). Approval requires non-personal credentials, workspace ownership, rotation, redaction, and full capability parity evidence. |
| CO-04 | **PROPOSED** | Architecture owner | 2026-07-17 | Use Supabase Queues plus idempotent dispatcher and Cloud Run Jobs for FFmpeg. | Vercel Queues; Cloud Tasks; self-hosted queue/workers; Electron-only export. | Avoids hosted-function media limits while retaining a portable OCI worker. Approval requires a spike proving dispatch recovery, leases, retries, cancellation, cost, and golden-file parity ([SRC-SUPA-QUEUE], [SRC-GCP-RUN]). |
| CO-05 | **BREAKPOINT** | Product owner + architecture owner | 2026-07-17 | Choose simultaneous storyboard/canvas conflict semantics. | Optimistic lock/retry; field merge; CRDT. | Realtime transport does not define durable conflict authority. Approval requires pilot edit scenarios and a selected merge/rejection rule. |
| CO-06 | **PROPOSED** | Security/operations owner | 2026-07-17 | Independent logical DB backup, object replication/manifests, and quarterly restore drill. | Managed backups only; cross-project copy; cross-provider backup. | Supabase database backups exclude Storage bytes ([SRC-SUPA-BACKUP]). Approval requires named RPO/RTO, retention, funding, and passing restore evidence. |
| CO-07 | **DEFERRED** | Repository owner | 2026-07-17 | Configure private Everville git remote. | New private repository; approved private monorepo destination. | Delivery ownership is unresolved. No Everville product work may be pushed to public `origin`. |
| CO-08 | **DEFERRED** | Delivery owner | 2026-07-17 | Configure CI/CD and production environments. | Vercel Git integration; independent CI deploy; another approved target. | Depends on CO-01 and CO-07 plus environment and secret-policy review. |
| CO-09 | **BREAKPOINT** | Product owner | 2026-07-17 | Select pilot campaign, approvers, channels, Brand Kits/templates, and legal-review classes. | The candidate real-estate campaigns and channel sets remain unselected. | Product workflow open questions must be answered in the authoritative decision record before pilot launch. |

Until CO-01 is explicitly approved, downstream implementation may refine
contracts, tests, migration fixtures, and cost measurements, but it must not
represent Option A as selected architecture or move authoritative project data.

## Primary sources

Sources were checked on 2026-07-17. Limits, regions, prices, Beta status, and
retention are changing claims and must be rechecked at the architecture
breakpoint.

- [SRC-SUPA-RLS]: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SRC-SUPA-MFA]: [Supabase Multi-Factor Authentication](https://supabase.com/docs/guides/auth/auth-mfa)
- [SRC-SUPA-REGION]: [Supabase available regions](https://supabase.com/docs/guides/platform/regions)
- [SRC-SUPA-REALTIME]: [Supabase subscribing to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
- [SRC-SUPA-PRESENCE]: [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence)
- [SRC-SUPA-STORAGE]: [Supabase Storage](https://supabase.com/docs/guides/storage)
- [SRC-SUPA-SIGNED]: [Supabase serving assets and signed URLs](https://supabase.com/docs/guides/storage/serving/downloads)
- [SRC-SUPA-QUEUE]: [Supabase PGMQ Queues](https://supabase.com/docs/guides/queues/pgmq)
- [SRC-SUPA-FN]: [Supabase Edge Function limits](https://supabase.com/docs/guides/functions/limits)
- [SRC-SUPA-BACKUP]: [Supabase database backups and PITR](https://supabase.com/docs/guides/platform/backups)
- [SRC-SUPA-PRICE]: [Supabase pricing](https://supabase.com/pricing)
- [SRC-SUPA-EXIT]: [Restore a Supabase Platform project to self-hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- [SRC-VERCEL-FN]: [Vercel Functions limits](https://vercel.com/docs/functions/limitations)
- [SRC-VERCEL-REGION]: [Vercel global network and regions](https://vercel.com/docs/regions)
- [SRC-VERCEL-QUEUE]: [Vercel Queues](https://vercel.com/docs/queues)
- [SRC-VERCEL-LOGS]: [Vercel runtime logs and retention](https://vercel.com/docs/logs/runtime)
- [SRC-VERCEL-ROLLBACK]: [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)
- [SRC-VERCEL-PRICE]: [Vercel pricing](https://vercel.com/pricing)
- [SRC-GCP-RUN]: [Google Cloud Run Jobs](https://cloud.google.com/run/docs/create-jobs)
- [SRC-GCP-GPU]: [Google Cloud Run Job GPUs](https://cloud.google.com/run/docs/configuring/jobs/gpu)
- [SRC-GCP-WS]: [Google Cloud Run WebSockets](https://cloud.google.com/run/docs/triggering/websockets)
- [SRC-GCP-ID]: [Google Identity Platform multi-tenancy](https://cloud.google.com/identity-platform/docs/multi-tenancy)
- [SRC-GCP-TASKS]: [Google Cloud Tasks queues](https://cloud.google.com/tasks/docs/creating-queues)
- [SRC-GCP-SIGNED]: [Google Cloud Storage signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls)
- [SRC-GCP-OBJECTS]: [Google Cloud Storage object versioning](https://cloud.google.com/storage/docs/object-versioning)
- [SRC-GCP-SQL-BACKUP]: [Cloud SQL backups](https://cloud.google.com/sql/docs/postgres/backup-recovery/backups)
- [SRC-GCP-SQL-REGION]: [Cloud SQL PostgreSQL regions](https://cloud.google.com/sql/docs/postgres/region-availability-overview)
- [SRC-GCP-RUN-PRICE]: [Google Cloud Run pricing](https://cloud.google.com/run/pricing)
- [SRC-GCP-SQL-PRICE]: [Cloud SQL pricing](https://cloud.google.com/sql/pricing)
- [SRC-HF-CLI]: [Official Higgsfield CLI repository](https://github.com/higgsfield-ai/cli)
- [SRC-HF-CUSTODY]: [Official Higgsfield skills API conventions](https://github.com/higgsfield-ai/skills/blob/main/CLAUDE.md)
