# Everville Media Platform Alpha Architecture Decision Brief

Status: **OWNER REVIEW REQUIRED**

Recommendation status: **PROPOSED**

Approved architecture decisions: **none**

Date: 2026-07-17

Beads parent: `evmedia-r20.4`

Babysitter effect: `01KXPVFQEHSTEJG2ZCM74RKQW2`

## Purpose

This brief compares the frozen 24-row RFC acceptance contract with the current
Nomi runtime audit, cloud options, and security/data design. It recommends the
smallest architecture that can deliver the full Everville Media Platform Alpha
without replacing the Nomi workbench or claiming browser parity that does not
exist.

This is a decision artifact, not an approval record. Every recommendation below
is `PROPOSED`, `BREAKPOINT`, or `DEFERRED`. `APPROVED` is intentionally empty.
No implementation may silently turn a proposal into a selected architecture.

## Executive Recommendation

**PROPOSED:** keep Nomi as the creative workbench and add one online-first,
multi-user control plane around it:

1. A Vercel-hosted web portal and thin BFF provide team access, routing, and
   signed-media mediation.
2. Supabase Singapore provides authentication, authoritative PostgreSQL product
   records, default-deny RLS, private object storage, realtime hints/presence,
   and a Postgres-backed job/outbox queue.
3. One narrowly scoped OCI media worker runs FFmpeg in Cloud Run Jobs in
   `asia-southeast1`; it is not a second product backend.
4. Electron remains a first-class `PlatformClient` adapter for local projects,
   registered workspaces, `nomi-local://`, browser capture, local credentials,
   the official Higgsfield CLI, and local FFmpeg.
5. Cloud and Electron implementations share runtime-neutral contracts and
   stable domain identities. The renderer never imports vendor SDK, secret,
   filesystem, IPC, or queue types as product authority.
6. Existing desktop projects migrate by shadow import and per-project authority
   cutover. No local project or Dropbox source is rewritten in place.

This is smaller than a Nomi rewrite, smaller operationally than a self-hosted
platform, and more complete than a browser-only shell. It preserves the current
workbench while adding the missing organizational system: shared campaigns,
standards, assets, reviews, approvals, publication gates, provenance, budgets,
and audit history.

## Status Ledger

### APPROVED

None. This section may be populated only from an explicit owner response at the
Babysitter architecture breakpoint and a recorded decision update.

### PROPOSED

- `P-01`: Vercel + Supabase + one Cloud Run media worker for Alpha.
- `P-02`: Singapore as the common Alpha data-plane region.
- `P-03`: Nomi/Electron and web portal as clients of runtime-neutral
  `PlatformClient` contracts.
- `P-04`: PostgreSQL as workflow/audit authority and private object storage as
  cloud byte authority, joined by stable asset/version UUIDs and digests.
- `P-05`: optimistic concurrency for ordinary Alpha records; append-only review,
  approval, publication, provenance, and audit records.
- `P-06`: Supabase Queues/PGMQ plus transactional outbox, idempotent dispatcher,
  leases, retries, and Cloud Run Jobs for cloud FFmpeg.
- `P-07`: local Electron Higgsfield execution until non-personal cloud custody is
  explicitly approved.
- `P-08`: independent logical database backups, object manifests/replication,
  and tested restore drills.
- `P-09`: staged shadow migration with a per-project authority marker and an
  independently testable rollback at every phase.

### BREAKPOINT

- `B-01`: approve or reject the proposed Alpha topology and Singapore region.
- `B-02`: choose the private repository/delivery boundary before product code is
  pushed anywhere.
- `B-03`: choose identity/session operations, MFA policy, secret manager/KMS,
  and production credential ownership.
- `B-04`: choose concurrent canvas/storyboard conflict behavior beyond ordinary
  optimistic locking.
- `B-05`: choose Higgsfield cloud execution and credential model; local CLI is
  the continuity default only until that decision.
- `B-06`: approve role administration, separation of duties, export/publish
  initiators, approvers, legal-review rules, and classification exceptions.
