# Everville Media Platform Security and Data Architecture

Status: Security and data architecture input; no platform selection approved

Milestone: `evmedia-r20.4`

Date: 2026-07-17

Effect: `01KXPTH8SDBFEC6JX24N9CN83W`

## Scope and decision discipline

This document threat-models the browser, API, worker, provider, object-storage,
Electron, Dropbox/Atlas, and `everville-core` boundaries. It proposes a
vendor-neutral authorization and logical data contract for the online-first
platform while preserving the current desktop authority during migration.

It does **not** approve a cloud vendor, database, identity provider, object
store, queue, retention schedule, direct-publishing channel, reviewer owner, or
legal-review policy. `Vercel + Supabase` remains one candidate only. Terms have
the following meaning throughout:

- **Confirmed evidence** is directly supported by a cited repository path and
  exact line number.
- **Inference** is a bounded conclusion from confirmed evidence and must be
  validated before implementation.
- **Recommendation** is `PROPOSED`, not approved architecture.
- **Unresolved owner decision** is a release or implementation breakpoint; no
  default may silently resolve it.

The product workflow itself is still a draft and explicitly leaves technical
architecture, storage, collaboration, deployment, and migration open
(`docs/product/2026-07-16-everville-media-portal-workflow-draft.md:3-14`). The
acceptance matrix likewise states that candidate architecture and product-owner
choices remain unapproved
(`docs/architecture/everville-media-platform-acceptance-matrix.md:20-32`).

## Confirmed current-state evidence

| ID | Confirmed claim | Repository evidence | Security/data consequence |
| --- | --- | --- | --- |
| E-01 | The current runtime is a React renderer plus privileged Electron main process; projects, assets, provider tasks, browser capture, exports, and related capabilities cross the preload bridge. | `.codex/project-index.md:6-17`; `electron/preload.ts:44-105`; `electron/preload.ts:167-215` | Renderer input is untrusted at every IPC handler. Desktop IPC is not a cloud authorization model. |
| E-02 | The main window enables context isolation and disables Node integration, but Electron sandboxing is disabled. Top-level remote navigation and new windows are intercepted. | `electron/main.ts:284-304`; `electron/main.ts:316-334` | Existing controls reduce renderer compromise paths, but a renderer compromise still reaches the exposed preload capabilities. |
| E-03 | The embedded browser uses a persistent profile, denies Electron permission requests/checks, and runs remote pages with context isolation, no Node integration, and sandboxing enabled. | `electron/browser/core/browserViewSession.ts:16-20`; `electron/browser/core/browserViewSession.ts:43-65`; `electron/browser/core/browserViews.ts:245-260` | Remote pages are a distinct hostile-content boundary. Persistent cookies/session state and capture bridges remain sensitive. |
| E-04 | The renderer may request project create/read/save/delete and model-catalog API-key writes through IPC. The handlers call local repositories directly and do not carry organization membership or project-role context. | `electron/main.ts:426-454`; `electron/main.ts:461-475` | Current desktop possession is effectively the local authority. These handlers cannot be reused as cloud authorization decisions. |
| E-05 | Provider credentials use Electron `safeStorage` when available, but explicitly fall back to plaintext records when it is unavailable; plaintext records are lazily upgraded when encryption later becomes available. | `electron/catalog/secrets.ts:1-18`; `electron/catalog/secrets.ts:22-56`; `electron/catalog/catalogStore.ts:320-336` | The online platform must not inherit plaintext fallback or send secret material into browser/renderer state. |
| E-06 | Project records are folder-backed snapshots with identifiers, revision metadata, a version, and a payload. Native projects default under `~/Documents/Nomi Projects`; registered external workspaces are also supported. | `electron/projects/repository.ts:30-46`; `electron/projects/repository.ts:163-185`; `electron/projects/repository.ts:188-209` | The migration source is local workspace state, not renderer memory. Import must preserve identity, revisions, and source authority. |
| E-07 | Persisted project versions 1 and 2 normalize into one renderer representation; project hydration runs explicit content migrations and only persists semantic changes. | `src/workbench/project/projectRecordSchema.ts:11-18`; `src/workbench/project/projectPersistenceService.ts:143-178` | Cloud migration needs versioned, idempotent transforms and must not rewrite source snapshots ad hoc. |
| E-08 | Project path resolution is constrained through the workspace path resolver; external folder deletion unregisters rather than deleting user content, while native deletion is constrained to the projects root. | `electron/projects/repository.ts:212-239`; `electron/projects/repository.ts:242-247` | Local path checks are useful continuity controls, but cloud tenancy must be enforced by subject/resource authorization and storage policy. |
| E-09 | `nomi-local://` resolves a project-relative path to local bytes and returns wildcard CORS/CORP headers. The scheme is registered as secure, fetch-capable, stream-capable, and CORS-enabled. | `electron/protocol/localProtocol.ts:5-38`; `electron/main.ts:96-107` | `nomi-local://` is a desktop runtime locator, not a persisted cloud asset identity or authorization mechanism. |
| E-10 | Generated results can carry provider, model, prompt, parameters, seed, provider request ID, timestamp, and agent run ID, but all provenance fields except timestamp are optional for legacy compatibility. | `src/workbench/generationCanvas/model/generationCanvasTypes.ts:47-67`; `src/workbench/generationCanvas/model/generationCanvasTypes.ts:69-86` | Existing provenance is a migration input, not proof that every historical asset is publication-ready. Missing fields must remain visibly unknown. |
| E-11 | The local event log is append-only per project, assigns sequence numbers, rotates segments, redacts before writing, and explicitly treats logging failure as non-blocking. | `electron/events/eventLogRepository.ts:1-21` | It is useful diagnostic evidence but cannot be the authoritative approval/publication audit ledger. |
| E-12 | External MCP/RPC access uses a file-backed bearer token and loopback-only HTTP, but the instance advertisement serializes the token with PID and port. RPC dispatch can list/create projects, edit canvases, and trigger generation. | `electron/capabilityCore/security.ts:1-10`; `electron/capabilityCore/security.ts:42-67`; `electron/capabilityCore/rpcServer.ts:58-101`; `electron/capabilityCore/lockfile.ts:16-32`; `electron/capabilityCore/dispatcher.ts:39-65` | Local token possession is powerful desktop authority and must never be treated as an organization identity, cloud session, or publication approval. |
| E-13 | The product draft defines five content classes, says classification controls knowledge/models/collaborators/approvals/export/publication, and requires publication to wait for all required approvals. | `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:47-58`; `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:94-102` | Classification and approval state must be first-class authoritative records, not UI labels. |
| E-14 | `everville-core` is the reviewed knowledge source; Dropbox originals and Atlas outputs are evidence; candidate/extracted facts are not canonical and Nomi must not promote facts automatically. | `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:16-24`; `.codex/project-index.md:64-80` | Retrieval and promotion are different trust paths. Publication eligibility must be machine-checkable from canonical fact status and provenance. |
| E-15 | Repository policy prohibits secrets, credentials, private investor data, and source documents in Beads, Babysitter prompts, commits, or generated artifacts. | `.codex/project-index.md:97-107` | Product audit data must be stored in a dedicated controlled plane, separate from development orchestration state. |

