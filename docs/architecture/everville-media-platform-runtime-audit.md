# Everville Media Platform Runtime Audit

Status: Current-state evidence audit; no target architecture is approved

Date: 2026-07-17

Beads parent: `evmedia-r20.4`

Babysitter effect: `01KXPTH8R8P7Y6RF5ZP5FK1J3J`

## Scope And Decision Discipline

This audit traces the live Nomi renderer-to-Electron paths required by RFC-01:
projects/filesystem, assets and `nomi-local://`, provider credentials/catalog,
generation (including Higgsfield), browser capture, FFmpeg/export,
event/provenance logging, and external MCP/RPC canvas integration. The product
workflow explicitly leaves storage, collaboration, deployment, migration, and
technical architecture open
(`docs/product/2026-07-16-everville-media-portal-workflow-draft.md:13-14`). The
acceptance matrix likewise says that it approves no architecture and that a
missing decision is not implicit approval
(`docs/architecture/everville-media-platform-acceptance-matrix.md:20-32`).

The sections below deliberately separate:

- **Evidence**: behavior directly traced in current live paths.
- **Inference**: portability conclusions supported by that evidence.
- **Recommendation**: proposed follow-up, not an approved design.
- **Unresolved owner decision**: a breakpoint that must not be defaulted by
  implementation.

No target cloud service, storage vendor, queue, auth provider, or deployment
platform is selected here.

## Evidence

### Shared Renderer And Privilege Boundary

The production renderer mounts `NomiRouterApp`, which routes the workbench path
to `NomiStudioApp` (`src/main.tsx:35-42`, `src/NomiRouterApp.tsx:31-47`). The
studio lazy-loads the browser dialog and dynamically creates the project
persistence service; it also installs the canvas event project provider and the
capability apply handler (`src/workbench/NomiStudioApp.tsx:104-107`,
`src/workbench/NomiStudioApp.tsx:244-276`).

Renderer features obtain `window.nomiDesktop` through `getDesktopBridge()`;
absence returns `null` (`src/desktop/bridge.ts:672-679`). Electron preload maps
that bridge to IPC, and `registerIpc()` maps the channels to main-process
repositories and native subsystems (`electron/preload.ts:44-80`,
`electron/main.ts:426-475`). Thus the effective privilege boundary is:

```text
React renderer -> DesktopBridge/window.nomiDesktop -> preload IPC
  -> Electron main handler -> repository/native process/network/filesystem
  -> structured return value or renderer event
```

The following traces start at actual renderer callers, not only type
declarations.

### 1. Projects And Filesystem

**Ordered live path**

1. `useLocalProjects`, `createLocalProject`, `saveLocalProject`, and
   `deleteLocalProject` are the renderer-facing library operations
   (`src/workbench/library/localProjectStore.ts:70-123`). Studio creates the
   persistence service on demand and supplies its active-project and save-error
   callbacks (`src/workbench/NomiStudioApp.tsx:244-263`).
2. `projectRepository` selects `desktop.projects` when the bridge exists. It
   calls `list`, `create`, async `read`, `save`, and `delete`; when no bridge
   exists, this repository alone falls back to browser JSON/localStorage
   records (`src/workbench/project/projectRepository.ts:83-105`,
   `src/workbench/project/projectRepository.ts:108-154`,
   `src/workbench/project/projectRepository.ts:182-198`,
   `src/workbench/project/projectRepository.ts:201-290`).
3. The bridge contract exposes workspace and project operations
   (`src/desktop/bridge.ts:268-288`). Preload maps project operations mostly to
   synchronous IPC and maps workspace operations to async IPC
   (`electron/preload.ts:44-62`).
4. Main maps those channels to `listProjects`, `createProject`, `readProject`,
   `saveProject`, and `deleteProject` (`electron/main.ts:440-454`). Folder open,
   file listing, reveal, deletion, and project-folder reveal cross Electron
   `dialog`/`shell` boundaries in the workspace handlers
   (`electron/main.ts:532-587`).
5. The project repository resolves native or registered workspace directories,
   creates a default project beneath the configured projects root, delegates
   workspace-backed writes, or atomically writes a legacy project record
   (`electron/projects/repository.ts:98-105`,
   `electron/projects/repository.ts:124-153`,
   `electron/projects/repository.ts:163-209`). Native deletion removes the
   managed directory, while an external workspace is unbound without deleting
   user content (`electron/projects/repository.ts:212-220`).