- `B-07`: approve audit retention, data retention/deletion/legal hold, RPO/RTO,
  and recovery authority.
- `B-08`: approve canonical-fact promotion owners and post-publication handling
  when facts are withdrawn or superseded.
- `B-09`: approve the pilot campaign, channels, Brand Kits/templates, budget,
  and measurable acceptance evidence.
- `B-10`: approve per-project migration cutover ownership, rollback window, and
  any irreversible external publication step.

### DEFERRED

- `D-01`: direct Higgsfield website/game deployment and publishing.
- `D-02`: arbitrary Higgsfield command pass-through, `auth token`, website
  repository access, and website secret administration.
- `D-03`: CRDT-based canvas editing unless the pilot proves optimistic
  concurrency inadequate.
- `D-04`: a fully self-hosted platform; retain it as the tested exit direction.
- `D-05`: multi-region active-active, GPU workers, and broad direct publishing
  before Alpha measurements and policy approval.
- `D-06`: private remote configuration and CI/CD implementation until B-01 and
  B-02 are approved.

## Why This Is The Smallest Full Alpha

The current renderer is not a standalone web application. Projects, assets,
credentials/catalog, generation, browser capture, MP4 export, event persistence,
and MCP/RPC all cross Electron preload into local files, sessions, native
processes, or the privileged main process. The browser project localStorage
fallback covers snapshots only and is not feature parity.

A browser-only port would therefore require replacing nearly every privileged
capability before team collaboration works. A self-hosted platform would add
database, auth, storage, queue, realtime, backup, observability, and on-call
ownership at once. The proposed hybrid adds only the shared authority that Nomi
lacks, while retaining proven local execution behind a compatible contract.

The recommendation still reaches the complete Alpha outcome:

- one shared organization, brands, projects, campaigns, and invited roles;
- structured brief, Knowledge Pack, storyboard, deliverables, and versions;
- shared private assets with stable provenance and cost;
- durable generation/export jobs and complete Higgsfield capability governance;
- review, approval, and publication eligibility enforced outside the UI;
- Electron continuity and online team workflows;
- migration, rollback, backup, observability, and an end-to-end pilot audit.

## Repository And Runtime Boundaries

| Boundary | Owner and contents | Allowed dependency direction |
| --- | --- | --- |
| Public upstream-compatible surface | Generic Nomi renderer behavior, runtime-neutral interfaces, generic Electron adapter improvements, localization | May be pulled into Everville integration branches. Everville policy/backend code must not flow to public `origin`. |
| Private Everville product surface | Tenancy, roles, RLS, Knowledge Packs, Brand Kits, approval/publication policy, cloud adapters, deployment | May depend on generic contracts; must not be pushed to current public `origin`. Private remote remains B-02. |
| Renderer/workbench | React creative UX and domain commands | Depends on `PlatformClient` only; no privileged secret, filesystem, provider, or service-role implementation. |
| Contract package | Stable IDs, commands, queries, events, errors, authorization context, and capability declarations | Depends on domain types only; no Electron, Supabase, Vercel, GCP, or provider SDK types. |
| Electron adapter | Existing IPC, local repositories, `nomi-local://`, local catalog/credentials, embedded browser, CLI, FFmpeg, MCP/RPC | Implements contracts and may call local privileged services. It cannot impersonate cloud authorization. |
| Cloud control plane | Auth, authorization, metadata, workflow, audit, signed asset access, queue/outbox, realtime hints | Implements contracts and owns cloud authority after explicit per-project cutover. |
| Media worker | Pinned OCI image for FFmpeg and later approved typed provider adapters | Receives opaque jobs and least-privilege credentials; cannot approve, publish, change membership, or weaken policy. |
| Knowledge boundary | Read-only reviewed `everville-core`; Dropbox originals and Atlas outputs as evidence/candidates | Retrieval may create scoped Knowledge Packs. Promotion is a separate owner-authorized path and is never automatic. |
| Work orchestration | Beads durable issue ledger; Babysitter `.a5c` journal for one run | Neither is product state, audit authority, credential storage, nor publication evidence. |

