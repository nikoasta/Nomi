# Platform Asset Records and Runtime Resolution Boundary

Status: implementation contract for `evmedia-r20.8.1`

Authority: the Beads child specification is authoritative. The six cloud RFC drafts in this worktree are frozen, unapproved, and are not architecture inputs to this contract.

## Decision

Everville Media Platform has two separate asset surfaces:

1. `PlatformClient.assets` remains the legacy renderer compatibility facade. Its `WorkbenchAssetDto`, path-derived list IDs, `data.relativePath`, `data.absolutePath`, and `data.url` behavior remain available to existing Electron consumers.
2. `PlatformClient.assetRecords` is the new vendor-neutral domain surface. It exposes stable `Asset` and immutable `AssetVersion` records plus an explicit runtime resolution operation. A domain record never contains a runtime or storage locator.

The first adapter is an Electron projection over the existing project asset directory and adjacent `.meta` sidecars. New imports may add a versioned platform identity envelope to the sidecar. Existing bytes, paths, legacy metadata, and sidecars are not rewritten. A sidecar without that envelope remains available through `PlatformClient.assets` only; it is not assigned invented platform identity.

The browser adapter returns typed `UNSUPPORTED_CAPABILITY` results for asset-record imports, listing, and resolution until an approved browser storage adapter exists. This child does not select a cloud, object store, database, authentication vendor, signed-delivery service, bucket layout, or migration mechanism.

## Live Runtime Call Paths

### File import

1. Renderer code calls `importWorkbenchLocalAssetFile` in [`src/workbench/api/assetUploadApi.ts`](../../src/workbench/api/assetUploadApi.ts). It obtains the active `projectId`, reads the `File` into an `ArrayBuffer`, and calls `getPlatformClient().assets.importFile`.
2. `getPlatformClient` and `adaptDesktopBridge` in [`src/platform/client.ts`](../../src/platform/client.ts) select the Electron adapter and pass the legacy request to the desktop bridge without changing its payload.
3. `createElectronPlatformClient` in [`src/platform/electronPlatformClient.ts`](../../src/platform/electronPlatformClient.ts) invokes `bridge.assets.importFile` and wraps rejection in `PlatformResult`.
4. `assets.importFile` in [`electron/preload.ts`](../../electron/preload.ts) invokes the fixed `nomi:assets:import-file` IPC channel. Its renderer type is declared in [`src/desktop/bridge.ts`](../../src/desktop/bridge.ts).
5. The handler in [`electron/main.ts`](../../electron/main.ts) calls `importLocalFile` in [`electron/assets/localFileImport.ts`](../../electron/assets/localFileImport.ts).
6. `importLocalFile` validates and converts the byte payload, then calls `writeAsset` in [`electron/assets/projectAssetStore.ts`](../../electron/assets/projectAssetStore.ts).
7. `writeAsset` chooses a unique dated path, writes bytes, writes legacy sidecar metadata, broadcasts `nomi:assets:updated`, and returns a DTO whose ID is a new random UUID and whose URL comes from `localAssetUrl` in [`electron/assets/assetPaths.ts`](../../electron/assets/assetPaths.ts).

The asset-record adapter must enter this same byte-write path. It adds the platform identity envelope at the sidecar boundary and projects the resulting record. It does not replace the legacy import call path or its DTO.

### Remote and data URL import

1. `importWorkbenchRemoteAssetUrl` in [`src/workbench/api/assetUploadApi.ts`](../../src/workbench/api/assetUploadApi.ts) calls `PlatformClient.assets.importRemoteUrl`.
2. `adaptDesktopBridge`, `createElectronPlatformClient`, preload, and the `nomi:assets:import-remote-url` handler forward the request to `importRemoteAsset` in [`electron/assets/projectAssetStore.ts`](../../electron/assets/projectAssetStore.ts).
3. `importRemoteAsset` accepts an existing `nomi-local://` URL as a compatibility DTO, decodes `data:` input, or fetches HTTP(S) through `hardenedFetch`. New bytes converge on `writeAsset`.

For `assetRecords.importRemoteUrl`, the input URL is transient. The adapter authorizes before fetch, uses the existing hardened fetch limits, computes integrity from received bytes, and never writes the source URL into the platform domain envelope. The legacy sidecar may retain compatibility metadata such as `originalUrl`; that metadata is not a trusted `AssetRecord` or `AssetVersionRecord` field.