## Bounded inferences requiring validation

| ID | Inference | Basis | Required validation |
| --- | --- | --- | --- |
| I-01 | There is no evidenced organization/project authorization layer in the current desktop IPC path. | E-01 and E-04 show direct renderer-to-local-repository calls without membership context. | Complete the RFC runtime inventory and confirm no independent authorization gate exists on every mutating handler. |
| I-02 | A main-renderer compromise could invoke most capabilities exposed by `nomiDesktop`, subject to each handler's validation. | E-01 and E-02. | Inventory every preload method and handler validation; add malicious-renderer tests before desktop/cloud account linking. |
| I-03 | Wildcard CORS on `nomi-local://` increases the importance of strict project-relative resolution and renderer navigation isolation. It is not by itself evidence of cross-project disclosure. | E-02, E-08, and E-09. | Add tests from allowed and disallowed origins and for traversal, symlink escape, encoded separators, and wrong project IDs. |
| I-04 | Historical projects may contain incomplete provenance and therefore cannot be bulk-marked publication-safe. | E-10 explicitly allows legacy records without most provenance fields. | Run a read-only migration inventory that counts missing provenance by project, asset, and field. |
| I-05 | Current event logs cannot prove that an approval or publication was durably committed because logging failure is intentionally non-blocking. | E-11. | Confirm event-log failure behavior and define a separate transactional product audit store. |
| I-06 | Dropbox/Atlas material may contain sensitive or unreviewed data whose folder visibility does not imply model-use or publication permission. | E-13 and E-14 define class and canonicality separately. | Validate folder ACLs, Atlas handoff/validation status, source provenance, and project/classification policy during each ingestion. |

## Trust boundaries and threat model

The target design uses an untrusted-client model. Authentication establishes a
principal; it does not authorize an operation. Every authoritative operation
must resolve subject, organization, project/campaign, role scope, classification,
resource state, and policy version at the server-side enforcement point.

