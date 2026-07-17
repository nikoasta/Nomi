# Higgsfield Provider and Local CLI Boundary

Status: architecture contract for `evmedia-r20.7.1`
Evidence baseline: installed Higgsfield CLI `1.1.13` (`11bfed2733870848f3489335c1bf3d91961ccd4a`)
Authority: the Beads specification is authoritative. The six cloud RFC drafts in this worktree are unapproved and are not inputs to this contract.

## Decision

Higgsfield is a versioned, manifest-driven provider extension. Its public contract describes capabilities and policy, not where they execute. A runtime may use a local Electron adapter, a sidecar, a gateway, or a worker without changing provider IDs, operation IDs, request/result types, or policy semantics.

The first adapter preserves the existing Electron status, catalog, and generation behavior. It accepts only manifest operations with typed, closed schemas and builds an argv array through an injected executor. There is no generic command API and no shell-string API.

The browser adapter never calls the CLI. It returns a typed `unsupported` result. This milestone does not select cloud topology, add cloud credentials, or expose provider credentials to renderer/browser code.

## Live Electron Paths

### Setup, status, and catalog sync

1. `HiggsfieldCliCard` reads the optional desktop bridge and invokes `install`, `login`, or `syncCatalog` ([`src/ui/onboarding/HiggsfieldCliCard.tsx:31`](../../src/ui/onboarding/HiggsfieldCliCard.tsx#L31), [`src/ui/onboarding/HiggsfieldCliCard.tsx:40`](../../src/ui/onboarding/HiggsfieldCliCard.tsx#L40), [`src/ui/onboarding/HiggsfieldCliCard.tsx:53`](../../src/ui/onboarding/HiggsfieldCliCard.tsx#L53), [`src/ui/onboarding/HiggsfieldCliCard.tsx:66`](../../src/ui/onboarding/HiggsfieldCliCard.tsx#L66)).
2. The preload exposes four fixed IPC calls ([`electron/preload.ts:182`](../../electron/preload.ts#L182)). Their renderer-facing types are optional for compatibility with old preloads ([`src/desktop/bridge.ts:628`](../../src/desktop/bridge.ts#L628)).
3. Electron registers fixed handlers for status, install, login, and catalog sync ([`electron/main.ts:528`](../../electron/main.ts#L528)).
4. Status checks the binary, version, redacted account/workspace data, model/workflow counts, and voice count using fixed argv arrays ([`electron/catalog/higgsfieldIpc.ts:84`](../../electron/catalog/higgsfieldIpc.ts#L84), [`electron/catalog/higgsfieldIpc.ts:101`](../../electron/catalog/higgsfieldIpc.ts#L101)). Failed JSON commands currently fall back to typed empty values ([`electron/catalog/higgsfieldIpc.ts:63`](../../electron/catalog/higgsfieldIpc.ts#L63)).
5. Catalog sync lists models and workflows, fetches detail with concurrency four, then mutates the existing catalog ([`electron/catalog/higgsfieldIpc.ts:157`](../../electron/catalog/higgsfieldIpc.ts#L157), [`electron/catalog/higgsfieldIpc.ts:168`](../../electron/catalog/higgsfieldIpc.ts#L168), [`electron/catalog/higgsfieldIpc.ts:177`](../../electron/catalog/higgsfieldIpc.ts#L177)).
6. The current setup path installs with `npm install -g @higgsfield/cli` and logs in with `auth login` ([`electron/catalog/higgsfieldIpc.ts:125`](../../electron/catalog/higgsfieldIpc.ts#L125), [`electron/catalog/higgsfieldIpc.ts:147`](../../electron/catalog/higgsfieldIpc.ts#L147)). Installation remains setup behavior, not a provider-manifest operation.

Current setup risk that the new boundary must not copy: install/login can return raw process text to the renderer ([`electron/catalog/higgsfieldIpc.ts:134`](../../electron/catalog/higgsfieldIpc.ts#L134), [`electron/catalog/higgsfieldIpc.ts:153`](../../electron/catalog/higgsfieldIpc.ts#L153)). New provider results use stable safe errors only.

### Generation

1. A generation run reuses `run.id` as `request.extras.idempotencyKey` across controller retries ([`src/workbench/generationCanvas/runner/generationRunController.ts:124`](../../src/workbench/generationCanvas/runner/generationRunController.ts#L124), [`src/workbench/generationCanvas/runner/generationRunController.ts:137`](../../src/workbench/generationCanvas/runner/generationRunController.ts#L137)).
2. `runWorkbenchTaskByVendor` adds the active project and calls `desktop.tasks.run` ([`src/workbench/api/taskApi.ts:99`](../../src/workbench/api/taskApi.ts#L99)); preload forwards it to `nomi:tasks:run` ([`electron/preload.ts:207`](../../electron/preload.ts#L207)).
3. The main-process IPC guard wraps submission in the in-memory idempotency ledger before calling `runTask` ([`electron/main.ts:629`](../../electron/main.ts#L629)). The ledger replays the same success or rejection for five minutes after settlement, but it is process-local and not durable ([`electron/submissionLedger.ts:1`](../../electron/submissionLedger.ts#L1), [`electron/submissionLedger.ts:19`](../../electron/submissionLedger.ts#L19), [`electron/submissionLedger.ts:66`](../../electron/submissionLedger.ts#L66)).
4. `runTask` preserves the spend grant, recipe cache, catalog model, and task mapping. On a cache miss it consumes the grant before provider execution ([`electron/runtime.ts:442`](../../electron/runtime.ts#L442), [`electron/runtime.ts:470`](../../electron/runtime.ts#L470), [`electron/runtime.ts:481`](../../electron/runtime.ts#L481)).
5. A mapping with `process` routes through `executeProcessOperation`, not HTTP ([`electron/runtime.ts:311`](../../electron/runtime.ts#L311), [`electron/runtime.ts:321`](../../electron/runtime.ts#L321)). The Higgsfield parser selector enters the dedicated branch ([`electron/catalog/processOperation.ts:47`](../../electron/catalog/processOperation.ts#L47), [`electron/catalog/processOperation.ts:149`](../../electron/catalog/processOperation.ts#L149)).
6. Local project assets are materialized into a temporary input directory, then the selected model and request params are converted to argv ([`electron/catalog/processOperation.ts:155`](../../electron/catalog/processOperation.ts#L155), [`electron/catalog/processOperation.ts:163`](../../electron/catalog/processOperation.ts#L163)).
7. Model keys use `generate create`; keys prefixed with `workflow:` use `generate workflow`. Current calls append `--wait --wait-timeout 20m --wait-interval 5s --json` ([`electron/catalog/higgsfieldTransport.ts:134`](../../electron/catalog/higgsfieldTransport.ts#L134)).
8. The CLI output codec extracts job ID, status, failure text, queue data, and media URLs ([`electron/catalog/higgsfieldCodec.ts:114`](../../electron/catalog/higgsfieldCodec.ts#L114)). The process adapter maps these into the existing response shape ([`electron/catalog/processOperation.ts:186`](../../electron/catalog/processOperation.ts#L186)).
9. `buildProfileTaskResult` applies the existing response mapping, status mapping, asset localization, and provenance, then returns the existing `TaskResult` shape ([`electron/runtime.ts:373`](../../electron/runtime.ts#L373), [`electron/runtime.ts:403`](../../electron/runtime.ts#L403), [`electron/runtime.ts:413`](../../electron/runtime.ts#L413), [`electron/runtime.ts:416`](../../electron/runtime.ts#L416)).

Current generation risks that the new boundary must close:

- `buildHiggsfieldEnv` forwards the complete parent environment ([`electron/catalog/higgsfieldCli.ts:28`](../../electron/catalog/higgsfieldCli.ts#L28)).
- The runner accumulates unbounded stdout/stderr and kills only the direct child on timeout ([`electron/catalog/higgsfieldCli.ts:46`](../../electron/catalog/higgsfieldCli.ts#L46)).
- `ProcessResponse` carries `_stdout` and `_stderr`, and the final task keeps the raw response ([`electron/catalog/processOperation.ts:35`](../../electron/catalog/processOperation.ts#L35), [`electron/catalog/processOperation.ts:193`](../../electron/catalog/processOperation.ts#L193), [`electron/runtime.ts:421`](../../electron/runtime.ts#L421)).
- `describeHiggsfieldFailure` can return raw provider text ([`electron/catalog/higgsfieldCodec.ts:130`](../../electron/catalog/higgsfieldCodec.ts#L130)).

These observations describe the live implementation. They are not permission to expose those values through the new adapter.

## Compatibility Invariants

The adapter migration must keep all of the following:

- Provider identity remains `higgsfield-cli` ([`electron/catalog/higgsfieldCli.ts:6`](../../electron/catalog/higgsfieldCli.ts#L6)).
- Synced model identity remains the CLI `job_type`; workflow identity remains `workflow:<job_type>` ([`electron/catalog/higgsfieldIpc.ts:187`](../../electron/catalog/higgsfieldIpc.ts#L187)).
- Mapping IDs remain `mapping-higgsfield-<taskKind>`, and existing task kinds/status mapping remain stable ([`electron/catalog/higgsfieldIpc.ts:210`](../../electron/catalog/higgsfieldIpc.ts#L210), [`electron/catalog/higgsfieldTransport.ts:7`](../../electron/catalog/higgsfieldTransport.ts#L7), [`electron/catalog/higgsfieldTransport.ts:47`](../../electron/catalog/higgsfieldTransport.ts#L47)).
- The four existing setup IPC channels and their response shapes remain compatible.
- Generation still enters through `nomi:tasks:run`, the spend grant, recipe cache, mapping lookup, `TaskResult`, asset localization, and provenance path.
- Model/workflow parameters remain driven by the synced CLI schema. Unknown parameter names are rejected; they are never converted directly into flags.
- Existing model and workflow argv behavior remains covered by the process tests ([`electron/catalog/processOperation.test.ts:107`](../../electron/catalog/processOperation.test.ts#L107), [`electron/catalog/processOperation.test.ts:130`](../../electron/catalog/processOperation.test.ts#L130)). Existing audio routing remains covered by the runtime compatibility test ([`electron/runtime.higgsfield-process.test.ts:53`](../../electron/runtime.higgsfield-process.test.ts#L53)).
- Expected unsupported or policy-denied outcomes return typed results. They do not throw.

## Versioned Contracts

The following types are normative TypeScript shapes. Names may move between files, but fields and semantics are versioned contracts.

```ts
type JsonSchema = Readonly<Record<string, unknown>>

type ProviderExecutionMode = 'immediate' | 'job' | 'stream'
type ProviderExposure = 'allowed' | 'gated' | 'deferred' | 'prohibited'
type ProviderSideEffect = 'none' | 'local-auth' | 'account-state' | 'upload' | 'paid-job' | 'publish-admin'
type ProviderIdempotency = 'none' | 'optional' | 'required'

type ProviderOperationPolicy = {
  exposure: ProviderExposure
  defaultDecision: 'allow' | 'deny'
  requiredClaims: readonly string[]
  sideEffect: ProviderSideEffect
  reasonCode?: string
}

type ProviderOperationManifest = {
  id: HiggsfieldOperationId
  cliPath: readonly string[]
  inputSchema: JsonSchema
  outputSchema: JsonSchema
  execution: ProviderExecutionMode
  idempotency: ProviderIdempotency
  policy: ProviderOperationPolicy
}

type ProviderCapabilityManifest = {
  schemaVersion: 'provider-capabilities.v1'
  providerId: 'higgsfield-cli'
  manifestVersion: string
  source: { product: 'higgsfield'; cliVersion: '1.1.13'; evidenceRevision: string }
  operations: readonly ProviderOperationManifest[]
}
```

`manifestVersion` changes whenever an operation, schema, execution mode, or policy changes. `source.cliVersion` records evidence and is not used as provider identity. Operation IDs never contain model IDs, workflow IDs, runtime names, transport names, or CLI aliases.

All input and output schemas are JSON Schema 2020-12 objects embedded in the manifest. Every schema has a stable `$id`, `additionalProperties: false`, bounded strings/arrays, and no credential or raw-output field. Symbolic schema names in the inventory below map to `$id` values of the form:

```text
hf://schema/1.1.13/<operation-id-without-provider-prefix>/input@1
hf://schema/1.1.13/<operation-id-without-provider-prefix>/output@1
```

Dynamic model/workflow generation schemas are frozen catalog snapshots. A target key must exist in the synced catalog, and parameter names/types/enums must validate against that target's snapshot before argv construction. A caller cannot invent a flag by inventing an object key.

```ts
type ProviderInvokeRequest = {
  requestId: string
  manifestVersion: string
  operationId: HiggsfieldOperationId
  input: unknown
  idempotencyKey?: string
  policyContext: {
    projectId?: string
    claimIds: readonly string[]
    spendGrantId?: string
  }
}

type ProviderInvokeOptions = {
  signal?: AbortSignal
}

type ProviderResult<T> =
  | {
      ok: true
      value: T
      meta: ProviderResultMeta
    }
  | {
      ok: false
      error: {
        code:
          | 'unsupported'
          | 'policy_denied'
          | 'invalid_input'
          | 'not_installed'
          | 'not_authenticated'
          | 'cancelled'
          | 'timed_out'
          | 'output_limit_exceeded'
          | 'provider_rejected'
          | 'ambiguous_submission'
          | 'unavailable'
          | 'internal'
        message: string
        retryable: boolean
      }
      meta: ProviderResultMeta
    }

type ProviderResultMeta = {
  providerId: 'higgsfield-cli'
  manifestVersion: string
  operationId: HiggsfieldOperationId
  requestId: string
  idempotencyKeyHash?: string
  remoteJobId?: string
  remoteState: 'not_started' | 'accepted' | 'terminal' | 'unknown'
  cancellation: 'not_requested' | 'before_start' | 'local_wait_stopped'
}

type GenerationProviderExtension = {
  describe(): Promise<ProviderResult<ProviderCapabilityManifest>>
  invoke(request: ProviderInvokeRequest, options?: ProviderInvokeOptions): Promise<ProviderResult<unknown>>
}
```

`claimIds`, `spendGrantId`, and idempotency metadata are opaque references. They are never provider credentials. Public metadata may include a one-way idempotency-key hash, never the raw key.

### Cancellation

- An already-aborted signal returns `cancelled` with `remoteState: 'not_started'` and does not spawn.
- After spawn, cancellation terminates the local process tree and stops local polling/waiting. The result is `cancelled`, `cancellation: 'local_wait_stopped'`, and `remoteState: 'accepted'` or `'unknown'`.
- Local cancellation never claims that a paid remote Higgsfield job was cancelled. The manifest contains no remote-cancel operation for CLI 1.1.13.
- If a remote job ID was safely parsed before cancellation, it may be returned for later `generate.get`/`generate.wait`. Otherwise it is omitted.
- Cleanup of temporary inputs is mandatory on success, failure, timeout, output limit, and cancellation.

### Idempotency

- Every operation marked `required` rejects a missing or malformed key before spawn.
- The adapter returns stable idempotency metadata but does not claim durability. Durable idempotency belongs to the parent generation gateway/worker scope.
- The current Electron ledger is a compatibility guard only: it is in memory and expires after settlement.
- Read-only operations may retry after transport failure. A create/upload/mutation whose outcome is ambiguous returns `ambiguous_submission` with `retryable: false` and is never automatically retried.
- A known remote job ID is reconciled with a typed get/wait operation. Lack of an ID does not authorize a second paid submission.

## Safe Local Executor

```ts
type OutputLimits = {
  stdoutBytes: 1_048_576
  stderrBytes: 262_144
  combinedBytes: 1_310_720
  jsonDepth: 32
  arrayItems: 10_000
  stringBytes: 65_536
  artifactCount: 100
}

type SafeProcessEnvironment = Readonly<Record<string, string>>

type HiggsfieldCliExecutor = {
  execute(input: {
    argv: readonly string[]
    timeoutMs: number
    signal?: AbortSignal
    limits: OutputLimits
    env: SafeProcessEnvironment
  }): Promise<BoundedCliResult>
}
```

Executor rules:

- Resolve the executable before invocation; do not return its absolute path.
- Spawn with `shell: false`, a literal argv array, hidden windows, and process-tree termination support. Never build a command string.
- The adapter owns a switch/table from operation ID to one argv builder. There is no `run(command)`, `args: string[]` request field, executable override, or arbitrary subcommand pass-through.
- Always add `--json` internally. Callers cannot set global flags.
- Validate operation inputs before materializing files. Model/workflow keys must be catalog identities, must not start with `-`, and cannot contain control characters. File inputs are project-scoped asset references materialized by trusted runtime code, not arbitrary caller paths.
- Enforce byte limits while streaming. On any limit, terminate the local process tree and return `output_limit_exceeded`; do not parse or expose partial output.
- Parse bounded JSON into an operation-specific output schema. Retained diagnostic tails are bounded, redacted, local-only, and absent from `ProviderResult`.
- Construct environment from an allowlist. On POSIX it may include `PATH`, `HOME`, `TMPDIR`, `LANG`, `LC_ALL`, `SSL_CERT_FILE`, and `SSL_CERT_DIR`; on Windows it may include `PATH`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP`, and `TMP`. Include only defined values.
- Do not forward the parent environment wholesale. Strip provider/API keys, tokens, cookies, authorization headers, proxy URLs with credentials, Electron secrets, cloud credentials, and `HIGGSFIELD_BIN`/`HIGGS_BIN` after executable resolution.
- OAuth state remains in the official CLI's local credential store. The adapter never reads, prints, returns, or logs that credential file.

Stable errors contain a code and a short curated message. They never contain stdout, stderr, a raw `Error`, stack, argv, environment, home/temp path, credential, token, signed URL query, or provider response body.

## CLI 1.1.13 Capability Inventory

Policy meanings:

- `allowed`: callable by the local adapter with ordinary schema and runtime checks.
- `gated`: present and typed, but default-denied unless all listed approval claims are supplied.
- `deferred`: manifest-visible and typed; this milestone returns `unsupported` without spawning.
- `prohibited`: always returns `policy_denied` and has no argv builder.

Schema notation is `Input -> Output`. Every named schema is a closed, bounded JSON Schema in the manifest.

### Runtime, auth, account, and workspace

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.system.version` | `version` | immediate | allowed | `Empty -> VersionInfo` |
| `higgsfield.auth.login` | `auth login` | stream | gated: `desktop.setup.interactive` | `AuthLoginInput -> RedactedAuthStatus` |
| `higgsfield.auth.logout` | `auth logout` | immediate | gated: `desktop.setup.interactive` | `Empty -> RedactedAuthStatus` |
| `higgsfield.auth.token` | `auth token` | immediate | prohibited: credential disclosure | `Empty -> Never` |
| `higgsfield.account.status` | `account status` | immediate | allowed, redacted | `Empty -> RedactedAccountStatus` |
| `higgsfield.account.transactions` | `account transactions` | immediate | deferred: financial history | `CursorPageInput -> CreditTransactionPage` |
| `higgsfield.workspace.list` | `workspace list` | immediate | deferred: account inventory | `Empty -> WorkspaceSummaryList` |
| `higgsfield.workspace.set` | `workspace set` | immediate | gated: `workspace.select` | `WorkspaceIdInput -> WorkspaceStatus` |
| `higgsfield.workspace.status` | `workspace status` | immediate | allowed, redacted | `Empty -> WorkspaceStatus` |
| `higgsfield.workspace.unset` | `workspace unset` | immediate | gated: `workspace.select` | `Empty -> WorkspaceStatus` |

`RedactedAccountStatus` may contain plan and numeric credit balance. It does not contain email, token, credential path, or raw response.

### Catalog, uploads, and generation

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.model.list` | `model list` | immediate | allowed | `ModelListInput -> ModelSummaryList` |
| `higgsfield.model.get` | `model get` | immediate | allowed | `ModelKeyInput -> ModelCapability` |
| `higgsfield.workflow.list` | `workflow list` | immediate | allowed | `Empty -> WorkflowSummaryList` |
| `higgsfield.workflow.get` | `workflow get` | immediate | allowed | `WorkflowKeyInput -> WorkflowCapability` |
| `higgsfield.voices.list` | `voices list` | immediate | allowed | `CursorPageInput -> VoicePage` |
| `higgsfield.voices.get` | `voices get` | immediate | allowed | `VoiceIdInput -> Voice` |
| `higgsfield.upload.list` | `upload list` | immediate | deferred: remote media inventory | `UploadListInput -> UploadPage` |
| `higgsfield.upload.create` | `upload create` | job | gated: `asset.upload`; idempotency required | `ProjectAssetInput -> UploadReceipt` |
| `higgsfield.generate.cost` | `generate cost` | immediate | gated: `generation.estimate` | `CatalogGenerationInput -> CostEstimate` |
| `higgsfield.generate.create` | `generate create` | job | gated: `generation.submit` plus spend grant; idempotency required | `CatalogModelGenerationInput -> GenerationReceipt` |
| `higgsfield.generate.workflow` | `generate workflow` | job | gated: `generation.submit` plus spend grant; idempotency required | `CatalogWorkflowGenerationInput -> GenerationReceipt` |
| `higgsfield.generate.get` | `generate get` | immediate | gated: `generation.read` | `GenerationIdInput -> GenerationStatus` |
| `higgsfield.generate.list` | `generate list` | immediate | deferred: account job history | `GenerationListInput -> GenerationPage` |
| `higgsfield.generate.wait` | `generate wait` | stream | gated: `generation.read` | `GenerationWaitInput -> GenerationStatus` |

`CatalogModelGenerationInput` and `CatalogWorkflowGenerationInput` validate against the selected catalog snapshot. Local path auto-upload is disabled at this boundary; media enters as trusted project asset references or already-authorized upload IDs.

### Soul ID

All Soul operations are default-denied pending explicit Soul product and data-retention approval.

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.soul-id.create` | `soul-id create` | job | gated: `soul.manage`; idempotency required | `SoulCreateInput -> SoulReceipt` |
| `higgsfield.soul-id.get` | `soul-id get` | immediate | gated: `soul.read` | `SoulIdInput -> SoulStatus` |
| `higgsfield.soul-id.list` | `soul-id list` | immediate | gated: `soul.read` | `SoulListInput -> SoulPage` |
| `higgsfield.soul-id.wait` | `soul-id wait` | stream | gated: `soul.read` | `SoulWaitInput -> SoulStatus` |

### Marketing Studio

All Marketing Studio operations are default-denied pending explicit product, brand-data, cost, and retention approval.

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.marketing-studio.ad-formats.list` | `marketing-studio ad-formats list` | immediate | gated: `marketing.read` | `AdFormatListInput -> AdFormatList` |
| `higgsfield.marketing-studio.ad-references.create` | `marketing-studio ad-references create` | job | gated: `marketing.manage`; idempotency required | `AdReferenceCreateInput -> AdReferenceReceipt` |
| `higgsfield.marketing-studio.ad-references.get` | `marketing-studio ad-references get` | immediate | gated: `marketing.read` | `AdReferenceIdInput -> AdReference` |
| `higgsfield.marketing-studio.ad-references.list` | `marketing-studio ad-references list` | immediate | gated: `marketing.read` | `CursorPageInput -> AdReferencePage` |
| `higgsfield.marketing-studio.avatars.create` | `marketing-studio avatars create` | job | gated: `marketing.manage`; idempotency required | `MarketingAvatarCreateInput -> MarketingAvatarReceipt` |
| `higgsfield.marketing-studio.avatars.list` | `marketing-studio avatars list` | immediate | gated: `marketing.read` | `PageSizeInput -> MarketingAvatarPage` |
| `higgsfield.marketing-studio.brand-kits.fetch` | `marketing-studio brand-kits fetch` | job | gated: `marketing.manage`; idempotency required | `BrandKitFetchInput -> BrandKitReceipt` |
| `higgsfield.marketing-studio.brand-kits.get` | `marketing-studio brand-kits get` | immediate | gated: `marketing.read` | `BrandKitIdInput -> BrandKit` |
| `higgsfield.marketing-studio.brand-kits.list` | `marketing-studio brand-kits list` | immediate | gated: `marketing.read` | `CursorPageInput -> BrandKitPage` |
| `higgsfield.marketing-studio.dtc-ads.generate` | `marketing-studio dtc-ads generate` | job | gated: `marketing.generate` plus spend grant; idempotency required | `DtcAdGenerationInput -> GenerationReceipt` |
| `higgsfield.marketing-studio.hooks.list` | `marketing-studio hooks list` | immediate | gated: `marketing.read` | `SearchPageInput -> HookPage` |
| `higgsfield.marketing-studio.products.create` | `marketing-studio products create` | job | gated: `marketing.manage`; idempotency required | `MarketingProductCreateInput -> MarketingProductReceipt` |
| `higgsfield.marketing-studio.products.fetch` | `marketing-studio products fetch` | job | gated: `marketing.manage`; idempotency required | `UrlFetchInput -> MarketingProductReceipt` |
| `higgsfield.marketing-studio.products.list` | `marketing-studio products list` | immediate | gated: `marketing.read` | `LimitInput -> MarketingProductPage` |
| `higgsfield.marketing-studio.settings.list` | `marketing-studio settings list` | immediate | gated: `marketing.read` | `SearchPageInput -> MarketingSettingPage` |
| `higgsfield.marketing-studio.webproducts.create` | `marketing-studio webproducts create` | job | gated: `marketing.manage`; idempotency required | `WebProductCreateInput -> WebProductReceipt` |
| `higgsfield.marketing-studio.webproducts.fetch` | `marketing-studio webproducts fetch` | job | gated: `marketing.manage`; idempotency required | `UrlFetchInput -> WebProductReceipt` |
| `higgsfield.marketing-studio.webproducts.list` | `marketing-studio webproducts list` | immediate | gated: `marketing.read` | `LimitInput -> WebProductPage` |

Deprecated Marketing Studio flags are excluded from input schemas even if CLI help still displays them. `--from-file` is also excluded because accepting arbitrary files would bypass typed schema validation.

### Product pipelines

Both product pipelines are default-denied pending explicit product, cost, and asset-use approval.

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.product-photoshoot.create` | `product-photoshoot create` | job | gated: `product-pipeline.generate` plus spend grant; idempotency required | `ProductPhotoshootInput -> ProductPhotoshootReceipt` |
| `higgsfield.marketplace-cards.create` | `marketplace-cards create` | job | gated: `product-pipeline.generate` plus spend grant; idempotency required | `MarketplaceCardsInput -> MarketplaceCardsReceipt` |

### Websites

Website read-only inventory is deferred because it is outside the generation provider scope. Repository access, database access, secrets, deployment, address changes, contests, and publication are prohibited.

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.website.list` | `website list` | immediate | deferred | `Empty -> WebsiteSummaryList` |
| `higgsfield.website.status` | `website status` | immediate | deferred | `WebsiteIdInput -> WebsiteStatus` |
| `higgsfield.website.create` | `website create` | job | prohibited: repository administration | `WebsiteCreateInput -> Never` |
| `higgsfield.website.deploy` | `website deploy` | job | prohibited: direct deployment | `WebsiteIdInput -> Never` |
| `higgsfield.website.contest` | `website contest` | job | prohibited: direct publishing | `WebsiteContestInput -> Never` |
| `higgsfield.website.publish` | `website publish` | job | prohibited: direct publishing | `WebsiteIdInput -> Never` |
| `higgsfield.website.rename` | `website rename` | job | prohibited: deployment/address mutation | `WebsiteRenameInput -> Never` |
| `higgsfield.website.repo-access` | `website repo-access` | immediate | prohibited: scoped credential disclosure | `WebsiteIdInput -> Never` |
| `higgsfield.website.db.tables` | `website db tables` | immediate | prohibited: database administration | `WebsiteIdInput -> Never` |
| `higgsfield.website.db.schema` | `website db schema` | immediate | prohibited: database administration | `WebsiteTableInput -> Never` |
| `higgsfield.website.db.rows` | `website db rows` | immediate | prohibited: database data access | `WebsiteRowsInput -> Never` |
| `higgsfield.website.db.query` | `website db query` | immediate | prohibited: arbitrary database query | `WebsiteQueryInput -> Never` |
| `higgsfield.website.secrets.list` | `website secrets list` | immediate | prohibited: secret administration | `WebsiteIdInput -> Never` |
| `higgsfield.website.secrets.set` | `website secrets set` | immediate | prohibited: secret administration | `WebsiteSecretSetInput -> Never` |
| `higgsfield.website.secrets.delete` | `website secrets delete` | immediate | prohibited: secret administration | `WebsiteSecretDeleteInput -> Never` |

Prohibited operations are represented so clients can explain policy accurately, but the local adapter has no argv builders for them.

### Games

| Stable operation ID | CLI path | Mode | Policy | Schema |
| --- | --- | --- | --- | --- |
| `higgsfield.game.deploy` | `game deploy` | job | prohibited: direct deployment | `GameDeployInput -> Never` |
| `higgsfield.game.publish` | `game publish` | job | prohibited: direct publishing | `GamePublishInput -> Never` |

CLI `help`, aliases (`higgs`, `hf`, and command aliases), global flags, and future unknown CLI/MCP commands are not provider operations. A future capability is unavailable until a reviewed manifest version adds its stable ID, closed schemas, execution mode, and policy.

## Browser Adapter

The browser adapter implements the same extension interface but never imports Electron, reads environment variables, accepts credentials, or performs network fallback.

- `describe()` may return the reviewed manifest so UI can explain capabilities and policy.
- Every `invoke()` returns `{ ok: false, error: { code: 'unsupported', retryable: false } }` with safe metadata.
- `unsupported` is not an empty catalog, provider failure, or permission success.
- No operation is silently rerouted to a browser-held API key or a newly selected cloud endpoint.

## Required Verification

Implementation of this boundary must be test-first and observed RED before implementation. Minimum coverage:

1. Manifest conformance: provider/version identity, all 65 operation IDs above, unique IDs, closed input/output schemas, execution modes, policy, and no unknown operation acceptance.
2. Shared adapter contract: local and browser adapters return the same typed success/error envelope; expected unsupported/denied failures do not throw.
3. Compatibility: exact existing provider/model/workflow identities, setup IPC shapes, model/workflow argv, status mapping, task result, assets, provenance, spend grant, and idempotency-key pass-through.
4. Argv injection: reject unknown operations, unknown model params, leading-dash IDs, control characters, executable overrides, global flags, `--from-file`, arbitrary paths, and shell metacharacter attempts. Assert the executor receives an argv array only.
5. Hostile output: enforce every byte/shape limit and redact tokens, authorization headers, signed query values, emails, home/temp paths, stacks, raw stderr/stdout, and nested hostile JSON.
6. Safe environment: assert only the platform allowlist is forwarded and representative cloud/provider secret variables are absent.
7. Cancellation: abort before spawn, terminate the process tree during wait, clean temporary inputs, preserve a safely known remote job ID, and report only local wait cancellation.
8. Idempotency: require stable keys for side effects, replay same-key local submissions, never auto-retry ambiguous creates, and document that durable reconciliation remains parent scope.
9. Policy: `auth token`, arbitrary pass-through, Soul/Marketing/product operations without approvals, website/game publishing, repository/database/secret administration, and all future unknown operations fail before executor invocation.

This document freezes the reversible provider boundary. It does not approve the gated surfaces, make the current in-memory ledger durable, select a cloud runtime, or change the six unapproved RFC drafts.