### Sidecar identity and version

Current `writeAsset` returns `asset-<random UUID>`, but `listProjectAssets` later reconstructs `asset-<SHA-1(projectId:relativePath)>` through `stableAssetId`. A rename or move therefore changes list identity, and write identity cannot be recovered from a later list.

The new envelope closes that drift for new asset-record imports:

- `electron/assets/assetIdentity.ts` creates opaque `AssetId` and `AssetVersionId` values independent of path, name, MIME, digest, organization, project, and runtime.
- The envelope contains the validated domain bundle and a one-way idempotency hash. It contains no file path or URL. Physical association comes only from adjacency to the asset file in the local adapter.
- `writeAssetSidecarMeta` persists the envelope together with legacy sidecar fields. `readAssetSidecarMeta` treats it as untrusted JSON and validates it before projection.
- A move that carries both bytes and sidecar preserves identity. A missing, malformed, scope-mismatched, or integrity-mismatched envelope is never repaired by inference.
- Existing sidecars without an envelope stay on the legacy path. Backfill, migration, reconciliation, and assigning reviewed historical identity belong to parent `evmedia-r20.8`.

### List

1. Existing global asset-library loading uses `useAllProjectAssets` in [`src/workbench/assets/useAllProjectAssets.ts`](../../src/workbench/assets/useAllProjectAssets.ts).
2. It obtains project IDs from `desktop.projects`, calls `desktop.assets.list` for every project, and maps each `DesktopAssetDto` through `assetRefFromDesktopAsset`.
3. Preload invokes `nomi:assets:list`; the handler calls `listProjectAssets` in [`electron/assets/projectAssetStore.ts`](../../electron/assets/projectAssetStore.ts).
4. `listProjectAssets` recursively scans project `assets`, ignores `.meta` files, reads legacy sidecar metadata, and currently derives DTO IDs from the project-relative path.

That exact legacy list remains unchanged. `assetRecords.list` uses the same local scan but returns only successfully validated platform envelopes authorized for the requested organization/project scope. It does not surface malformed envelopes, legacy-only files, absolute paths, relative paths, or `nomi-local://` URLs as domain facts.

### Runtime resolve and display

1. A consumer calls `PlatformClient.assetRecords.resolve` with organization, project, asset, version, and purpose.
2. The Electron adapter authorizes `asset.read`, locates the adjacent identity envelope within the requested project, revalidates scope and byte integrity, and returns a transient `AssetResolution`.
3. For a validated, non-quarantined local version, the Electron locator may be `nomi-local://asset/<encoded-project>/<encoded-relative-path>`, created by `localAssetUrl` in [`electron/assets/assetPaths.ts`](../../electron/assets/assetPaths.ts). The URL exists only in the method result.
4. Electron's `registerLocalProtocol` in [`electron/protocol/localProtocol.ts`](../../electron/protocol/localProtocol.ts) resolves the URL with `resolveProjectRelativePath` and serves bytes through `net.fetch`.
5. Existing display remains on the compatibility path: `assetRefFromDesktopAsset` creates `AssetRef.renderUrl`; `AssetLibraryPanel` in [`src/workbench/assets/AssetLibraryPanel.tsx`](../../src/workbench/assets/AssetLibraryPanel.tsx) filters the records; `AssetThumb`/`AssetTile` in [`src/workbench/assets/AssetTile.tsx`](../../src/workbench/assets/AssetTile.tsx) render `asset.renderUrl`.

No domain record may be reconstructed from an `AssetRef`, a `WorkbenchAssetDto.id`, a `nomi-local://` URL, or a path. Runtime resolution is one-way: validated identity and scope may produce a locator, but a locator never establishes identity or trust.

## Compatibility Invariants

- `PlatformClient.assets`, its three capability IDs, request/response types, error mapping, and existing browser unsupported behavior remain intact.
- `src/workbench/api/assetUploadApi.ts`, `src/workbench/assets/useAllProjectAssets.ts`, `AssetRef`, `AssetLibraryPanel`, and `AssetTile` require no migration in this child.
- Existing preload channels and `DesktopBridge.assets` shapes remain intact; no new generic IPC or arbitrary filesystem method is added.
- Existing local imports still produce bytes under the current `assets/generated` or `assets/imported` dated paths and return a usable `nomi-local://` URL.
- Existing capture privacy behavior in `sanitizeAssetMetaForKind` remains intact.
- Legacy files and sidecars remain byte-for-byte unchanged by listing or resolution. A legacy-only item remains visible through the legacy facade and absent from `assetRecords`.
- New identity is stable across list operations and path relocation when the bytes and identity sidecar move together.
- Additional sidecar fields are backward-compatible data. Legacy DTO consumers may ignore them and continue using their current fields.
- Expected unsupported, invalid, denied, conflict, quarantine, and not-found outcomes use `PlatformResult`; they do not expose raw thrown errors.