| Boundary | Protected assets | Primary threats / misuse cases | Required prevention | Reviewable verification evidence |
| --- | --- | --- | --- | --- |
| Browser to API | Sessions, project data, drafts, approvals, publication commands | XSS/session theft; CSRF; IDOR; caller-supplied `organization_id`; mass assignment; UI-only publication gate | Secure session lifecycle; origin/CSRF defense appropriate to auth mode; server-derived tenant scope; allowlisted mutations; object-level authorization on every request; no secrets in browser | Cross-tenant negative tests; CSRF tests; schema-fuzz tests; browser bundle secret scan; policy decision logs |
| Electron renderer to Electron main | Local files, provider credentials, generation spend, browser sessions, exports | Compromised renderer invokes broad IPC; malformed payload/path; approval or cloud-session confusion | Treat every IPC payload as hostile; narrow channels and schemas; sender/origin checks; capability-specific authorization; sandbox migration assessment; separate local capability from cloud identity | Handler inventory; malicious-renderer suite; traversal/symlink tests; installed-app checks; documented sandbox breakpoint |
| Embedded browser / remote page to capture bridge | Persistent browser cookies, downloaded media, prompt/source metadata | Remote script injection; drive-by downloads; hostile SVG/media; cookie/session exposure; spoofed console bridge payload | Keep sandbox/permission denial; isolate partition from app auth; validate capture messages; size/type sniffing; malware/media processing quarantine; record source URL and digest | Hostile-page fixtures; MIME mismatch tests; oversized/decompression tests; partition isolation check; provenance assertions |
| API to authoritative data store | Memberships, classifications, policies, approvals, publication state, audit ledger | Tenant filter omission; confused deputy; stale writes; approval-state tampering; audit deletion | Default-deny policy at API and data boundary; mandatory tenant keys; optimistic concurrency; transactional state transitions; append-only/tamper-evident audit; privileged access review | Policy tests using two organizations; transaction race tests; restore/audit-chain checks; privileged-query review |
| API to worker/queue | Job payload, authorization snapshot, budgets, requested provider/model | Forged/replayed jobs; stale authorization; queue poisoning; unbounded cost; cross-project result attachment | Opaque job ID; immutable authorization/policy snapshot; idempotency key; budget reservation; worker recheck before side effects; constrained service identity | Replay tests; revoked-membership race; budget-concurrency tests; dead-letter inspection; job-to-version provenance trace |
| Worker to provider | Provider secret, prompt, source assets, personal/confidential data, spend | Secret leakage; sending disallowed class; provider retention/training; SSRF/egress abuse; forged webhook/result | Server-only secret reference; provider allowlist by class/policy; scoped/rotated credentials; egress allowlist; signed webhook or authenticated polling; response validation; redact logs | Secret canary scan; policy denial tests; egress tests; webhook replay/signature tests; provider contract review |
| API/worker to object storage/CDN | Original bytes, derivatives, exports, metadata | Guessable keys; cross-tenant bucket/list; long-lived URLs; metadata/byte substitution; public draft exposure; orphaned bytes | Opaque stable asset IDs; tenant/project ownership in metadata and policy; private-by-default objects; short-lived purpose-bound URLs; digest/size/type verification; quarantine then promote; lifecycle only after legal-hold check | Two-tenant object tests; expired/replayed URL tests; digest mismatch tests; public-access scan; orphan reconciliation |
| Dropbox originals / folder-local Atlas to ingestion | Source documents, OCR, extracted candidate facts, handoffs | Sync/ACL drift; poisoned source; OCR error; candidate canonicalization; PII leakage; stale validation status | Read-only source connector; preserve source locator/digest; inspect folder `_agent/handoffs/latest.md` and `_agent/validation_report.md`; classify before model use; quarantine candidates; no automatic promotion | Connector ACL test; digest ledger; handoff/validation capture; candidate/publication denial test; source deletion/tombstone behavior |
| Ingestion / Knowledge Pack to `everville-core` | Canonical facts, provenance, approval status | Automatic promotion; stale or superseded facts; whole-company retrieval; prompt injection in source content; provenance stripping | Separate read/use from promote/write; explicit reviewer promotion; immutable canonical revision; project/role/class filters; retrieval limits; render source text as data; pack snapshot with fact IDs and digests | Promotion authorization tests; stale-pack test; prompt-injection fixtures; whole-company query denial; pack reproducibility check |
| Publishing service to channel/provider | Approved immutable version, channel credentials, public endpoint | Approval bypass; TOCTOU after approval; wrong channel/account; duplicate publish; partial failure; secret leakage | Dedicated service identity; publication-intent state machine; re-evaluate blocking predicate in transaction; approvals bound to version/policy digest; idempotency; channel allowlist; receipt capture; compensating unpublish where supported | Version-change invalidation test; concurrent approval/publish test; duplicate request test; channel-account assertion; receipt/reconciliation evidence |
| Backup/restore and migration tooling | Authoritative records, bytes, secrets, audit/provenance continuity | Incomplete backup; untested restore; cross-tenant restore; migration corruption; irreversible cutover; rollback loses writes | Encrypted versioned backups; tenant-aware restore authorization; checksums and manifests; restore drills; dual-read/shadow validation; explicit irreversible breakpoint; rollback journal | Recovery-point/recovery-time evidence; sampled/full restore checks; migration count/digest reconciliation; rollback rehearsal |

Critical controls above are release blockers. A critical control may be
unimplemented during design, but the affected environment or capability must
remain disabled; it cannot be accepted as ordinary deferred debt.

## Authorization invariants

The following are `PROPOSED` invariants. They are implementation-neutral and
must be enforced at the authoritative API/data boundary, with defense in depth
at object storage and worker boundaries.

1. **Default deny:** absent an explicit allow derived from an active membership,
   scoped role assignment, resource organization/project, classification policy,
   and current resource state, deny the operation.
2. **Server-derived scope:** never trust client-provided organization, project,
   role, classification, approval status, cost, ownership, or publication-ready
   flags. IDs select candidates; server joins establish authority.