**Terminal effects and returns**

- The authoritative desktop snapshot is the workspace project record plus its
  project directory; native projects are created under the configured default
  project root, while external folders are registered and retained in place.
- List returns project summaries, create/read/save return project records, and
  delete returns `{ id, deleted }`. Workspace actions return folder selection,
  file-list, or `{ ok }` results.
- The browser fallback is confirmed only for project JSON/index persistence. It
  does not establish browser parity for assets, generation, capture, or export.

### 2. Assets And `nomi-local://`

**Ordered live path**

1. Renderer asset list/import operations call `assetUploadApi`. The API resolves
   the active project, converts an uploaded `File` to an `ArrayBuffer`, and
   rejects when Electron is unavailable
   (`src/workbench/api/assetUploadApi.ts:29-38`,
   `src/workbench/api/assetUploadApi.ts:59-94`).
2. Preload sends list, remote import, and file import over async IPC
   (`electron/preload.ts:63-79`). Main dispatches remote import to runtime,
   local file import to `localFileImport`, and listing to the runtime asset
   repository (`electron/main.ts:593-608`).
3. `projectAssetStore.writeAsset` and `moveAssetFile` write or move bytes into a
   project asset path, write metadata sidecars, broadcast an asset update, and
   return a DTO containing both filesystem paths and a `nomi-local://` URL
   (`electron/assets/projectAssetStore.ts:83-154`). Remote HTTP/data imports are
   downloaded or decoded and then converge on `writeAsset`; an existing
   `nomi-local://` value is returned without copying bytes
   (`electron/assets/projectAssetStore.ts:156-199`).
4. `localAssetUrl` encodes project identity and project-relative path into
   `nomi-local://asset/...` (`electron/assets/assetPaths.ts:22-24`). At startup,
   main registers the custom protocol before creating the window
   (`electron/main.ts:735-758`). The protocol validates the host, resolves the
   project-relative path through the project repository, uses Electron
   `net.fetch(file:)`, adds canvas-compatible CORS headers, and returns the file
   response or a 404 (`electron/protocol/localProtocol.ts:5-38`).
5. Generation results use the same store: provider URLs are localized to
   project assets before the task result returns
   (`electron/runtime.ts:403-418`). Browser capture also converges on
   `moveAssetFile` as described below.

**Terminal effects and returns**

- Bytes end in project-local `assets/imported` or `assets/generated` storage,
  accompanied by a metadata sidecar. The returned asset DTO includes a local
  runtime URL, relative/absolute paths, content type, and size
  (`electron/assets/projectAssetStore.ts:92-113`).
- Browser-capture asset kinds force `originalUrl` to `null` so captured browsing
  URLs do not enter provider reference flows
  (`electron/assets/assetPaths.ts:51-72`).
- `nomi-local://` is a desktop presentation/addressing mechanism backed by the
  Electron protocol and local filesystem; it is not a portable persisted cloud
  identity.

### 3. Provider Credentials And Catalog

**Ordered live path**

1. Renderer catalog operations call `modelCatalogApi`; vendor/model/health
   reads and model upserts throw when no Electron bridge exists
   (`src/workbench/api/modelCatalogApi.ts:82-112`).
2. `DesktopBridge.modelCatalog` exposes catalog CRUD, import/export, test, and
   provider-specific setup operations (`src/desktop/bridge.ts:581-607`). Preload
   maps catalog reads and writes to synchronous IPC
   (`electron/preload.ts:356-380`). Main maps those IPC calls to catalog store
   functions (`electron/main.ts:461-475`).
3. `catalogStore` reads/writes the catalog at the Electron settings root,
   initializes and migrates it, and atomically persists changes
   (`electron/catalog/catalogStore.ts:127-165`,
   `electron/catalog/catalogStore.ts:354-363`). API-key upsert validates the
   key, creates an encoded key record, writes the catalog, and returns only
   key-presence metadata (`electron/catalog/catalogStore.ts:526-566`).
4. Secret encoding uses Electron `safeStorage` when available. If it is not
   available, the current implementation logs a warning and stores the key as
   plaintext with `enc: "plain"`; decryption remains in the main process
   (`electron/catalog/secrets.ts:20-56`).