Upstream updates should enter a dedicated integration branch, pass generic
contract and Electron tests, and then be promoted into the private product
branch. Persisted IDs and schemas must not fork merely to match a cloud SDK.

## PlatformClient Contract

`PlatformClient` is a capability facade, not one giant remote API. Each operation
must carry `request_id`, actor/session context, organization/project scope where
applicable, expected version for mutable state, and a typed result or error.

| Capability | Core operations | Electron responsibility | Cloud responsibility |
| --- | --- | --- | --- |
| Identity/capabilities | `getSession`, `listCapabilities`, `getAuthority` | Local user/capability state; never cloud role authority | Auth session, memberships, scopes, policy version |
| Projects/campaigns | list/read/create/update, snapshot import/export | Native/external workspace repository and versioned snapshots | Shared authoritative records and revisions after cutover |
| Assets/versions | reserve identity, import/upload, read metadata, resolve/download, derive/version | Local bytes, sidecars, `nomi-local://` resolver | Private objects, signed access, checksums, version/provenance authority |
| Catalog/providers | list vendors/models/workflows/voices, health, typed setup metadata | Local catalog and local credential status | Approved shared catalog and credential references only |
| Jobs | estimate, submit, poll/subscribe, cancel, retry, get result | Existing provider/CLI/FFmpeg execution | Durable job ledger, policy/budget checks, cloud dispatch |
| Collaboration | presence, assignment, revision update, conflict response | Cached/synchronized projection | Durable concurrency authority and authorized realtime hints |
| Review/approval | submit, review, approve/reject/revoke, eligibility | UI and local projection only | Transactional authoritative records and policy checks |
| Knowledge | build/read scoped pack, validate freshness | Display/use a pack; no promotion | Canonical lookup, candidate boundary, immutable pack revisions |
| Publication | create intent, evaluate, enqueue, reconcile receipt | Export may produce a rendition but cannot mark it published | Server-only eligibility and channel execution after approval |
| Audit/migration | append authoritative transition, inspect history, stage/reconcile/cut over | Diagnostic local events and migration source | Product audit authority, migration journal, backups/restores |

Required error families are `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`
without existence leakage, `CONFLICT`, `POLICY_BLOCKED`, `BUDGET_BLOCKED`,
`VALIDATION_FAILED`, `PROVIDER_FAILED`, `RETRYABLE`, `UNAVAILABLE`, and
`UNSUPPORTED_CAPABILITY`. Errors expose safe codes and correlation IDs, not
credentials, private prompts, provider raw payloads, or cross-tenant metadata.

Every client advertises capabilities. Product workflows must visibly disable or
route unsupported operations instead of pretending that a web renderer can use
Electron-only features.

## Tenancy, Authentication, And Authorization

- Every tenant-owned record has immutable `organization_id`; brand, project,
  and campaign scope can narrow access but cannot widen it.
- Authentication establishes a principal only. Server/data policy resolves
  membership, scoped role, classification, resource state, and policy version.
- Default deny applies at API and PostgreSQL RLS boundaries, with defense in
  depth for private object storage and workers.
- Clients cannot set organization, role, classification, approval, ownership,
  cost, publication readiness, or canonicality.
- Standards Owner, Producer, Creator, conditional reviewer, and publishing
  service permissions are explicit operations, not broad CRUD roles.
- Approval binds immutable asset version, content digest, brief revision,
  Knowledge Pack revision, and policy snapshot. A bound change invalidates it.
- Provider and service credentials remain server/main-process only. The current
  Electron plaintext fallback is incompatible with production cloud custody.
- Publishing remains disabled until authoritative predicate, race, replay,
  idempotency, and audit-failure tests pass.

## Logical Data And Asset Authority