3. **Organization isolation:** every tenant-owned record carries immutable
   `organization_id`. Every project/campaign child is reachable through exactly
   one organization. Cross-organization references are invalid, including asset
   versions, approvals, jobs, Knowledge Packs, and publication receipts.
4. **Project isolation:** organization membership alone does not grant project
   access unless an approved organization-wide role says so. Project membership
   or an explicit policy grant is required.
5. **Least privilege and scoped roles:** role assignments include organization,
   optional brand/project/campaign scope, validity interval, granting actor, and
   reason. A role name without scope grants nothing.
6. **Classification is an additional gate:** satisfying role scope does not
   override content classification, legal hold, export policy, provider policy,
   or approval state.
7. **No self-escalation:** actors cannot grant or expand their own role,
   classification clearance, reviewer requirement, or project membership.
8. **No self-approval where separation is required:** the approval-policy
   snapshot determines whether creator, producer, reviewer, Standards Owner, or
   business owner duties must be performed by distinct principals.
9. **Immutable approval target:** approval binds `asset_version_id`,
   `content_digest`, `brief_revision_id`, `knowledge_pack_revision_id`, and
   `approval_policy_snapshot_id`. Any bound change invalidates readiness.
10. **Worker least privilege:** workers receive an opaque job and narrowly scoped
    service identity, not an end-user session. They cannot grant membership,
    approve, alter classification, or choose a less restrictive policy.
11. **Private-by-default bytes:** possession of an object key or asset ID does not
    grant access. Download/export URLs are short-lived, purpose-bound, and issued
    only after current authorization.
12. **Fail closed:** policy lookup failure, missing provenance, unresolved
    candidate facts, stale approval, incomplete malware/media checks, audit-write
    failure for authoritative transitions, or unknown classification blocks the
    side effect.

### Role/action baseline

This baseline expresses product constraints without deciding final owners. `C`
means allowed only when all named policy conditions pass; `D` means deny. A role
assignment outside its scope is always `D`.

| Action | Standards Owner | Producer | Creator | Conditional reviewer | Publishing service |
| --- | --- | --- | --- | --- | --- |
| View scoped campaign/content | C | C | C | C | C, publication payload only |
| Create campaign/brief | D | C | D | D | D |
| Edit production content | D unless separately assigned | C | C | D | D |
| Change organization/brand standards | C | D | D | D | D |
| Submit version for review | D unless creator/producer role also held | C | C | D | D |
| Record producer review | D | C, separation policy applies | D | D | D |
| Record brand approval | C, separation policy applies | D | D | D | D |
| Record conditional approval | D unless named reviewer | D unless named reviewer | D | C, requirement-specific | D |
| Export | C only if export policy and gates pass | C only if export policy and gates pass | D by default | D | D |
| Publish | D | D | D | D | C only from eligible publication intent |

The creator constraints and Standards Owner/conditional-review workflow are
confirmed product requirements
(`docs/product/2026-07-16-everville-media-portal-workflow-draft.md:26-45`).
Whether Producers or Standards Owners may export, and which humans may initiate
a publication intent, remain owner decisions D-06 and D-07 below.

### Classification handling baseline

The five class names are confirmed; the policy below is `PROPOSED`.

| Class | Minimum access rule | External provider / export / publication baseline |
| --- | --- | --- |
| Public | Authenticated project access while draft; anonymous access only to a successfully published rendition | Approved provider and channel policy; all approvals and canonical-fact checks required |
| Partner | Explicit project access plus Partner-or-higher policy grant | No public URL; external processing/export only to approved recipient/provider purpose |
| Investor | Explicit project access plus Investor policy grant; investor-facing canonical-fact rule always applies | No public URL by default; provider/export requires investor-data policy and required business/legal approvals |
| Internal | Active organization and project access | External processing/export denied unless an explicit policy allows the provider, purpose, and destination |
| Restricted | Explicit resource/project allowlist in addition to role; no inherited broad access by default | External provider, local sync, export, and publication denied unless a specific approved exception and reviewer gate exist |

Classification changes create audit events. Raising classification takes effect
immediately. Lowering classification requires authorized review, records a
reason, invalidates affected URLs/Knowledge Packs/approvals, and re-evaluates
retention and publication eligibility.

## Provider-secret custody

Target-platform provider secrets are **server-only**:

- Store only a `provider_credential_ref` in application records. Secret bytes
  live in an approved secret manager/KMS boundary selected at D-03.
- Browser bundles, renderer state, project snapshots, object metadata, queues,
  logs, errors, analytics, audit payloads, Beads, Babysitter journals, and source
  control must contain neither plaintext nor reversibly encoded provider keys.
- Secret create/update accepts bytes only at a dedicated privileged endpoint;
  ordinary reads return metadata such as provider, scope, status, and last four
  characters, never the secret.
- Decryption is limited to the execution service immediately before an approved
  provider call. Use scoped credentials per environment/provider/organization
  where supported, rotate them, and audit use by reference ID.
- Workers must not serialize decrypted secrets into job payloads or retries.
  Provider responses and errors pass structured redaction before any log.
- Desktop `safeStorage` remains a local compatibility mechanism. Cloud
  credentials must not sync into Electron. If desktop execution continues, the
  local key and cloud credential are separate records with separate custody and
  revocation.