5. Task execution reads the catalog and decrypts the selected vendor key in
   `findExecutableModel`; it throws for disabled vendors/models or missing keys
   (`electron/runtime.ts:180-193`). The catalog explicitly documents that the
   decrypted onboarding key does not leave main
   (`electron/catalog/catalogStore.ts:400-407`).

**Terminal effects and returns**

- Catalog and credential records end in the Electron settings-root catalog
  file. Renderer returns contain vendors/models/mappings, health, and
  `hasApiKey`-style metadata, not plaintext credential material.
- Credential custody is main-process local today, but encryption is conditional
  rather than guaranteed on every supported environment.

### 4. Generation Tasks, Including Higgsfield

**Ordered live path**

1. The canvas runner resolves a node against the catalog, builds the vendor
   request, dispatches via `runWorkbenchTaskByVendor`, polls nonterminal tasks,
   and normalizes the final node result
   (`src/workbench/generationCanvas/runner/catalogTaskActions.ts:252-281`).
2. `taskApi` requires Electron, attaches the active project, and calls
   `desktop.tasks.run`; polling calls `desktop.tasks.result`. Spend grants are
   minted through a separate bridge operation after the renderer confirmation
   path (`src/workbench/api/taskApi.ts:83-124`).
3. Preload maps run/result/grant and text-stream operations to IPC
   (`electron/preload.ts:207-225`). Main mints spend grants, wraps task submission
   in an idempotency guard, and dispatches run/result to runtime
   (`electron/main.ts:621-641`).
4. Runtime resolves the executable model and decrypted key, applies parameter
   defaults and guards, checks the spend grant before a real provider call,
   executes the mapped operation, normalizes the result, writes vendor trace
   events, caches terminal results, and returns `TaskResult`
   (`electron/runtime.ts:442-520`). HTTP mappings first translate
   `nomi-local://` references into provider-reachable values, build the request,
   and call the provider; process mappings delegate to a native process
   operation (`electron/runtime.ts:311-370`).
5. Runtime localizes returned provider assets into the project and attaches
   task provenance on successful mapped results
   (`electron/runtime.ts:373-439`). Renderer normalization then embeds that
   provenance in the generation node result
   (`src/workbench/generationCanvas/runner/catalogTaskResultParse.ts:97-145`,
   `src/workbench/generationCanvas/runner/catalogTaskResultParse.ts:149-175`).

**Higgsfield branch**

1. The onboarding/setup surface exposes Higgsfield status, install, login, and
   catalog sync through dedicated bridge methods
   (`src/desktop/bridge.ts:628-646`, `electron/preload.ts:182-187`,
   `electron/main.ts:528-531`).
2. Status invokes the official CLI for version, account, workspace, models,
   workflows, and voices. Install spawns `npm install -g @higgsfield/cli`, login
   invokes `higgsfield auth login`, and sync writes discovered models/workflows
   into the shared catalog (`electron/catalog/higgsfieldIpc.ts:84-160`,
   `electron/catalog/higgsfieldIpc.ts:205-227`).
3. A synced Higgsfield mapping selects the process transport. It materializes
   local file parameters to a temporary directory, builds `generate create` or
   `generate workflow` arguments with `--wait --json`, spawns the resolved CLI,
   normalizes stdout/stderr, and cleans temporary inputs
   (`electron/catalog/processOperation.ts:149-208`,
   `electron/catalog/higgsfieldTransport.ts:134-150`,
   `electron/catalog/higgsfieldCli.ts:33-75`).
4. Higgsfield results rejoin the normal runtime mapping, asset localization,
   provenance, event, cache, and node-result return path. There is no separate
   renderer-only generation implementation.

**Terminal effects and returns**

- Network providers produce normalized task state and project-local assets;
  Higgsfield additionally starts local child processes and uses temporary input
  files. The renderer receives task ID, status, localized assets, raw provider
  data, and available provenance.
- The live spend and idempotency enforcement points are in Electron main/runtime,
  not in renderer UI alone.

### 5. Browser Capture

**Ordered live path**

1. `NomiBrowserDialog` obtains `desktop.browser`, subscribes to resource-capture
   events, enables capture for the active view, and sends capture requests from
   the keyboard/UI (`src/ui/browser/dialog/NomiBrowserDialog.tsx:52-55`,
   `src/ui/browser/dialog/NomiBrowserDialog.tsx:480-537`). Tab create/navigation
   calls `browserBridge.createView` and `navigate`
   (`src/ui/browser/dialog/useBrowserDialogActions.ts:90-169`).