## Normative Domain Contracts

The following TypeScript shapes are normative. Implementations may use branded aliases internally, but serialized field names and meanings are versioned.

```ts
type AssetId = string & { readonly __brand: 'AssetId' }
type AssetVersionId = string & { readonly __brand: 'AssetVersionId' }

type AssetScope = {
  organizationId: string
  projectId: string
}

type AssetClassification =
  | 'unknown'
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'

type AssetRecord = {
  schemaVersion: 'asset.v1'
  id: AssetId
  scope: AssetScope
  createdAt: string
  createdByPrincipalId: string
}

type AssetIntegrity = {
  algorithm: 'sha256'
  digest: string
  sizeBytes: number
  mediaType: string
}

type AssetValidation =
  | { state: 'pending'; reasonCodes: readonly string[] }
  | { state: 'validated'; validatedAt: string; validator: 'electron-local-v1'; reasonCodes: readonly [] }
  | { state: 'quarantined'; validatedAt: string; validator: 'electron-local-v1'; reasonCodes: readonly string[] }
  | { state: 'rejected'; validatedAt: string; validator: 'electron-local-v1'; reasonCodes: readonly string[] }
  | { state: 'legacy-unverified'; reasonCodes: readonly ['LEGACY_FACTS_UNKNOWN'] }

type ImportedProvenance = {
  kind: 'imported'
  method: 'file' | 'remote' | 'data' | 'capture'
  recordedAt: string
  actorPrincipalId: string
  originalName: string | null
}

type GeneratedProvenance = {
  kind: 'generated'
  recordedAt: string
  actorPrincipalId: string
  providerId: string
  modelId: string
  operationId: string | null
  providerRequestId: string | null
  promptRef: string | null
  promptDigest: string | null
}

type DerivedProvenance = {
  kind: 'derived'
  recordedAt: string
  actorPrincipalId: string
  operation: string
  sourceVersionIds: readonly AssetVersionId[]
}

type LegacyUnverifiedProvenance = {
  kind: 'legacy-unverified'
  recordedAt: string
  actorPrincipalId: null
  unknownFacts: readonly string[]
}

type AssetProvenance =
  | ImportedProvenance
  | GeneratedProvenance
  | DerivedProvenance
  | LegacyUnverifiedProvenance

type AssetVersionRecord = {
  schemaVersion: 'asset-version.v1'
  id: AssetVersionId
  assetId: AssetId
  scope: AssetScope
  predecessorVersionId: AssetVersionId | null
  derivedFromVersionIds: readonly AssetVersionId[]
  integrity: AssetIntegrity
  classification: AssetClassification
  validation: AssetValidation
  provenance: AssetProvenance
  createdAt: string
  createdByPrincipalId: string | null
}

type AssetRecordBundle = {
  asset: AssetRecord
  version: AssetVersionRecord
}
```

### Identity and immutability

- New IDs are generated from a cryptographically strong random source and serialized as `ast_<UUID>` and `av_<UUID>`. The prefix indicates type only; the remaining value encodes no path, scope, timestamp, digest, provider, or user fact.
- Parsers accept only the canonical generated form. They reject empty/oversized values, traversal tokens, slash or backslash, URL syntax, percent encoding, whitespace, NUL, and all control characters.
- `Asset.id` is stable for the logical asset. `AssetVersion.id` identifies one immutable byte sequence and metadata snapshot.
- Changing bytes, canonical MIME, classification, provenance, predecessor, or derivation lineage creates a new `AssetVersion`; it never mutates an existing version.
- `AssetVersion.assetId` and `AssetVersion.scope` must exactly match the owning asset. Scope never comes from a path, locator, renderer claim, or provider response.
- `predecessorVersionId` is null for the first version and otherwise names an earlier version of the same asset and scope. Cross-asset predecessors are invalid.
- `derivedFromVersionIds` may reference versions of other assets only within the same organization and project. Entries are unique, cannot include the new version, and cannot create a direct or transitive lineage cycle.
- A derived provenance record's `sourceVersionIds` must equal `derivedFromVersionIds` after canonical ordering. Other provenance kinds do not claim derivation lineage they cannot prove.