Authoritative cloud entities are Organization, Principal, Membership,
RoleAssignment, Brand, Project, Campaign, BriefRevision, KnowledgeSource,
KnowledgeFactRevision, KnowledgePackRevision, StoryboardRevision, Deliverable,
Asset, AssetVersion, GenerationJob, ProvenanceRecord, ReviewRequirement, Review,
Approval, PublicationIntent/Attempt/Receipt, AuditEvent, RetentionPolicy,
LegalHold, MigrationRun/Item, BackupManifest, and RestoreRun.

PostgreSQL owns identities, relationships, policy state, workflow state,
provenance, costs, approvals, publication receipts, and audit history. Private
object storage owns cloud bytes. An `Asset` UUID remains stable while immutable
`AssetVersion` rows point to object location, digest, size, MIME, predecessor,
derivation, classification, author, and provenance.

Persisted cloud identity never contains `nomi-local://`, absolute local paths,
signed URLs, provider/CDN URLs, or bucket-vendor identity. Electron may resolve
the same asset/version to `nomi-local://`; cloud clients receive short-lived
purpose-bound URLs only after current authorization.

Legacy missing provenance stays `unknown` or `unverified`. Migration must not
invent author, prompt, model, cost, classification, canonicality, or approval.

## Generation And Export Jobs

The durable state model is:

```text
DRAFT -> POLICY_CHECK -> COST_ESTIMATED -> CONFIRMATION_REQUIRED
      -> QUEUED -> LEASED -> RUNNING -> RESULT_VALIDATION
      -> SUCCEEDED | FAILED | CANCELLED | EXPIRED
```

Submission transactionally writes a domain job, authorization/policy snapshot,
budget reservation, expected cost, idempotency key, and outbox/queue record.
Workers recheck immutable job scope before side effects. Delivery is at-least-
once; job ID, lease, attempt, and idempotency determine execution. Success is
terminal only after an asset version, digest, provenance, actual cost, and audit
record commit. Execution success never implies approval or publication.

Cloud FFmpeg runs in a pinned OCI image through Cloud Run Jobs. Electron FFmpeg
continues to implement the same export artifact contract and is the rollback
executor. Vercel and hosted edge functions are not general FFmpeg runtimes.

### Higgsfield CLI 1.1.13 Capability Surface

The installed official CLI is broader than Nomi's current model/workflow path.
The architecture must govern the whole surface without exposing arbitrary shell
execution:

| Surface | Capabilities | Alpha treatment |
| --- | --- | --- |
| Auth/workspace/account | login/logout/token; workspace list/set/status/unset; account status/transactions | Local login/status only. Token output is prohibited from product automation. |
| Catalog | image/video/text/audio models; workflows; voices | Typed read/sync operations enabled. Stable provider/model IDs are not localized. |
| Upload/generation | image/video/audio upload; create/cost/get/list/wait/workflow; image, video, audio, text, 3D | Typed adapter enabled with policy, budget, provenance, and result validation. |
| Soul | Soul ID create/get/list/wait, Soul 2.0 and Cinematic training | Product-gated until consent, source, budget, retention, and approval policy exists. |
| Marketing Studio | ad formats/references, avatars, Brand Kits, DTC ads, hooks, products, settings, web products | Product-gated and mapped to Brand/Campaign/AssetVersion provenance. |
| Product pipelines | product photoshoot and marketplace cards, including variants and enhancement modes | Product-gated; useful for later campaign deliverables, not implicit pilot scope. |
| Website platform | contest/create/deploy/list/publish/rename/repo access, read-only DB, secret administration | Deferred; deploy/publish/repository/secret actions require a separate security decision. |
| Game platform | deploy and publish | Deferred outside the media pilot. |
| Automation | JSON/no-color, timeouts/intervals, version/build data | Required for typed execution, pinning, checksum verification, and observability. |