2. Import first tries view-aware image/media capture, then falls back to the
   desktop remote-asset importer; all paths require an active project
   (`src/ui/browser/dialog/useBrowserDialogActions.ts:488-535`). Preload maps the
   browser methods to invoke/send IPC (`electron/preload.ts:81-100`).
3. Main registers `browserViews`. Create allocates a sandboxed Electron
   `WebContentsView` with its own session and attaches it to the owner window;
   navigation calls `webContents.loadURL`, and capture/import channels dispatch
   to browser-media handlers (`electron/browser/core/browserViews.ts:242-290`,
   `electron/browser/core/browserViews.ts:331-371`).
4. Resource selection executes JavaScript inside the page view and emits the
   selected resource back to the owner renderer
   (`electron/browser/media/browserViewMedia.ts:143-186`). Import uses the
   view's session/download hooks and a temporary directory, then moves the file
   into the project asset store and returns its DTO
   (`electron/browser/media/browserViewMedia.ts:188-210`,
   `electron/browser/media/browserViewMedia.ts:294-342`).
5. Prompt screenshot capture calls Electron `webContents.capturePage`, writes a
   temporary PNG, moves it into the project, and returns `dataUrl`,
   `referenceUrl`, source metadata, capture bounds, and the asset DTO
   (`electron/browser/media/browserViewMedia.ts:616-675`).

**Terminal effects and returns**

- Browser sessions/cookies live in Electron; downloaded or captured bytes end
  in the current project's asset storage. Temporary files are removed after the
  asset move.
- The renderer receives view IDs/state, capture events, or asset/reference DTOs.
  It does not directly own the embedded page, authenticated download session,
  or screenshot primitive.

### 6. FFmpeg And Export

**Ordered live path**

1. Timeline Preview's export action calls `exportTimelineToMp4` with the active
   project and reports progress/success to the UI
   (`src/workbench/preview/TimelinePreview.tsx:239-269`).
2. `exportApi` requires desktop export methods, builds a render manifest, starts
   a job, and subscribes to job events. A filtergraph-capable job finishes
   entirely in main; otherwise the renderer records WebM, uploads it in IPC
   chunks, and asks main to transcode it (`src/workbench/export/exportApi.ts:26-49`,
   `src/workbench/export/exportApi.ts:51-137`).
3. Preload maps start, chunk write, finish, status, cancel, event, and reveal
   operations to IPC (`electron/preload.ts:192-206`). Main installs the export
   job handlers through `registerExportJobIpc`
   (`electron/main.ts:617-623`).
4. `startExportJob` validates project/manifest identity, creates a durable job,
   attempts filtergraph planning, records the chosen backend, and returns
   `{ jobId, backend }` (`electron/export/exportJobs.ts:198-230`). Finish either
   renders the prepared filtergraph from source files or transcodes the
   renderer's WebM, updates durable progress, finalizes the job, and returns the
   MP4 result (`electron/export/exportJobs.ts:301-402`).
5. The job store writes `manifest.json`, `job.json`, logs, and terminal
   result/error files beneath `.nomi/jobs`; recent jobs are rehydrated from that
   directory (`electron/export/exportJobStore.ts:20-73`). Job-manager updates
   persist before emitting progress/status/result events
   (`electron/export/exportJobManager.ts:149-188`,
   `electron/export/exportJobManager.ts:229-236`).
6. The runner resolves bundled/configured/system FFmpeg, spawns it with abort
   support, writes to a partial output, atomically renames the completed MP4,
   and returns `{ absolutePath, relativePath, size }`
   (`electron/export/ffmpegRunner.ts:196-252`,
   `electron/export/ffmpegRunner.ts:349-413`). App shutdown aborts active export
   child processes (`electron/main.ts:788-799`).

**Terminal effects and returns**

- Durable execution state lives under the project `.nomi/jobs`; completed media
  lives under the project export path. Native FFmpeg is the MP4 encoder in both
  primary and fallback paths.
- A renderer WebM can be downloaded as a failure fallback, but the requested MP4
  operation has no browser-only completion path.

### 7. Event And Provenance Logging