### Integrity and MIME

- SHA-256 is lowercase hexadecimal with exactly 64 characters. It is computed from the stored bytes by trusted adapter code.
- `sizeBytes` is the exact non-negative safe-integer byte count of the same bytes.
- `mediaType` is a lowercase canonical MIME type without parameters. It is obtained from trusted byte inspection where supported, with a conservative `application/octet-stream` fallback.
- File extension, caller `contentType`, HTTP `Content-Type`, legacy sidecar values, and provider output are claims only. A conflicting non-empty claim is rejected or quarantined; it never overwrites computed integrity.
- Read/list/resolve recompute or otherwise securely verify digest, size, and MIME before returning `validated`. Any mismatch returns a typed quarantine/integrity error and no locator.

### Provenance truthfulness

- Provenance states only facts observed by this adapter or supplied through an already trusted platform contract. Unknown facts remain null, absent, or explicitly listed in `unknownFacts`.
- `imported` does not become `generated` because the file is under a generated directory. `generated` is used only when provider/model evidence is available. `derived` requires verified source version IDs. Unprovable historical facts use `legacy-unverified` only during an explicit future migration.
- `providerId`, `modelId`, and `operationId` are stable external identities, not localized display labels.
- `promptRef` is an opaque reference to separately authorized content. `promptDigest` may be a one-way canonical digest. Raw prompts, especially secret-bearing prompts, are forbidden.
- Raw provider responses, headers, cookies, credentials, bearer values, signed query strings, stack traces, and arbitrary diagnostic text are forbidden.
- Remote source URLs are transient import inputs. They are not provenance fields. A future reviewed provenance source may use a safe opaque reference, never a signed or credential-bearing URL.

### Validation and quarantine

- Callers cannot request `validated`, choose the validator, provide trusted timestamps, supply a computed digest/size/MIME, or set IDs. Such fields in an import payload are forged trusted fields and cause `INVALID_ARGUMENT` before IO.
- `pending` cannot be resolved. `quarantined`, `rejected`, and `legacy-unverified` cannot produce a display, download, or provider-input locator.
- Reason codes are stable, bounded identifiers, for example `DIGEST_MISMATCH`, `SIZE_MISMATCH`, `MIME_MISMATCH`, `SCOPE_MISMATCH`, `MALFORMED_IDENTITY`, `LINEAGE_CYCLE`, and `FORBIDDEN_TRANSIENT_FIELD`. They do not contain raw exception text.
- A malformed identity envelope does not fall back to trusting the path-derived DTO ID. It is omitted from `assetRecords.list`, returns a typed error when addressed, and remains available only as an untrusted legacy DTO when applicable.

## Runtime Resolution Contract

```ts
type AssetResolutionPurpose = 'display' | 'download' | 'provider-input'

type AssetResolveRequest = AssetScope & {
  assetId: AssetId
  versionId: AssetVersionId
  purpose: AssetResolutionPurpose
}

type AssetRuntimeLocator = {
  kind: 'runtime-url'
  runtime: 'electron'
  url: string
  expiresAt: string | null
}

type AssetResolution = {
  schemaVersion: 'asset-resolution.v1'
  assetId: AssetId
  versionId: AssetVersionId
  scope: AssetScope
  purpose: AssetResolutionPurpose
  integrity: AssetIntegrity
  locator: AssetRuntimeLocator
}
```

- `AssetResolution` is an ephemeral method result. It is never accepted by a record constructor and is never nested in an `AssetRecord`, `AssetVersionRecord`, provenance object, sidecar identity envelope, project snapshot, canvas state, event, cache, or audit record.
- The Electron adapter may return `nomi-local://` only after identity, scope, authorization, integrity, and quarantine checks pass. A future runtime may return another short-lived locator without changing record identity.
- The resolver does not return absolute paths, relative paths, file URLs, bucket/object keys, credentials, provider URLs, or raw bytes.
- `provider-input` resolution is not permission to disclose a local URL to a provider. Existing trusted runtime localization remains responsible for materializing provider-reachable input. The browser adapter remains unsupported in this child.
- Locators are purpose-bound. A locator produced for `display` cannot be asserted as authorization for download, provider upload, publication, or another project.