For Alpha, Higgsfield executes through the authenticated Electron CLI and
returns normalized jobs/assets/provenance to cloud authority. No personal OAuth
credential is copied to Vercel, Supabase, or Cloud Run. Cloud execution remains
B-05 until Higgsfield supports and Everville approves non-personal workspace
credentials, rotation, billing ownership, redaction, and parity tests. Direct
undocumented HTTP calls and generic CLI argument endpoints are prohibited.

## Collaboration Model

Committed PostgreSQL revisions are authoritative. Realtime transports private
authorized invalidation hints and low-rate presence, never canonical facts or
approval state.

- Briefs, storyboards, deliverables, and asset metadata use optimistic version
  checks and return a typed `CONFLICT` with current revision.
- Reviews, approvals, provenance, publication, and audit are append-only.
- Presence records online/active-document state only.
- Assignment and workflow transitions are durable authorized commands.
- Simultaneous freeform canvas editing uses edit lease/optimistic rejection for
  Alpha unless B-04 selects field merge or CRDT after explicit scenarios.
- Offline Electron edits become a proposed revision on reconnect; they do not
  overwrite cloud authority silently.

## everville-core And Atlas Boundary

- `everville-core` is the reviewed canonical knowledge source.
- Dropbox originals and folder-local Atlas outputs are source evidence. Their
  `_agent/handoffs/latest.md` and `_agent/validation_report.md` status must be
  captured before use.
- OCR, extraction, summaries, and generated statements create candidate fact
  revisions only.
- Promotion to canonical is a separate audited owner command; ingestion,
  retrieval, generation, and ordinary review cannot invoke it.
- Knowledge Packs are immutable snapshots scoped to organization, project,
  campaign, role, purpose, and classification, with exact fact revision IDs and
  digests. Whole-company prompt loading is denied.
- Public and Investor material can become publication-eligible only when each
  factual reference resolves to a current canonical revision in the bound pack.

## Deployment And Operations

Proposed Alpha environments are isolated development, preview/staging, and
production projects with separate databases, buckets, secrets, provider
workspaces, and service identities. Preview must not use production data or
provider credentials.

Vercel hosts UI/BFF only. Supabase is authoritative for product data/storage/
queue/realtime. Cloud Run Jobs runs media binaries. Electron remains an
independently packaged client with installed-app verification. OpenTelemetry
correlation joins all runtimes using request, organization, campaign, job,
asset/version, provider request, executor, and deployment identifiers.

The public `origin` is upstream intake only. Private remote and CI/CD are
blocked by B-02 and D-06. No Everville product branch may be pushed to public
`origin`.

## Migration And Rollback

| Phase | Authority and proof | Rollback |
| --- | --- | --- |
| M0 contracts/inventory | Electron sole authority; enumerate projects, schemas, bytes, hashes, missing provenance, unsupported states | Remove unused adapter/staging; source untouched |
| M1 identity/tenancy | Test organizations, memberships, stable IDs, RLS denial suite | Disable cloud login; local projects untouched |
| M2 shadow metadata/assets | Versioned, idempotent imports with batch IDs, counts, relationships, and digest reconciliation | Delete/quarantine batch records and objects |
| M3 dual validation | Cloud projection read tests, negative authorization, restore evidence, no uncontrolled dual writes | Disable cloud reads/sync and continue desktop-only |
| M4 pilot cutover | Explicit project authority marker, final checkpoint, zero unexplained differences, online/offline conflict tests | Freeze cloud writes, export latest versioned snapshot/assets, reconcile, owner-approved authority reversal |
| M5 cloud worker | Golden-file FFmpeg, timeout/cancel/retry/cost tests and Electron parity | Disable dispatcher and execute through Electron; preserve queued job state |

Every transform has a version, fixtures, idempotency test, validation, and
inverse or compensating procedure. Schema expansion precedes writers. No source
workspace or Dropbox original is rewritten. Rollback preserves authoritative
data, audit, and provenance. External publication without a supported unpublish
path is an irreversible breakpoint before execution.

## Security Release Conditions

The following are release blockers, not ordinary deferred debt:

- two-tenant API, RLS, object, queue/result, and restore denial tests;
- browser bundle and Electron renderer secret scans;
- hostile IPC/path/traversal/symlink and `nomi-local://` installed-app tests;
- provider classification/egress policy and no-call assertions;
- signed URL expiry/replay, object digest, MIME, size, and quarantine tests;
- job replay, revoked membership, budget race, and provider callback tests;
- approval/version invalidation and concurrent approval/publication tests;
- candidate-fact publication denial and stale Knowledge Pack tests;
- audit/outbox failure injection that proves authoritative transitions fail
  closed;
- backup/restore tenant scoping, referential integrity, object digest, and audit
  continuity evidence.

Direct publishing remains disabled until these gates and B-06 through B-10 are
resolved.

## Observability, Audit, And Costs

Product audit is a dedicated append-only logical ledger. Local Nomi JSONL,
Beads, Babysitter journals, provider logs, and short-lived hosting logs are
diagnostic inputs only.

Required signals cover auth/denials, RLS/policy decisions, queue age and leases,
attempts/retries, provider latency/status/cost, FFmpeg image digest and duration,
asset signing/transfers/checksums, version/provenance creation, reviews,
approvals, publication, migration, backup/restore/rollback, and Electron sync.
Authoritative transitions commit their audit record or transactional outbox in
the same transaction and fail closed.

Cost records separate provider cost from infrastructure cost. Campaign creation
names budget, currency, and accountable owner. Every generation stores expected
cost before confirmation and actual provider cost, worker resources/duration,
and transfer bytes after execution.

The dated candidate floor is approximately Vercel Pro at USD 20/developer/month
plus Supabase Pro starting at USD 25/month, before media transfer, storage,
realtime, logs, backups/PITR, Cloud Run execution, and provider spend. Exact
pricing must be refreshed at approval. Cross-vendor egress and retained
observability are the largest platform unknowns. Option B's apparent low
infrastructure price omits HA, recovery, patching, incident response, and
engineering/on-call cost. Option C has a higher always-on Cloud SQL floor but
better single-cloud operations.

## Alternatives And Failure Modes

| Choice | Benefit | Principal cost/failure mode | Disposition |
| --- | --- | --- | --- |
| A: Vercel + Supabase + Cloud Run worker | Fastest Alpha; integrated auth/RLS/storage/realtime; Postgres and OCI exit | Cross-vendor egress, fragmented logs, coordinated DB/object recovery | **PROPOSED**, not approved |
| B: self-hosted TypeScript/Postgres/S3/queue/workers | Maximum control and portability | Largest operational/on-call burden; easy to underbuild HA/recovery | Exit direction, **DEFERRED** for Alpha |
| C: Google Cloud managed suite | Strong media workers, backup, observability, single-cloud locality | More platform engineering, higher fixed DB cost, more IAM/service coupling | Credible alternative at B-01 |
| Browser-only Nomi rewrite | One client surface | Replaces local filesystem, secrets, capture, CLI, FFmpeg, events, MCP before collaboration exists | Rejected recommendation; not decision-approved |
| Electron-only team rollout | Preserves all current features | No shared authority, tenancy, approval, audit, or reliable collaboration | Insufficient for full Alpha |

Material failure modes are cross-tenant access, renderer/browser secret
exposure, false browser parity, stale/lost concurrent writes, duplicated spend,
incomplete provenance, unsafe candidate knowledge, approval bypass, partial
publication, object/DB backup mismatch, cross-vendor outage/egress, and an
unrecoverable authority cutover. Each maps to the release and rollback gates
above.

## Verification And Acceptance Trace