**Ordered live path**

1. Canvas actions call `emitCanvasGesture`, which creates transaction/source
   metadata, feeds the local undo journal, batches events, and calls
   `desktop.events.append`; without a project/bridge, or on append failure, the
   durable write is silently skipped (`src/workbench/generationCanvas/events/canvasEventEmitter.ts:59-109`).
2. Preload maps append/read to IPC (`electron/preload.ts:227-235`), and main
   registers the event IPC plus a catalog-secret provider for redaction
   (`electron/main.ts:652-664`).
3. `eventLogRepository` initializes `.nomi/events`, appends ordered JSONL
   segments, redacts secrets, moves oversized fields to sidecars, and returns
   written events. It catches IO errors and returns an empty list
   (`electron/events/eventLogRepository.ts:91-110`,
   `electron/events/eventLogRepository.ts:149-205`). Reads merge segments by
   sequence and rehydrate sidecars (`electron/events/eventLogRepository.ts:224-239`).
4. Project hydration reads the event tail after the snapshot sequence, applies
   canvas events, and emits a restored genesis event; failure falls back to the
   project snapshot (`src/workbench/project/workbenchProjectSession.ts:41-65`).
5. Runtime writes paired `vendor.call.requested` and terminal
   `vendor.call.completed` events through the same repository
   (`electron/events/vendorCallTrace.ts:11-24`,
   `electron/events/vendorCallTrace.ts:44-63`, `electron/runtime.ts:495-503`).
6. `buildTaskProvenance` records provider, model, prompt, selected parameters,
   vendor request ID, and timestamp (`electron/vendor/provenance.ts:61-101`).
   Runtime attaches it to successful task results, and renderer normalization
   stores it in the node result as cited in the generation trace.

**Terminal effects and returns**

- Canvas and provider events end in project-local segmented JSONL plus optional
  sidecars. The append return advances the renderer's last applied sequence.
- Rich task provenance currently lives in the task/node result and therefore in
  the saved project snapshot. `writeAsset` sidecars receive asset metadata, but
  the traced write path does not independently copy the full task provenance
  record into every asset sidecar (`electron/assets/projectAssetStore.ts:83-113`).
- The current provenance shape does not include author, actual generation cost,
  asset version relationships, review, or approval history, all of which the
  product workflow requires (`docs/product/2026-07-16-everville-media-portal-workflow-draft.md:74-75`,
  `docs/product/2026-07-16-everville-media-portal-workflow-draft.md:94-102`).

### 8. External MCP/RPC Canvas Integration

This path has two entry modes but one dispatcher/core.

**Ordered live path**

1. Packaged MCP mode starts a newline JSON-RPC server on stdin/stdout. The MCP
   protocol maps `nomi_list_projects`, `nomi_create_project`,
   `nomi_list_models`, canvas read/mutations, and `nomi_generate` to capability
   methods (`electron/capabilityCore/mcpProtocol.ts:24-132`,
   `electron/capabilityCore/mcpProtocol.ts:227-265`).
2. If the GUI advertises a live instance, the stdio server POSTs the request and
   bearer token to its loopback `/rpc`; otherwise it invokes the same dispatcher
   in-process with a disk gateway. Headless paid generation requires MCP
   elicitation before a spend-confirmed gateway can mint a grant
   (`electron/capabilityCore/mcpStdioServer.ts:35-65`,
   `electron/capabilityCore/mcpStdioServer.ts:68-107`).
3. GUI startup starts an authenticated HTTP server on a random
   `127.0.0.1` port and advertises its PID/port/token. Requests are size-limited,
   token-verified, dispatched, and returned as `{ ok, result }` or
   `{ ok: false, error }` (`electron/capabilityCore/appIntegration.ts:31-49`,
   `electron/capabilityCore/rpcServer.ts:58-111`). Main injects the same runtime
   `runTask` and `fetchTaskResult` functions used by renderer IPC
   (`electron/main.ts:147-160`).
4. `dispatcher` maps methods to the capability core and selects a gateway by
   project ID (`electron/capabilityCore/dispatcher.ts:39-68`). Project/model
   list/create call the existing project/catalog repositories. Canvas operations
   call one `ProjectGateway` abstraction and return IDs/change summaries
   (`electron/capabilityCore/core.ts:162-216`).