- Production must fail closed if the approved secret-protection facility is
  unavailable; the current plaintext fallback (E-05) is not acceptable for the
  online platform.

## Logical data model

This is a logical contract, not a database selection. All tenant-owned entities
include `id`, immutable `organization_id`, `created_at`, `created_by`,
`updated_at`, and a concurrency/version field unless explicitly immutable.

| Entity | Required security/data fields and relationships |
| --- | --- |
| `Organization` | Name/status; active policy-set reference; retention-policy reference |
| `Principal` | External auth subject; status; no provider secrets |
| `Membership` / `RoleAssignment` | Principal, organization, optional brand/project/campaign scope, role, classification grant, validity, grantor, reason |
| `Brand` | Organization; active Brand Kit/standards revision |
| `Project` | Organization; brand; status; default classification; external-source references |
| `Campaign` | Project; audience/objective/channels/languages; budget/currency; deadline; classification; owner |
| `BriefRevision` | Campaign; immutable revision/digest; author; source/reference links |
| `KnowledgeSource` | Source kind (`everville-core`, Dropbox original, Atlas output); immutable locator/digest; project/classification; provenance and validation status |
| `KnowledgeFactRevision` | Source; canonicality (`candidate`, `under_review`, `canonical`, `rejected`, `superseded`); canonical reviewer/time; validity interval; supersedes link |
| `KnowledgePackRevision` | Campaign/project; immutable policy snapshot; included fact revision IDs/digests; retrieval actor/time; classification; expiry/staleness status |
| `StoryboardRevision` | Campaign; immutable content/digest; author; predecessor |
| `Deliverable` | Campaign; type/channel/language; required format; current submitted version; lifecycle state |
| `Asset` | Project/campaign; stable logical identity; owner; classification; media kind; source kind |
| `AssetVersion` | Asset; immutable version number; object reference; content digest; size/MIME; author; predecessor/derivation; generation/import provenance; quarantine/scan state |
| `GenerationJob` | Project/campaign; actor; requested provider/model; credential reference; classification/policy snapshot; input versions/digests; idempotency; budget reservation; expected/actual cost; state/error |
| `ProvenanceRecord` | Asset version; prompt digest and protected prompt payload reference; model/provider/version; parameters/seed; source/Knowledge Pack revisions; author/agent/job; request ID; cost; timestamps |
| `ReviewRequirement` | Approval-policy snapshot; requirement kind; scope; eligible role/principal rule; separation rule; mandatory/conditional result |
| `Review` | Target asset version and bound digests; reviewer; outcome; findings; immutable timestamp; superseded/revoked link |
| `Approval` | Requirement; target version and all bound snapshot/digests; approver and scoped role; decision; reason; immutable timestamp; revocation/invalidation metadata |
| `PublicationIntent` | Exact asset version; channel/account; initiator; idempotency key; approval-policy snapshot; status; block reasons; eligibility-evaluated-at |
| `PublicationAttempt` / `PublicationReceipt` | Intent; worker; provider request/receipt ID; state; public locator if any; timestamps; error/reconciliation/unpublish status |
| `AuditEvent` | Append-only actor/service, action, organization/project/resource, before/after or field delta, policy decision/reason, correlation/request ID, time, integrity link |
| `RetentionPolicy` / `LegalHold` | Scope/class, retention clocks, disposition action, owner/version; hold subject, reason, authority, start/release |
| `MigrationRun` / `MigrationItem` | Source identity/version/digest; target identity/version/digest; transform version; status; validation; error; rollback pointer |
| `BackupManifest` / `RestoreRun` | Scope; schema/object/audit checkpoints; encryption/key version; checksums/counts; recovery point; restore validation and authorizer |

### Authority and projection rules

- Before an approved cloud cutover, the local workspace snapshot and local asset
  bytes remain authoritative for existing desktop projects (E-06 and E-07).
  Cloud imports are candidates/shadows until reconciliation succeeds.
- After a per-project cutover, the approved target data plane is authoritative;
  renderer and Electron stores are caches/projections identified by server
  revision. The cutover event and source checkpoint remain durable.
- An asset ID is stable across local/cloud locations. `nomi-local://` may resolve
  a local projection but is never stored as cloud identity (E-09).
- Audit, approval, classification, canonicality, and publication state are
  authoritative server records. They are never inferred from a filename,
  object path, renderer flag, exported file, local event log, or Beads/Babysitter
  state.
- Missing legacy values stay `unknown`/`unverified`; migrations do not fabricate
  provenance, approval, author, cost, or canonical status.

## Canonical versus candidate knowledge enforcement

1. Dropbox originals and Atlas outputs enter as `KnowledgeSource` evidence, not
   as canonical facts. The connector records source locator, source digest,
   observed modification/version, Atlas handoff and validation references, and
   ingestion actor/time.
2. OCR, extraction, summaries, and model-generated statements create
   `KnowledgeFactRevision(canonicality=candidate)`. Candidate content remains
   visibly labeled and cannot satisfy a publication citation.
