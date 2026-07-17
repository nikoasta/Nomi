# PlatformClient runtime boundary

Status: implementation boundary for `evmedia-r20.2.1`; cloud architecture is **UNAPPROVED**.

Evidence snapshot: repository commit `4b2e8825`, inspected 2026-07-17.

## Decision constraints

- `evmedia-r20.2.1` is the authoritative scope. It permits a reversible, vendor-neutral contract, an Electron adapter, a browser-safe adapter, conformance tests, and migration of only the two confirmed live renderer paths named below.
- Parent `evmedia-r20.2` remains dependent on `evmedia-r20.4`. This document does not satisfy or remove that dependency.
- `evmedia-r20.4` is explicitly **UNAPPROVED**. Nothing here selects a cloud provider, region, database, object store, deployment platform, worker topology, or secret-management product.
- No production secret, authoritative cloud migration, or provider SDK belongs in this slice.
- Existing Electron behavior is the compatibility baseline. Browser execution must be import-safe and return a typed unsupported-capability result until a separately approved online adapter exists.

## Confirmed live scope

Only these renderer modules move behind `PlatformClient` in this milestone:

1. `src/workbench/ai/conversationPersistence.ts`
2. `src/workbench/api/assetUploadApi.ts`

The supporting files below are confirmed parts of their current live runtime paths. They are evidence, not additional migration scope:

- Composition and lifecycle: `src/workbench/NomiStudioApp.tsx:265-270`, `src/workbench/NomiStudioApp.tsx:304-327`, `src/workbench/NomiStudioApp.tsx:563-575`.
- Current renderer bridge declaration/accessor: `src/desktop/bridge.ts:248-316`, `src/desktop/bridge.ts:513-524`, `src/desktop/bridge.ts:666-678`.
- Active-project projection used by asset import: `src/desktop/activeProject.ts:9-18`, `src/desktop/activeProject.ts:20-37`.
- Electron exposure and IPC forwarding: `electron/preload.ts:63-80`, `electron/preload.ts:290-294`.
- Main-process registration and routing: `electron/main.ts:124-127`, `electron/main.ts:593-607`, `electron/main.ts:646-655`.
- Conversation filesystem path and IPC: `electron/conversations/conversationsIpc.ts:17-55`.
- Conversation normalization: `electron/conversations/conversationsStore.ts:20-27`, `electron/conversations/conversationsStore.ts:30-71`, `electron/conversations/conversationsStore.ts:84-101`.
- Atomic conversation writes: `electron/jsonFile.ts:19-39`.
- Workspace path validation: `electron/workspace/workspaceRepository.ts:322-331`.
- Local and remote asset persistence: `electron/assets/localFileImport.ts:7-25`, `electron/assets/projectAssetStore.ts:83-114`, `electron/assets/projectAssetStore.ts:156-199`, `electron/assets/projectAssetStore.ts:201-263`.
- Asset update broadcast: `electron/assets/assetEvents.ts:7-16`.

## Current runtime call paths

### Conversations

#### Write

1. `NomiStudioApp` installs persistence once at `src/workbench/NomiStudioApp.tsx:269-270`. Project switches, hard reload, and return-to-library force a flush at `src/workbench/NomiStudioApp.tsx:289-290`, `src/workbench/NomiStudioApp.tsx:316-322`, and `src/workbench/NomiStudioApp.tsx:563-565`.
2. Store subscriptions debounce writes in `src/workbench/ai/conversationPersistence.ts:95-103` and synchronize both conversation areas before an immediate flush in `src/workbench/ai/conversationPersistence.ts:105-115`.
3. `writeNow` reads `getDesktopBridge()?.conversations`, silently returns when it or `projectId` is absent, sends serialized `creation`, `generation`, and `committedProposal`, then discards any rejected promise at `src/workbench/ai/conversationPersistence.ts:80-90`.
4. `DesktopBridge.conversations.write` is declared at `src/desktop/bridge.ts:513-524` and forwarded by preload to `nomi:conversations:write` at `electron/preload.ts:290-294`.
5. Main registers the conversation handlers at `electron/main.ts:652-655`. The write handler resolves the workspace project, sanitizes both areas and the proposal, atomically writes `<project>/.nomi/conversations.json`, and returns `{ ok: true }` or `{ ok: false, error }` at `electron/conversations/conversationsIpc.ts:34-55`.