5. Gateway selection is three-way: disk if no renderer/project ID, renderer for
   the active project, and hybrid (disk read/write plus renderer spend
   confirmation) for a non-active project while the window is available
   (`electron/capabilityCore/rpcServer.ts:59-68`). The disk gateway calls the
   project repository; the renderer gateway sends `canvas.read-doc`,
   `canvas.apply`, or `spend.confirm` requests and waits with bounded timeouts
   (`electron/capabilityCore/gateway.ts:36-69`,
   `electron/capabilityCore/gateway.ts:72-113`).
6. `rendererBridge` sends a request to the main window's `WebContents`, pairs the
   reply by ID, and rejects on missing renderer, renderer error, or timeout
   (`electron/capabilityCore/rendererBridge.ts:31-82`). Preload receives the
   request, invokes the registered renderer handler, and sends success/error
   back (`electron/preload.ts:395-413`).
7. `capabilityApplyHandler` reads/applies the live generation-canvas store or
   shows the shared spend-confirm UI. It rejects canvas writes targeting a
   different active project (`src/workbench/capability/capabilityApplyHandler.ts:56-90`).
   The renderer reports active-project changes to main so RPC can select the
   correct gateway (`src/workbench/project/workbenchProjectSession.ts:91-96`,
   `electron/main.ts:643-651`).
8. `generate` writes queued/running state through the gateway, obtains spend
   confirmation, invokes injected runtime generation, polls nonterminal tasks,
   writes failure or final result back to the node, and returns node ID, status,
   and assets (`electron/capabilityCore/core.ts:245-360`).

**Terminal effects and returns**

- Active-project canvas mutations end in the renderer store and are later
  persisted by the ordinary project persistence path. Inactive/headless canvas
  mutations write the project snapshot directly through the project repository.
- Generation reuses the same credential, spend, provider/CLI, asset,
  provenance, and event paths as renderer-triggered generation.
- MCP returns each capability result as JSON text in a tool result. RPC returns
  the structured result in its JSON envelope.
- The capability core is a reusable Node/main-process seam, but its live
  transports use Electron app/session, process stdio, local files, loopback HTTP,
  and Electron WebContents IPC. It is not a browser runtime as implemented.

## Inference

### Reusable Seams Confirmed By The Live Paths

| Seam | Evidence-backed reuse value | Current runtime constraint |
| --- | --- | --- |
| Project record/repository contract | Renderer persistence and capability-core disk mode share project records and repository operations. | Desktop authority is filesystem/workspace registry; only the renderer project repository has a limited localStorage fallback. |
| `ProjectGateway` | Capability canvas logic already separates live renderer state from disk persistence and injects task execution. | Implementations are renderer WebContents IPC or local filesystem. |
| Task request/result and mapped operation pipeline | Renderer and MCP generation both converge on runtime model resolution, spend enforcement, provider/process execution, normalization, localization, and provenance. | Runtime imports Node/Electron repositories, secrets, filesystem, and process transports. |
| Asset DTO and project asset store | Upload, provider results, browser capture, and other local media paths converge on one write/move store. | DTOs expose absolute paths and `nomi-local://`; bytes are project-local files. |
| Catalog IDs and mapping model | Stable vendor/model/mapping IDs are consumed by renderer, runtime, Higgsfield sync, and MCP model listing. | Catalog and encrypted key records share one local settings file; catalog API is sync IPC. |
| Export manifest/job manager | Renderer submits a manifest and receives durable job state/events independent of FFmpeg implementation detail. | Job store and encoder are local filesystem/native-process implementations. |
| Event/provenance normalization | Canvas, vendor-call, and task-result paths share structured events and recipe/provenance builders. | Event append is best-effort local JSONL; provenance is incomplete for the Everville workflow. |

These are implementation seams, not an approved `PlatformClient` or cloud
boundary. The acceptance matrix requires that any future platform contract
specify identity, errors, authorization, and side effects before approval
(`docs/architecture/everville-media-platform-acceptance-matrix.md:55-55`).

### Confirmed Direct Electron Coupling That Blocks Browser Operation