3. Promotion is a separate authorized command by an approved knowledge owner.
   It creates a new immutable canonical revision and audit event; ingestion,
   retrieval, generation, and ordinary review cannot invoke promotion.
4. A Knowledge Pack is an immutable project-, role-, classification-, and
   campaign-scoped snapshot. It stores exact fact revision IDs/digests and a
   policy snapshot, never a mutable query alone.
5. Public and Investor publication eligibility requires every factual reference
   to resolve to a non-superseded canonical fact revision included in the bound
   Knowledge Pack. Unknown references block publication.
6. A fact becoming superseded, withdrawn, reclassified, or outside its validity
   interval marks affected packs stale and re-evaluates pending publication.
   Whether already-published content triggers alert, unpublish, or re-review is
   unresolved D-10.
7. Retrieval is bounded by organization, project, role, classification, purpose,
   and minimum necessary content. Whole-company knowledge loading is denied.

## Review, approval, and publication enforcement

Publication blocking is represented in data and re-evaluated by the
authoritative service; it is not a UI convention.

### State contracts

- `AssetVersion`: `QUARANTINED -> DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVABLE`
  or `CHANGES_REQUIRED`/`REJECTED`. `PUBLISHED` is represented by a successful
  publication receipt, not by mutating the asset version.
- `Approval`: `APPROVED`, `REJECTED`, `REVOKED`, or `INVALIDATED`. Decisions are
  immutable; revocation/invalidation appends a new record/link.
- `PublicationIntent`: `DRAFT -> BLOCKED | ELIGIBLE -> QUEUED -> PUBLISHING ->
  SUCCEEDED | FAILED | PARTIAL | CANCELLED`. Only the authoritative eligibility
  transaction may enter `ELIGIBLE`; only an eligible intent may enter `QUEUED`.

### Required publication predicate

For publication intent `p`, `eligible(p)` is true only when all conditions are
true in one consistent authoritative read/transaction:

```text
authenticated service and authorized human initiation (owner decision pending)
AND tenant/project/channel/account relationships are valid
AND exact AssetVersion exists, is immutable, and digest matches stored bytes
AND classification permits this channel, provider, account, and destination
AND malware/media/format/brand/language/restricted-term/model-policy QA passes
AND required ReviewRequirement set is frozen in approval_policy_snapshot_id
AND each mandatory requirement has one valid APPROVED decision
AND no blocking REJECTED, REVOKED, INVALIDATED, or CHANGES_REQUIRED decision exists
AND every approval binds this asset version, content digest, brief revision,
    Knowledge Pack revision, and approval-policy snapshot
AND all public/investor factual references are canonical and non-superseded
AND budget/cost and legal-hold/export constraints pass
AND authoritative audit event and transactional outbox command can commit
```

The queue receives only the committed outbox command and intent ID. Before the
external side effect, the publishing worker rechecks that the intent is still
`ELIGIBLE`, has not expired or been cancelled, and its digests/policy snapshot
still match. A changed asset, brief, Knowledge Pack, policy, classification, or
required reviewer set invalidates readiness and requires re-review. A provider
receipt is persisted and reconciled before `SUCCEEDED`.

## Audit and provenance requirements

- Product audit is a dedicated append-only logical ledger, distinct from local
  diagnostic events, Beads task truth, and Babysitter execution journals.
- Record successful and denied security-relevant operations: auth/session
  changes; membership/role/classification changes; source ingestion and
  canonical promotion; provider-secret metadata/use; generation/export jobs;
  asset/version changes; reviews/approvals/invalidation; URL issuance;
  publication/unpublish; policy changes; retention/legal hold; backup/restore;
  migration/rollback; privileged support access.
- Every record includes actor/service, tenant/project/resource, action, outcome,
  policy version and decision reason, correlation/request ID, timestamp, and
  safe field deltas. Audit payloads must not contain secrets or unnecessary
  source/prompt content.
- Provenance attaches to the immutable asset version and includes exact inputs,
  source/Knowledge Pack revisions, provider/model/version, parameters, author or
  agent/job, provider request ID, expected/actual cost, and timestamps. Protected
  prompts may be encrypted payload references with a digest in the record.
- Audit/provenance writes required for an authoritative state transition are in
  the same transaction or transactional outbox. Failure blocks that transition.
- Integrity must be reviewable through immutable storage controls and/or chained
  digests with independent backup. Technology is unresolved D-04.

## Retention, deletion, backup, and recovery

### Retention requirements

- Policy is versioned by content class, jurisdiction/project, record type, and
  lifecycle event. Final durations and owners are unresolved D-08.
- Separate clocks for source evidence, working drafts, generated media,
  published renditions, prompts/provider payloads, approvals/audit, job data,
  access/security logs, backups, and secret metadata.
- Legal hold overrides deletion/lifecycle rules and is itself authorized and
  audited. Holds must propagate to object versions, provenance, approvals, and
  relevant backups according to approved policy.
- Deletion is a durable workflow: mark request, authorize, tombstone, revoke
  URLs, cancel jobs, delete eligible object versions/derivatives, purge caches,
  reconcile provider copies where contractually possible, and emit evidence.