## PlatformClient Service

The service is distinct from `assets` and uses four new capabilities:

```ts
type AssetRecordCapability =
  | 'asset-records.list'
  | 'asset-records.import-file'
  | 'asset-records.import-remote-url'
  | 'asset-records.resolve'

type AssetRecordListRequest = AssetScope & {
  cursor?: string | null
  limit?: number
}

type AssetRecordImportFileRequest = AssetScope & {
  fileName: string
  claimedMediaType?: string
  bytes: ArrayBuffer
  classification: AssetClassification
  idempotencyKey: string
}

type AssetRecordImportRemoteUrlRequest = AssetScope & {
  url: string
  fileName?: string
  claimedMediaType?: string
  classification: AssetClassification
  idempotencyKey: string
}

type PlatformAssetRecords = {
  list(request: AssetRecordListRequest): Promise<PlatformResult<{
    items: AssetRecordBundle[]
    cursor: string | null
  }>>
  importFile(request: AssetRecordImportFileRequest): Promise<PlatformResult<AssetRecordBundle>>
  importRemoteUrl(request: AssetRecordImportRemoteUrlRequest): Promise<PlatformResult<AssetRecordBundle>>
  resolve(request: AssetResolveRequest): Promise<PlatformResult<AssetResolution>>
}

type PlatformClient = {
  // Existing members remain unchanged.
  readonly assets: PlatformAssets
  readonly assetRecords: PlatformAssetRecords
}
```

The Electron adapter derives file imports as `imported/file` and remote URL imports as `imported/remote`. It derives actor and organization from the authenticated local session, checks they equal the requested scope, and derives timestamps, IDs, integrity, validation, provenance, and runtime locator itself. Import requests expose no writable trusted record fields.

The browser implementation advertises none of the four capabilities. Every method returns `PlatformResult` with `code: 'UNSUPPORTED_CAPABILITY'`, the exact attempted capability, `retryable: false`, and no network, storage, Electron, credential, or legacy-facade fallback.

## Authorization Contract

- Every request starts from an authenticated `PlatformSession` with one active organization membership. A request organization mismatch fails before filesystem scan, fetch, hashing, or write.
- `list` requires `project.read` on the requested project and `asset.read` on each returned asset resource. Unauthorized records are not counted, named, or distinguishable from absent records.
- `importFile` and `importRemoteUrl` require `project.write` before reading/fetching bytes. The adapter then generates the opaque asset ID and checks `asset.write` for that asset and the same organization/project before persisting bytes or sidecar data.
- `resolve` requires `asset.read` for the exact asset resource and exact organization/project scope before existence or quarantine details are disclosed.
- Adding a version to an existing asset requires `asset.write`, an exact scope match, and a currently valid predecessor when one is supplied.
- Authorization is evaluated by the platform authorization policy, not inferred from local path reachability, possession of a locator, a renderer-provided `userId`, or a provider response.
- Denials are typed `PERMISSION_DENIED`, contain stable non-sensitive details only, and never fall through to the legacy facade.

## Hostile Input and Serialization Rules

Record construction and deserialization must reject:

- traversal, slash/backslash, URL, percent-encoded, whitespace, NUL, control-character, oversized, or wrong-prefix asset/version IDs;
- organization/project mismatches between request, session, asset, version, predecessor, derivation source, sidecar envelope, and local project location;
- caller-provided IDs, digest, size, canonical MIME, validation state, validator, trusted timestamps, actor identity, runtime locator, or sidecar path;
- digest, byte size, or MIME mismatch against the actual stored bytes;
- cross-asset predecessors, duplicate derivation IDs, duplicate provenance source IDs, self-reference, and direct or transitive lineage cycles;
- malformed dates, unbounded strings/arrays, unknown schema versions, unknown properties in domain records, and non-JSON values;
- serialization of `nomi-local:`, `file:`, `blob:`, provider URLs, signed URLs or query strings, absolute paths, relative storage paths, bucket/object keys, credentials, authorization headers, cookies, raw provider responses, raw errors/stacks, or raw prompts.

All domain serializers are allowlist-based and return a fresh JSON value. They never spread an input object, legacy sidecar, bridge DTO, provider response, or runtime resolution into a persisted record. A recursive final scan rejects forbidden keys and URL/path patterns before sidecar write.