| Capability | Confirmed blocker |
| --- | --- |
| Projects/filesystem | Sync/async IPC, Electron folder dialogs and shell reveal, Node filesystem, native project root, and workspace registry. The localStorage fallback covers snapshots only. |
| Assets | Renderer APIs explicitly throw without Electron; bytes and sidecars use Node filesystem; `nomi-local://` resolves only through Electron protocol/net. |
| Credentials/catalog | Renderer catalog API explicitly throws without Electron; IPC reads are synchronous; custody relies on Electron settings paths and `safeStorage`. |
| Generation | Renderer task API explicitly throws without Electron; spend grants, decrypted credentials, provider localization, idempotency, caches, and process mappings are main/runtime responsibilities. |
| Higgsfield | Official CLI discovery, login, catalog sync, temporary file materialization, and generation all spawn local processes. |
| Browser capture | Embedded browsing is an Electron `WebContentsView`; authenticated downloads use Electron sessions/download hooks; screenshots use `capturePage`. |
| MP4 export | Export API explicitly requires desktop IPC; durable jobs use local files; both MP4 paths spawn native FFmpeg. |
| Events/provenance | Durable append/read uses bridge IPC and project-local `.nomi/events`; no bridge means canvas events are dropped from durable logging. |
| MCP/RPC canvas | The shared core is Node-capable, but ingress/egress is packaged Electron stdio, loopback Node HTTP, local instance advertisement, filesystem gateways, and WebContents IPC. |

Therefore a browser build cannot obtain current feature parity by rendering the
existing React tree alone. The limited project localStorage fallback is useful
for isolated browser behavior, but it does not remove the privileged service
requirements above.

## Recommendations

All recommendations are **PROPOSED** and limited to confirmed live-path files
and responsibilities. They do not authorize implementation or select vendors.

1. **PROPOSED R-01: define runtime-neutral capability contracts at the existing
   renderer API seams.** Use the operations already visible in
   `projectRepository`, `assetUploadApi`, `modelCatalogApi`, `taskApi`,
   `exportApi`, and `ProjectGateway` as evidence inputs. Specify stable IDs,
   request/return types, authorization context, error semantics, and side
   effects before introducing a second adapter.
2. **PROPOSED R-02: separate asset identity from desktop addressing.** Preserve
   `nomi-local://` as the Electron resolver, while defining a runtime-neutral
   asset/version identity that does not persist absolute paths or desktop URLs
   as cloud authority. Reconcile that identity with `stableAssetId`, task
   results, asset sidecars, project snapshots, export manifests, and browser
   capture before migration.
3. **PROPOSED R-03: retain privileged execution behind an authoritative
   service boundary.** Provider keys, spend enforcement, policy checks,
   idempotency, provider/CLI calls, and cost capture must stay outside a browser
   bundle. The current main/runtime boundary is continuity evidence, not a
   selection of the future service or deployment platform.
4. **PROPOSED R-04: treat generation and export as durable jobs.** Reuse the
   current task/result and export job semantics when defining a target job state
   machine. Do not infer a queue technology. Higgsfield CLI and FFmpeg should
   remain explicit desktop execution adapters until owners approve continuity or
   migration for each.
5. **PROPOSED R-05: do not elevate the current event log to product audit
   authority.** Keep it as current operational/recovery evidence until a reviewed
   durable model covers author, cost, classification/policy decisions, asset
   versions, reviews, approvals, publication, and denials. Decide whether rich
   provenance is asset-owned, version-owned, or linked before changing sidecars.
6. **PROPOSED R-06: preserve Electron acceptance tests through any online-first
   work.** Each capability in this audit should be marked preserved, migrated
   with evidence, or blocked on an explicit owner breakpoint, matching RFC-20
   (`docs/architecture/everville-media-platform-acceptance-matrix.md:72-72`).

## Unresolved Owner Decisions

Every item below is **UNAPPROVED**. The owner names are roles to assign, not
evidence of approval.