#### Read

1. Project hydration starts a non-blocking conversation load at `src/workbench/NomiStudioApp.tsx:304-327`.
2. `loadProjectConversations` silently returns without the optional desktop conversation API. It calls `read`, hydrates empty data when `ok` is false, and catches every thrown error without surfacing it at `src/workbench/ai/conversationPersistence.ts:117-140`.
3. Preload forwards the request to `nomi:conversations:read` at `electron/preload.ts:290-293`.
4. The main handler maps the project ID to `<project>/.nomi/conversations.json`; missing file is a successful `null`, valid data is normalized to v2, and filesystem/JSON errors become `{ ok: false, error }` at `electron/conversations/conversationsIpc.ts:17-31`.

#### Current conversation error semantics

- Missing `window`, missing `window.nomiDesktop`, or an older preload without `conversations` is an undifferentiated silent no-op.
- Renderer write rejection is swallowed. Renderer read rejection and `{ ok: false }` are both treated as non-fatal empty persistence.
- The TypeScript bridge declaration exposes only `{ ok: boolean; conversations: ... }` and `{ ok: boolean }` at `src/desktop/bridge.ts:515-523`, while the IPC implementation can also return `error` at `electron/conversations/conversationsIpc.ts:29-30` and `electron/conversations/conversationsIpc.ts:51-52`. The current type therefore hides diagnostic data.
- The UI-resilience policy is intentional, but runtime absence, project absence, corrupt JSON, and I/O failure are currently indistinguishable to callers and telemetry.

### Asset list and import

#### Renderer entry

1. `getDesktopActiveProjectId` uses the synchronized in-memory ID after initialization and a last-active localStorage fallback only before initialization at `src/desktop/activeProject.ts:20-37`. `NomiStudioApp` synchronizes it at `src/workbench/NomiStudioApp.tsx:265-267` and immediately during hydration at `src/workbench/NomiStudioApp.tsx:324-327`.
2. `listWorkbenchLocalAssets` returns an empty page when there is no active project; otherwise it requires Electron and calls `desktop.assets.list({ projectId, limit: 200 })` at `src/workbench/api/assetUploadApi.ts:59-64`.
3. `importWorkbenchLocalAssetFile` requires Electron, reads the browser `File` into an `ArrayBuffer`, resolves a project ID, and calls `desktop.assets.importFile` at `src/workbench/api/assetUploadApi.ts:66-80`.
4. `importWorkbenchRemoteAssetUrl` requires Electron, resolves a project ID, and calls `desktop.assets.importRemoteUrl` at `src/workbench/api/assetUploadApi.ts:82-95`.
5. The active callers include workspace import (`src/workbench/explorer/WorkspaceFileExplorerPanel.tsx:90-103`), assistant attachments (`src/workbench/ai/composer/useComposerAttachments.ts:57-75`), canvas upload adapters (`src/workbench/generationCanvas/adapters/assetImportAdapter.ts:271-285`), and clipboard remote/local import (`src/workbench/generationCanvas/adapters/clipboardImagePaste.ts:277-287`, `src/workbench/generationCanvas/adapters/clipboardImagePaste.ts:446-463`).

#### Electron path