- Tenant/account deletion must not destroy records that policy or legal hold
  requires. Conversely, indefinite retention is not an acceptable unstated
  default.

### Backup and recovery requirements

- Define approved recovery point and recovery time objectives per environment
  and data class before production (D-09).
- Back up authoritative relational/logical records, immutable audit history,
  object versions/manifests, policy/approval snapshots, and encryption metadata
  needed for restoration. Secret values use the secret facility's own approved
  recovery mechanism and are not copied into ordinary backups.
- Encrypt in transit and at rest; separate backup administration from ordinary
  application identities; record key version, schema version, object inventory,
  counts, and checksums in `BackupManifest`.
- A backup is not accepted until a restore drill proves tenant scoping,
  referential integrity, object digest match, approval/audit continuity, and
  application readability. Record restore actor, target isolation, evidence,
  and cleanup.
- Prevent backup restore from overwriting a different organization or silently
  reviving deleted/revoked access. Production restore requires named authority
  and a post-restore security reconciliation.

## Migration and rollback contract

Migration must preserve desktop usability and source authority until each
project passes an explicit cutover gate.

| Phase | Entry and action | Exit evidence | Rollback / failure behavior |
| --- | --- | --- | --- |
| M0 Inventory | Read-only enumerate project records, versions, assets, digests, missing provenance, external workspaces, and unsupported states | Signed/countable inventory; no source writes | Stop; source untouched |
| M1 Mapping | Assign stable target IDs; map local versions to logical entities; record transform version | Deterministic mapping and collision report | Discard target staging records; retain mapping journal |
| M2 Shadow copy | Copy metadata/bytes to isolated target staging; no authority change | Counts, sizes, digests, relationships, classification and candidate/canonical checks reconcile | Delete/quarantine staging copy; source remains authority |
| M3 Dual validation | Read target projection and compare representative/full records; exercise authorization without writes | Zero unexplained reconciliation differences; negative tenant tests; restore evidence | Disable target reads and continue desktop-only |
| M4 Per-project cutover | Freeze or checkpoint source writes, capture final revision/digests, apply delta, record approved cutover | Cutover event, final reconciliation, user-visible desktop/cloud continuity evidence | Restore last-known-good target checkpoint or return authority to source using journaled deltas; revoke target URLs/tokens |
| M5 Post-cutover | Monitor jobs, approvals, assets, audit, cost, and sync behavior for approved window | Owner acceptance and rollback window completion | Trigger project-scoped rollback if thresholds fail |

Required rules:

- Every transform has a version, fixture, idempotency test, forward validation,
  and inverse/compensating procedure. Do not rewrite Dropbox originals or local
  workspace source files as an import convenience.
- Preserve IDs where safe; otherwise persist explicit source-to-target mappings.
  Preserve unknown fields or quarantine the item. Never infer approval,
  canonicality, classification, author, or provenance.
- Migration services are tenant-scoped and cannot publish, approve, promote
  knowledge, or use provider credentials.
- Writes during dual-run require one approved authority/lease and an outbox or
  delta journal; uncontrolled bidirectional last-write-wins is prohibited.
- Schema expansion precedes code that writes new fields. Destructive schema or
  object operations require a tested backup, restore proof, and explicit
  irreversible breakpoint approval.
- Rollback covers schema/data migration, object migration, authorization policy,
  worker release, deployment, and Electron release. It must define trigger,
  authority, last-known-good version, data written since deployment, compensating
  action, and completion evidence.
- Rollback must not delete authoritative source data or erase audit/provenance.
  If an external publication cannot be reversed, record it as an irreversible
  owner-accepted breakpoint before execution, not after failure.

## Misuse-case release checks

| Misuse case | Expected result | Minimum evidence |
| --- | --- | --- |
| Organization A requests Organization B project/version/object/job | Deny without revealing existence; record safe denial | API/data/object-store two-tenant tests |
| Creator changes Brand Kit, role, classification grant, or approval requirement | Deny | Authorization matrix tests |
| Browser/renderer submits `approved=true` or another `organization_id` | Ignore/reject; server derives state/scope | Mass-assignment and IPC hostile-input tests |
| Restricted source is sent to an unapproved provider | Deny before secret resolution or queue side effect | Provider-policy test and no-call assertion |
| Candidate Atlas/OCR fact enters Public or Investor publication | Publication remains `BLOCKED` with fact/revision reason | Knowledge Pack and publication-predicate test |
| Asset bytes/version change after approval | Existing approvals become invalid for readiness | Digest/version invalidation test |
| Worker replays a generation or publication message | One idempotent result; no duplicate spend/publication | Queue replay/concurrency test |
| Provider webhook is forged or replayed | Reject; no job/version transition | Signature/poll identity and replay test |
| Audit write fails during approval/publication | State transition fails closed | Transaction/outbox failure-injection test |
| `nomi-local://` receives traversal, symlink escape, wrong project, or encoded separator | Deny/no bytes | Installed Electron protocol tests |
| Backup from Organization A is restored over Organization B | Deny and alert | Isolated restore authorization test |
| Migration encounters unknown schema/provenance | Quarantine/block item; source remains authoritative | Migration fixture and rollback evidence |