| Matrix rows | Required evidence before milestone/Alpha acceptance |
| --- | --- |
| RFC-01, RFC-20 | Current runtime audit, contract parity tests, Electron smoke, packaged installed-app checks |
| RFC-02, RFC-21 | Repository boundary review, remote audit, no push to public `origin`, upstream integration rehearsal |
| RFC-03 | Contract catalog completeness plus local/cloud conformance and typed error tests |
| RFC-04 to RFC-07 | Schema/RLS migrations, two-tenant policy tests, role/class matrix, asset identity/digest/signed-access tests |
| RFC-08, RFC-09 | Job state/replay/cancel/cost tests, full Higgsfield inventory contract tests, local CLI end-to-end evidence |
| RFC-10 | Producer-to-Creator-to-review-to-approval journey, conflict/offline tests, immutable history reconstruction |
| RFC-11 | Scoped Knowledge Pack fixtures, candidate denial, canonical promotion audit, stale-pack behavior |
| RFC-12, RFC-17 | Dated option/cost review, environment smoke, deployment proof, spend and transfer telemetry |
| RFC-13, RFC-14 | Versioned migration fixtures, shadow reconciliation, backup/restore drill, project rollback rehearsal |
| RFC-15, RFC-16 | Misuse-case suite, failure injection, audit reconstruction, operator runbook and retained signals |
| RFC-18 | Documentation verification, `git diff --check`, unit/contract/integration/system/package gates and installed-app verification |
| RFC-19 | One real-estate campaign through all ten workflow steps with named actors, policies, costs, reviewed short video and channel adaptations |
| RFC-22, RFC-23 | Owner-reviewed alternatives and explicit resolution/defer record for every breakpoint |
| RFC-24 | After owner approval only: reconcile every child Beads criterion/dependency to the selected RFC and record the reviewed commit |

At this review stage RFC-01 through RFC-23 can be `PASS` or explicitly
`BLOCKED` on named owner decisions. RFC-24 cannot pass until the architecture
breakpoint is explicitly approved and downstream Beads issues are reconciled.

## Consequential Owner Decisions

Please answer these explicitly; silence is not consent and the current proposal
does not select them.

1. **Topology:** approve Option A for Alpha, choose Option C, choose Option B,
   or request a revised hybrid? Is Singapore acceptable for the Alpha data plane?
2. **Delivery:** where will the private Everville repository/remote live, and who
   owns merge, release, and CI/CD authority?
3. **Identity/secrets:** is Supabase Auth acceptable for Alpha, what MFA actions
   are mandatory, and who owns provider credentials, rotation, and recovery?
4. **Collaboration:** is optimistic locking plus an edit lease acceptable for
   simultaneous canvas/storyboard work, or is CRDT/field merge required now?
5. **Higgsfield:** approve local Electron CLI execution for Alpha? Should any
   cloud execution be allowed before non-personal workspace credentials exist?
6. **Roles:** who administers membership/classification, who may export, who may
   initiate publication, and which duties require different people?
7. **Approval/legal:** who are the final business/brand/legal approvers, which
   classes/templates always require legal review, and which publication channels
   are enabled in Alpha?
8. **Knowledge:** who may promote Atlas/Dropbox-derived candidate facts into
   `everville-core`, and what happens to already-published work when a fact is
   withdrawn or superseded?
9. **Recovery/compliance:** what are the RPO, RTO, retention/deletion/legal-hold
   rules, backup ownership, and required restore-drill cadence?
10. **Pilot:** which real-estate campaign, Brand Kit/templates, team, channels,
    languages, budget, and measurable acceptance evidence define Alpha success?
11. **Migration:** who authorizes per-project cloud authority cutover, how long
    is the rollback window, and which external side effects are accepted as
    irreversible?
12. **Cost envelope:** what monthly platform ceiling and per-campaign provider
    budget require warning, confirmation, or hard denial?

## Owner Review Record

Architecture breakpoint result: **PENDING**

Reviewed commit: **PENDING**

Owner response/date: **PENDING**

Approved decision IDs: **none**

Rejected or revised decision IDs: **none**

Until this record contains explicit owner approval, downstream work may improve
contracts, tests, fixtures, cost measurements, and reversible spikes only. It
must not move authoritative Everville data, enable direct publication, copy
personal Higgsfield credentials to cloud infrastructure, or present this
proposal as selected architecture.