1. The bridge contract is `src/desktop/bridge.ts:289-315`; preload forwards list, remote import, and file import at `electron/preload.ts:63-80`.
2. Main routes remote import through the lazily loaded runtime, local import through `localFileImport`, and list through the runtime at `electron/main.ts:593-607`. The lazy runtime module is cached at `electron/main.ts:118-127` and re-exports asset persistence at `electron/runtime.ts:42-44`.
3. Local import validates `projectId` and bytes, derives content type/name, and calls `writeAsset` at `electron/assets/localFileImport.ts:7-25`.
4. `writeAsset` resolves a unique project path, writes bytes and sidecar metadata, broadcasts an update, and returns a local asset DTO with `nomi-local://` URL at `electron/assets/projectAssetStore.ts:83-114`.
5. Remote import validates project and URL; accepts existing `nomi-local://`, decodes `data:`, or uses hardened HTTP(S) fetch with a 60-second timeout and 200 MiB cap before persistence at `electron/assets/projectAssetStore.ts:156-199`.
6. List validates the project, scans the project asset tree, restores sidecar metadata, applies optional kind and pagination, and suppresses per-file stat/parse failures at `electron/assets/projectAssetStore.ts:201-263`.

#### Current asset error semantics

- `requireDesktopRuntime` throws an ordinary `Error("<feature> requires the Electron desktop runtime")` at `src/workbench/api/assetUploadApi.ts:29-33`.
- Missing project context throws `Error("projectId is required for local asset import")` at `src/workbench/api/assetUploadApi.ts:35-38`, except list returns an empty page before runtime detection at `src/workbench/api/assetUploadApi.ts:59-63`.
- `File.arrayBuffer`, IPC, validation, filesystem, and network failures reject with untyped errors. Some consumers display the message (`src/workbench/ai/composer/useComposerAttachments.ts:57-75`); others only log (`src/workbench/explorer/WorkspaceFileExplorerPanel.tsx:90-103`) or attempt a recovery fallback (`src/workbench/generationCanvas/adapters/clipboardImagePaste.ts:454-463`).
- Main-process validation rejects missing IDs/bytes at `electron/assets/localFileImport.ts:7-18` and unsupported/missing remote URLs at `electron/assets/projectAssetStore.ts:156-185`. These errors cross IPC without a stable application error code.

## Required minimum boundary

The boundary is capability-based, not environment-branch-based. Renderer feature code receives one `PlatformClient`; only the composition root may inspect the Electron bridge. Neither selected live module may import `getDesktopBridge` after migration.

```ts
export type PlatformCapability =
  | 'conversations.read'
  | 'conversations.write'
  | 'assets.list'
  | 'assets.import-file'
  | 'assets.import-remote-url'

export type PlatformErrorCode =
  | 'UNSUPPORTED_CAPABILITY'
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'IO_ERROR'
  | 'ABORTED'
  | 'INTERNAL'

export type PlatformError = {
  code: PlatformErrorCode
  capability: PlatformCapability
  message: string
  retryable: boolean
  details?: Readonly<Record<string, unknown>>
}

export type PlatformResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PlatformError }

export type PlatformConversations = {
  read(projectId: string): Promise<PlatformResult<PersistedConversationsV2 | null>>
  write(
    projectId: string,
    value: {
      creation: PersistedConversationArea
      generation: PersistedConversationArea
      committedProposal?: unknown
    },
  ): Promise<PlatformResult<void>>
}

export type PlatformAssetListRequest = {
  projectId: string
  cursor?: string | null
  limit?: number
  kind?: string
}

export type PlatformAssetImportFileRequest = {
  projectId: string
  fileName: string
  contentType?: string
  bytes: ArrayBuffer
  kind?: string
}

export type PlatformAssetImportRemoteUrlRequest = {
  projectId: string
  url: string
  kind?: string
  fileName?: string
  ownerNodeId?: string | null
}

export type PlatformAssets = {
  list(request: PlatformAssetListRequest): Promise<PlatformResult<{
    items: WorkbenchAssetDto[]
    cursor: string | null
  }>>
  importFile(request: PlatformAssetImportFileRequest): Promise<PlatformResult<WorkbenchAssetDto>>
  importRemoteUrl(request: PlatformAssetImportRemoteUrlRequest): Promise<PlatformResult<WorkbenchAssetDto>>
}

export type PlatformClient = {
  readonly capabilities: ReadonlySet<PlatformCapability>
  supports(capability: PlatformCapability): boolean
  readonly conversations: PlatformConversations
  readonly assets: PlatformAssets
}
```