## Recommendations and decision register

All entries are unapproved. `APPROVED` is intentionally absent.

| ID | Status | Owner needed | Proposed direction / alternatives | Rationale and evidence | Downstream blocker |
| --- | --- | --- | --- | --- | --- |
| D-01 | `PROPOSED` | Architecture + Security owner | Adopt the default-deny invariants and logical authorization contract; alternatives must demonstrate equivalent tenant/resource enforcement | E-01, E-04, E-13; prevents desktop-possession semantics becoming cloud auth | Auth/tenancy implementation and release |
| D-02 | `BREAKPOINT` | Architecture owner | Select target data, object, job, and deployment topology after normalized comparison, including but not presuming `Vercel + Supabase` | Acceptance matrix keeps platform choices unapproved | Physical schema, policy engine, backup tooling, deployment |
| D-03 | `BREAKPOINT` | Security + Operations owner | Select identity/session and secret-manager/KMS facilities; no plaintext production fallback | E-05 and provider-secret custody requirements | Provider integration and production auth |
| D-04 | `PROPOSED` | Security + Compliance owner | Select append-only audit integrity/storage mechanism and privileged access process | E-11 is diagnostic and non-blocking | Approval/publication production readiness |
| D-05 | `BREAKPOINT` | Product + Security owner | Approve role scopes, classification grants, separation-of-duty rules, and who administers membership | Product names roles but not administration/clearance semantics | Complete allow/deny matrix and onboarding |
| D-06 | `BREAKPOINT` | Product/Standards owner | Decide who may export each class and whether export requires the same or a distinct approval gate | Classification controls export, but exact ownership is open | Export authorization |
| D-07 | `BREAKPOINT` | Product/Business owner | Decide who may initiate publication, final business approvers by project family, and first-release direct channels | `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:109-115` | Publishing service enablement |
| D-08 | `BREAKPOINT` | Legal/Compliance + Data owner | Approve retention/deletion/legal-hold schedule by class and record type | No current approved schedule evidenced | Lifecycle jobs and customer commitments |
| D-09 | `BREAKPOINT` | Operations + Business owner | Approve RPO/RTO, backup frequency, restore-drill cadence, and recovery authority | Needed before authoritative cloud cutover | Production/data migration readiness |
| D-10 | `BREAKPOINT` | Knowledge + Legal/Product owner | Decide handling of already-published content when a canonical fact is superseded/withdrawn | Canonical/publication rule exists; post-publication response is unspecified | Monitoring, alert, unpublish/re-review workflow |
| D-11 | `BREAKPOINT` | Product + Legal owner | Decide which classifications/templates always require legal review and day-one Brand Kits/templates | `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:109-115` | Approval policy snapshots and pilot |
| D-12 | `PROPOSED` | Desktop + Security owner | Preserve Electron continuity while hardening IPC, testing `nomi-local://`, and deciding main-renderer sandbox compatibility | E-01 through E-03, E-09, E-12 | Account-linked desktop release |
| D-13 | `BREAKPOINT` | Data + Desktop owner | Approve migration cutover tooling, rollback window, write authority, and irreversible steps per project | E-06/E-07 and migration contract | Cloud authority transition |
| D-14 | `BREAKPOINT` | Data/Knowledge owner | Name canonical promotion reviewers and approve Dropbox/Atlas ingestion validation contract | E-14; automatic promotion is prohibited | Knowledge Pack production use |

## Residual risks

1. **Critical until controlled:** no evidenced cloud tenant authorization exists;
   any online implementation that trusts renderer/browser IDs or state can cause
   cross-organization disclosure or mutation.
2. **Critical until controlled:** approval/publication is a future logical
   workflow, not an evidenced authoritative runtime gate. Direct publishing must
   remain disabled until predicate, audit, race, and replay tests pass.
3. **High:** the current desktop credential fallback can persist plaintext keys
   when `safeStorage` is unavailable (E-05). It is incompatible with target
   production custody.
4. **High:** current local provenance is backward-compatible and incomplete
   (E-10). Historical output requires inventory and review, not automatic
   publication eligibility.
5. **High:** Dropbox/Atlas evidence and `everville-core` canonical knowledge have
   intentionally different trust levels. A connector or migration shortcut can
   collapse that boundary unless canonicality is authoritative data.
6. **High:** persistent embedded-browser state and capture/import features ingest
   hostile remote content. Media quarantine, type/digest validation, and source
   provenance are required before cloud sharing or provider use.
7. **High:** backups, retention, legal hold, RPO/RTO, and migration rollback have
   requirements here but no approved owners, durations, or technology.
8. **Medium/High:** local MCP token possession allows powerful project and spend
   actions (E-12). Cloud account linking must not exchange or equate this token
   with a cloud principal/session.
9. **Medium:** wildcard CORS on local assets is an intentional runtime behavior
   (E-09); its safety depends on path resolution and renderer isolation and needs
   explicit installed-app regression coverage.

Until D-01 through D-14 are explicitly resolved by their owners, this artifact
is decision-ready security/data input, not approved platform architecture.