| ID | Unapproved decision | Owner needed | Why it blocks downstream design |
| --- | --- | --- | --- |
| U-01 | Target online runtime, deployment topology, and private delivery boundary | Architecture owner + repository owner | Determines where browser APIs, privileged services, and Everville-only code live. |
| U-02 | Authoritative project/campaign store and local/cloud synchronization/conflict model | Architecture owner + Product owner | Current snapshots are filesystem/localStorage records with no shared-edit authority. |
| U-03 | Stable Asset/Version identity, byte ownership, addressing, and migration from `nomi-local://` | Architecture owner + Product owner | Current DTOs mix logical asset data with local URL and absolute filesystem paths. |
| U-04 | Credential custody and provider policy for browser users, including local CLI auth versus remote credentials | Security owner + Architecture owner | Browser bundles may not receive provider secrets; local `safeStorage` has a plaintext fallback. |
| U-05 | Higgsfield target integration and continuity requirement for official local CLI behavior | Product owner + Architecture owner | No cloud/API path is approved; the evidenced current path is local process execution. |
| U-06 | Browser capture product semantics: embedded browser, extension/helper, upload-only flow, or another reviewed option | Product owner + Security owner | Current authenticated view/session/download/screenshot behavior is Electron-specific and privacy-sensitive. |
| U-07 | Generation/export job execution placement, queue/runtime technology, retry/idempotency policy, and cost authority | Architecture owner + Operations owner | Current execution is in one desktop main process with local caches/jobs and native tools. |
| U-08 | Whether FFmpeg remains a desktop capability, moves to a service, or intentionally loses parity | Product owner + Architecture owner | MP4 export has no browser-only completion path and is an RFC-20 continuity breakpoint. |
| U-09 | Product audit/provenance authority and retention model | Product owner + Security/Compliance owner | Current best-effort events and task provenance cannot satisfy required author/cost/version/approval history. |
| U-10 | External MCP/RPC target, authentication, tenant/project authorization, and concurrent-edit semantics | Architecture owner + Security owner | Current bearer token, loopback transport, active-project gateway, and local spend confirmation are single-machine assumptions. |
| U-11 | Pilot campaign, final approvers, direct-publishing channels, day-one Brand Kits/templates, and mandatory legal-review classes | Product/business owners | These remain explicit open product questions (`docs/product/2026-07-16-everville-media-portal-workflow-draft.md:109-115`). |

## Risks

1. **RISK-01, audit gap:** event append/read deliberately fail open and renderer
   append errors are swallowed. Current JSONL is useful recovery/diagnostic data,
   not sufficient evidence for approval or publication audit.
2. **RISK-02, provenance gap:** successful task results carry provider/model/
   prompt/params/request ID/time, but the traced asset sidecar path does not
   independently retain full provenance, and author/cost/version/approval fields
   are absent.
3. **RISK-03, secret-at-rest gap:** `safeStorage` unavailability produces a
   plaintext catalog key record. Any continuity or migration plan must model
   this state explicitly and avoid copying it into browser-visible data.
4. **RISK-04, false browser-readiness signal:** the project repository's
   localStorage fallback can make basic screens appear functional while assets,
   catalog, generation, capture, MP4 export, events, and MCP remain unavailable.
5. **RISK-05, identity coupling:** project snapshots and asset DTOs can contain
   `nomi-local://` and absolute paths. Treating either as cross-runtime identity
   would make synchronization and migration non-portable.
6. **RISK-06, process continuity:** Higgsfield and FFmpeg depend on local
   executable discovery, environment, temporary files, cancellation, and
   cleanup. An online-first renderer does not preserve those behaviors by
   default.
7. **RISK-07, concurrency:** capability-core A/B routing protects one active
   desktop store from direct disk overwrite, but it is not a multi-user conflict
   protocol. Moving disk writes to shared storage without an approved authority
   model risks lost updates.
8. **RISK-08, privacy/security:** browser capture deliberately separates local
   page provenance from provider-facing `originalUrl`. A replacement capture
   path must preserve that rule and re-review session, download, and screenshot
   trust boundaries.
9. **RISK-09, continuity:** replacing any Electron path before its owner
   breakpoint is approved would violate the acceptance matrix's requirement to
   preserve, evidence-migrate, or explicitly block every current capability.

## Audit Conclusion

The current implementation is a React renderer over a substantial privileged
Electron backend. The strongest reusable seams are the project record contract,
`ProjectGateway`, normalized task request/result pipeline, catalog IDs/mappings,
asset store DTOs, export manifest/job model, and event/provenance structures.
Those seams are real, but most concrete adapters remain coupled to IPC, local
filesystem state, Electron sessions/protocols, local secret storage, or native
processes.

This evidence supports designing a browser-capable platform boundary; it does
not approve one. Target runtime, data/auth/storage/jobs vendors, synchronization,
Higgsfield integration, browser capture, FFmpeg placement, audit authority, and
MCP tenancy all remain explicit owner decisions.