### Contract invariants

1. Methods resolve to `PlatformResult`; expected runtime/capability/validation failures do not throw. A rejected promise is reserved for a contract bug and is normalized by adapters before crossing into feature code.
2. Every failure identifies the attempted capability. `UNSUPPORTED_CAPABILITY` is non-retryable and must never be represented as empty data.
3. `details` must be structured, bounded, and free of secrets, absolute credential paths, raw provider responses, and arbitrary `Error.cause` objects.
4. IDs, cursors, DTOs, byte payloads, and persisted conversation shapes are transport-neutral. No Electron, Node, browser global, HTTP vendor, database, or cloud-provider type appears in this contract.
5. Asset byte acquisition from `File` remains in the renderer facade; the platform boundary receives bytes. This preserves the current Electron payload and permits a future online adapter without putting DOM types in the core contract.
6. The boundary does not own active-project state. Callers continue to pass an explicit `projectId`; hidden adapter state must not choose a project and risk cross-project writes.
7. Capability presence is explicit and testable. Callers may adapt UX through `supports`, but must still handle the method result because capability availability can change or fail at execution time.

## Adapter behavior

### Electron adapter

- Constructed from an injected `DesktopBridge`; it must not repeatedly read `window.nomiDesktop`.
- Advertises only methods actually present on the injected preload bridge. An older preload missing optional `conversations` yields typed `UNSUPPORTED_CAPABILITY` for conversation methods.
- Preserves exact current payloads and channels shown above. It unwraps conversation `{ ok, conversations, error? }`, converts write `{ ok, error? }` to `PlatformResult<void>`, and maps rejected IPC/main errors to stable codes.
- Asset DTOs and list pagination pass through unchanged on success. Electron/network/filesystem messages may be retained as safe diagnostic text, but callers branch only on codes.
- The sole factory/composition point may call `getDesktopBridge()` and choose this adapter. Selected feature modules receive the resulting client by importable runtime accessor or dependency injection.

### Browser-safe adapter

- Has no import of `src/desktop/bridge.ts` and never reads `window`, `window.nomiDesktop`, Node APIs, or Electron APIs.
- Advertises none of the five initial capabilities.
- Every method resolves to `{ ok: false, error: { code: 'UNSUPPORTED_CAPABILITY', capability, retryable: false, ... } }`.
- It is a safe pre-architecture placeholder, not the final online implementation. A future online adapter may implement the same contract only after its architecture is approved.

### Renderer facades after migration

- `conversationPersistence.ts` keeps debounce, thread hydration, store projection, and current non-blocking UI policy. It delegates read/write to `PlatformClient`, intentionally ignores unsupported results for UI continuity, and exposes diagnostics to the agreed telemetry/logger boundary instead of conflating unsupported with empty data.
- `assetUploadApi.ts` keeps `File` conversion, name defaults, active-project resolution, DTO helper types, and current caller signatures. It delegates list/import operations to `PlatformClient` and converts a failed `PlatformResult` into one stable public `PlatformOperationError` only at this legacy facade boundary, so existing callers remain behavior-compatible while new code can consume typed results directly.
- No selected module directly calls `getDesktopBridge` after migration.

## Extensibility without topology commitment

Do not grow the initial root interface by copying the entire `DesktopBridge`. Add later domains as separately versioned capability modules only when their Beads milestones are active, for example `projects.*`, `exports.*`, and `generation.*`. Composition may assemble those modules into a client, but transport choice remains adapter-private.

Higgsfield must not be modeled as only `generateImage` and `generateVideo`. Its full surface includes authentication/status, catalogs, models, workflows, uploads, generation, voices, marketing studio, Soul ID, product photoshoot, marketplace cards, workspaces, websites, games, and future CLI/MCP operations. A later generation milestone should therefore use a manifest-driven provider extension, conceptually:

```ts
type ProviderCapabilityManifest = {
  providerId: string
  version: string
  operations: readonly {
    id: string
    inputSchema: unknown
    outputSchema: unknown
    execution: 'immediate' | 'job' | 'stream'
  }[]
}

type GenerationProviderExtension = {
  describe(): Promise<PlatformResult<ProviderCapabilityManifest>>
  invoke(request: {
    operationId: string
    input: unknown
    idempotencyKey: string
  }): Promise<PlatformResult<unknown>>
}
```

This shape can represent the full Higgsfield CLI or MCP surface and other providers without deciding whether an operation executes locally, through an Electron sidecar, through a gateway, or through a remote worker. It is a reserved extension direction, not part of the five-capability implementation in `evmedia-r20.2.1`.

## Test-first acceptance map

Tests must be authored and observed RED before implementation, as required by `evmedia-r20.2.1`.

1. **Shared conformance suite:** run the same contract cases against Electron and browser-safe adapters; assert capabilities, success shape, error shape, retryability, and absence of thrown expected failures.
2. **Electron payload compatibility:** fake `DesktopBridge` and assert exact `conversations.read/write`, `assets.list`, `assets.importFile`, and `assets.importRemoteUrl` arguments and successful result mapping.
3. **Electron error normalization:** cover bridge method absence, `{ ok: false, error }`, rejected IPC, invalid argument, not found, network, I/O, and unknown failure without leaking causes or secrets.
4. **Browser import safety:** import and invoke the browser adapter with no `window`; assert all five methods return typed `UNSUPPORTED_CAPABILITY` and no Electron/Node module is loaded.
5. **Conversation facade:** fake `PlatformClient`; verify debounce/flush payload, hydrate success, missing data, unsupported capability, read failure, and write failure while preserving non-blocking UI behavior.
6. **Asset facade:** fake `PlatformClient`; verify active/explicit project selection, `File` to `ArrayBuffer`, default names/content types, list pagination, remote owner-node metadata, unsupported capability, and typed-to-legacy error conversion.
7. **Static boundary guard:** fail if either selected file imports `src/desktop/bridge`, references `getDesktopBridge`, or references `window.nomiDesktop`.
8. **Regression evidence:** retain current conversation normalization tests at `electron/conversations/conversationsStore.test.ts:6-68`, asset persistence tests at `electron/runtime.assets.test.ts:60-133`, canvas import sequencing tests at `src/workbench/generationCanvas/adapters/assetImportAdapter.test.ts:19-92`, and remote clipboard routing tests at `src/workbench/generationCanvas/adapters/clipboardImagePaste.test.ts:228-274`.

Current gap: there is no direct test of `conversationPersistence.ts`, `assetUploadApi.ts`, the preload-to-main conversation IPC contract, or browser behavior for these paths. Existing tests cover lower-level normalization/persistence and injectable canvas adapters, not the runtime boundary required by this issue.

## Explicitly out of scope

The following direct bridge sites remain intentionally unmigrated in `evmedia-r20.2.1`. Their presence must not fail the selected-file static guard, and this list must not be interpreted as approval of their eventual target topology.