## Idempotency

- `assetRecords.importFile` and `assetRecords.importRemoteUrl` require a bounded opaque idempotency key. The raw key is never persisted or returned.
- The local adapter stores a domain-separated SHA-256 hash of the key and a canonical request fingerprint in the identity envelope.
- Repeating the same key, scope, operation, and fingerprint returns the original `AssetRecordBundle` and does not create new bytes, IDs, versions, or derivation edges.
- Reusing a key with a different scope, operation, or fingerprint returns `CONFLICT` before write or fetch.
- Remote failure after an ambiguous external fetch/write boundary is not automatically retried under a new key. The caller reconciles the original key.
- Idempotency never weakens integrity verification or authorization. Process-wide concurrency for the same key is serialized.
- This is local adapter idempotency, not a claim of cross-device or cloud durability. Durable multi-writer reconciliation remains parent work.

## Exact Reviewed Files

This contract authorizes the following reviewed implementation and test surface for the child. Files not listed here require a reviewed change to this contract.

| Path | Reviewed responsibility |
| --- | --- |
| `docs/architecture/platform-assets-boundary.md` | This contract only. |
| `src/platform/assets/contracts.ts` | Normative record, provenance, validation, request, resolution, capability, and service types plus strict parsers/serializers. |
| `src/platform/assets/runtime.ts` | Runtime-only resolution helpers and guards that prevent locator persistence. |
| `electron/assets/assetIdentity.ts` | Opaque ID generation, byte integrity, identity envelope creation/validation, idempotency binding, and local projection. |
| `electron/assets/projectAssetStore.ts` | Integrate identity envelopes into new writes/lists/resolution while preserving the legacy store and legacy-only path. |
| `src/platform/client.ts` | Add the distinct `assetRecords` service and adapt the existing desktop asset bridge without changing `assets`. |
| `src/platform/browserPlatformClient.ts` | Typed unsupported implementation for all asset-record capabilities. |
| `src/platform/electronPlatformClient.ts` | Authorized Electron asset-record projection and error mapping. |
| `src/desktop/bridge.ts` | Declare the distinct typed asset-record bridge and the existing active-project capability binding used by renderer lifecycle code. |
| `electron/preload.ts` | Expose distinct fixed asset-record IPC methods while preserving the legacy asset channels and bridge shapes. |
| `electron/main.ts` | Register distinct asset-record IPC handlers and bind requests to trusted main-process active-project state. |
| `src/workbench/project/workbenchProjectSession.ts` | Publish and clear the main-process active-project binding when the renderer opens, switches, or closes a project. |
| `src/platform/assets/contracts.test.ts` | Domain, hostile-input, lineage, provenance, integrity, and serialization tests. |
| `src/platform/assets/runtime.contract.test.ts` | Ephemeral resolver and no-persistence tests. |
| `src/platform/platformAssetRecords.adapters.test.ts` | Shared Electron/browser service and capability behavior. |
| `src/platform/platformAssetRecords.boundary.test.ts` | Static dependency, forbidden-field, compatibility, and frozen-file boundary scans. |
| `electron/assets/projectAssetStore.identity.test.ts` | New-write identity, list stability, idempotency, sidecar validation, quarantine, and legacy compatibility tests. |
| `src/platform/platformClient.contract.test.ts` | Legacy facade compatibility plus active-project close and asset-record service regressions. |
| `src/platform/platformClient.boundary.test.ts` | Browser boundary, frozen-surface, and capability exposure regressions. |

No edit is authorized for `src/workbench/api/assetUploadApi.ts`, `src/workbench/assets/useAllProjectAssets.ts`, `src/workbench/assets/assetTypes.ts`, source project data, package files, lockfiles, Beads files, migrations, generated assets, or the six frozen RFC drafts. This reviewed surface remains topology-neutral and does not approve any cloud draft or vendor choice.

## Deterministic Acceptance Tests

Tests are authored before implementation. The initial focused run must be recorded as RED because the new modules/service do not exist, then rerun after implementation.

1. `src/platform/assets/contracts.test.ts`: round-trip canonical fixtures; assert stable opaque ID grammar; immutable versions; exact scope; SHA-256/size/MIME checks; every provenance variant; unknown legacy facts; predecessor and derivation rules; hostile IDs; cycle/duplicate rejection; forged trusted-field rejection; closed schemas; and recursive serialization bans.
2. `src/platform/assets/runtime.contract.test.ts`: resolve only validated records; reject pending/quarantined/rejected/legacy-unverified records; bind purpose/scope/version/integrity; return `nomi-local://` only in the Electron result; and prove that serializing any domain bundle cannot contain a locator.
3. `src/platform/platformAssetRecords.adapters.test.ts`: run a shared operation table across Electron and browser; verify capability order, typed results, authorization calls, scope mismatch denial, safe errors, browser unsupported behavior, no browser fallback, and unchanged legacy `assets` calls.
4. `src/platform/platformAssetRecords.boundary.test.ts`: scan domain modules for Electron/Node/cloud SDK imports; scan serialized fixtures for forbidden schemes/keys; prove workbench consumers still import the legacy facade; and compare the six frozen RFC SHA-256 values below.
5. `electron/assets/projectAssetStore.identity.test.ts`: import bytes, list repeatedly, rename/move bytes plus sidecar, and assert stable IDs; verify distinct immutable version IDs; same-key replay and different-payload conflict; integrity mismatch quarantine; malformed/scope-mismatched envelope rejection; no locator/path in the envelope; no rewrite of legacy fixtures; and continued legacy DTO listing with the current path-derived ID.
6. Existing compatibility suites: `src/platform/platformClient.contract.test.ts`, `src/platform/platformClient.boundary.test.ts`, `src/platform/platformClient.composition.test.ts`, `src/platform/platformClient.facades.test.ts`, `src/platform/platformAuthorization.adapters.test.ts`, `electron/runtime.assets.test.ts`, `electron/assets/assetPaths.test.ts`, and `src/workbench/assets/assetLibrarySources.test.ts` remain green without weakened assertions.
7. Required repository gates after focused tests: app and Electron typecheck, scoped lint for every changed TypeScript file, build, and the repository's complete `pnpm run` verification gates. Static scans must confirm no cloud SDK, migration, RLS, secret, topology selection, project-data rewrite, or public push was introduced.
8. An independent spec-to-diff security review checks every Beads acceptance clause against the final diff and records unresolved parent work explicitly. Passing this child does not close `evmedia-r20.8`.

Frozen draft hashes at this contract baseline:

```text
6e2798d63392443f0a6421cbc6e04b236d9338ed900f2707a40db0b611a52d36  docs/architecture/everville-media-platform-acceptance-matrix.md
f8f1196f010a47505b5ccea0368fea12e83fe2ef02e863dbe9d9d94a748c4b95  docs/architecture/everville-media-platform-cloud-options.md
cf25c90aa2310cb885141910cb7a6ec67af2b33b85d57782ce25e0b1cd8752d0  docs/architecture/everville-media-platform-decision-brief.md
8a3be9f1a3285ac94ba6b21e220684ee71841797c1b0a1b990559c66998816e2  docs/architecture/everville-media-platform-rfc.md
84b06c1cbf50e3e15494e3261da51c214a2cd2d06748a575dd089904ce74cd77  docs/architecture/everville-media-platform-runtime-audit.md
61c8c195b1a6064fb84b1bdd16b249c18694d8838d676493fc42f6ffdb273c35  docs/architecture/everville-media-platform-security-data.md
```

## Non-Goals and Parent Risks

- No cloud/storage/auth vendor, region, bucket, database, queue, worker, CDN, or signed-URL implementation is selected.
- No production migration, historical backfill, source-file rewrite, RLS policy, schema deployment, account linking, or cross-device synchronization is introduced.
- No existing legacy asset receives invented identity, provenance, author, organization, classification, digest history, model, prompt, cost, approval, or lineage.
- No raw provider response, secret, credential, prompt, locator, or absolute path becomes a domain record.
- No frozen RFC is approved or modified, and no public push is authorized.
- Parent `evmedia-r20.8` remains open for authoritative cloud object storage, signed delivery, tenant enforcement, reviewed migration/backfill and rollback, cross-device idempotency, durable record authority, and recovery/reconciliation.
- Parent `evmedia-r20.4` remains the architecture approval boundary. This child is topology-neutral and reversible.

The principal residual risk is split visibility during the reversible phase: new identity-bearing imports can appear on both surfaces, while historical files remain legacy-only. UI migration must therefore be deliberate, and parent migration must reconcile records from reviewed evidence rather than deriving identity or provenance from paths.