- **Projects, workspace, memory, events:** `src/workbench/project/projectRepository.ts:84,143,162,187,212,272`; `src/workbench/project/projectSummaryRepository.ts:98,128`; `src/workbench/project/workbenchProjectSession.ts:47,95`; `src/workbench/workspace/useWorkspaceFiles.ts:25`; `src/workbench/generationCanvas/agent/projectMemoryClient.ts:23,35,43,52`; `src/workbench/generationCanvas/events/canvasEventEmitter.ts:68`.
- **Generation, models, skills, review:** `src/workbench/api/taskApi.ts:84`; `src/workbench/api/modelCatalogApi.ts:83`; `src/workbench/api/promptLibraryApi.ts:27`; `src/workbench/api/skillApi.ts:37`; `src/workbench/generationCanvas/reviewEventBridge.ts:21`; `src/workbench/generationCanvas/nodes/decompose/useDecomposeLayers.ts:64`; `src/workbench/generationCanvas/nodes/extractVideoFrameToNode.ts:20`; `src/workbench/generationCanvas/nodes/scene3d/cameraMoveVideo.ts:24`; `src/workbench/generationCanvas/nodes/scene3d/scene3dScreenshot.ts:20`; `src/workbench/generationCanvas/agent/shotVerifyJudge.ts:25`; `src/workbench/generationCanvas/runner/relayFrameResolver.ts:32`.
- **Assets outside the selected facade:** `src/workbench/assets/useAllProjectAssets.ts:98`; `src/workbench/assets/AssetLibraryPanel.tsx:191,400`; `src/ui/browser/assets/useBrowserAssetCount.ts:45`; `src/ui/browser/popover/useBrowserAssetLibraryModel.ts:104`; `src/ui/browser/popover/useBrowserAssetCaptureImport.ts:146`; `src/ui/browser/popover/useBrowserAssetActions.ts:169`; `src/ui/browser/dialog/useBrowserDialogActions.ts:526`.
- **Export and preview:** `src/workbench/export/exportApi.ts:27,52`; `src/workbench/preview/TimelinePreview.tsx:259,275,296`; `src/workbench/generationCanvas/nodes/useResultDownload.ts:23`.
- **Browser UI:** `src/ui/browser/overlay/BrowserAssetOverlayApp.tsx:201`; `src/ui/browser/popover/NomiBrowserAssetPopover.tsx:307,339`; `src/ui/browser/dialog/NomiBrowserDialog.tsx:54`; `src/workbench/generationCanvas/components/GenerationCanvas.tsx:431`.
- **Application shell and window controls:** `src/workbench/NomiStudioApp.tsx:171,189,283,357,371`; `src/workbench/WorkbenchShell.tsx:150`; `src/workbench/library/ProjectLibraryPage.tsx:117`; `src/ui/app-shell/windowTitlebarDoubleClick.ts:20,25`; `src/ui/app-shell/NomiAppBar.tsx:14`; `src/ui/app-shell/WindowControls.tsx:6,17,36,44,52`; `src/ui/app-shell/useUpdater.ts:72`.
- **Onboarding and local integrations, including existing Higgsfield UI:** `src/ui/onboarding/HiggsfieldCliCard.tsx:34`; `src/ui/onboarding/DreaminaMemberCard.tsx:32`; `src/ui/onboarding/ComfyuiWorkflowImportPanel.tsx:38`; `src/ui/onboarding/ComfyuiLocalCard.tsx:40`; `src/ui/onboarding/ConnectAssistantCard.tsx:47`; `src/ui/onboarding/VendorOnboardCard.tsx:86,103,130`; `src/ui/onboarding/OnboardingDrawer.tsx:68,134,158`; `src/ui/onboarding/CustomVendorManage.tsx:50,62,82,94`.
- **Agent/capability and miscellaneous renderer integration:** `src/api/desktopAgentsChatStream.ts:4`; `src/workbench/capability/capabilityApplyHandler.ts:87`; `src/workbench/library/useHasTextModel.ts:13`; `src/workbench/explorer/FilePreviewPanel.tsx:43`; `src/workbench/ai/staleConversationDivider.tsx:23`.

Also out of scope: changing Electron IPC channel names, changing the on-disk conversation or asset layout, moving project identity into adapter state, implementing a cloud adapter, choosing authentication/tenancy/storage vendors, implementing generation jobs, or defining a reduced Higgsfield feature subset.

## Completion boundary for this document

This trace proves where the two selected renderer paths currently cross into Electron and defines the smallest reversible contract needed to isolate them. It does **not** prove `evmedia-r20.2.1` complete: RED tests, implementation, conformance, full repository gates, and independent review remain required.
