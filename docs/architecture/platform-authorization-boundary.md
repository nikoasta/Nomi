# Platform authorization boundary

Status: contract freeze for `evmedia-r20.9.1`; cloud topology and authentication architecture are **UNAPPROVED**.

Evidence snapshot: repository commit `dc9c643a30016b0fc0355e338732e3836a9250d4`, inspected 2026-07-18.

## Scope and decision constraints

- This is a reversible, runtime-neutral application contract. It does not establish a network security boundary or prove the parent `evmedia-r20.9` complete.
- The contract carries principals, memberships, scopes, permissions, requests, and decisions. It never carries access tokens, refresh tokens, cookies, credentials, provider errors, privileged keys, or provider-specific identity objects.
- Authorization is deterministic, deny-by-default, and based on one active organization membership plus exact project membership and explicit permission lists. There are no implicit role, ownership, parent-resource, or administrator grants.
- `organization.admin` is the only organization-administration permission. It does not imply any project, asset, generation-job, review, or approval permission, and ordinary project permissions never imply it.
- Electron continuity is synthetic and local-only. It must not be described as cloud identity, federated identity, persisted organization membership, or evidence that the local user belongs to a real organization.
- Browser identity is unauthenticated and browser authorization is unsupported until a separately approved remote adapter exists.
- No cloud/auth vendor, region, database, object store, deployment target, worker topology, migration, RLS policy, or session-refresh design is selected here.

## Current live runtime boundary

`PlatformClient` currently owns five conversation/asset capabilities and their typed result/error envelope at `src/platform/client.ts:37-64`, with domain methods at `src/platform/client.ts:72-109` and the root interface at `src/platform/client.ts:111-116`.

The composition path is:

1. Renderer code calls `getPlatformClient()`. Conversation write/read call sites are `src/workbench/ai/conversationPersistence.ts:84-113` and `src/workbench/ai/conversationPersistence.ts:139-178`; asset list/file/remote import call sites are `src/workbench/api/assetUploadApi.ts:71-109`.
2. `getPlatformClient()` reads `getDesktopBridge()`, caches by bridge identity, and chooses Electron when the bridge exists or the browser-safe client otherwise at `src/platform/client.ts:144-153`. The only current bridge accessor reads optional `window.nomiDesktop` at `src/desktop/bridge.ts:666-678`.
3. `adaptDesktopBridge()` preserves the existing conversation and asset payloads at `src/platform/client.ts:118-142`. The Electron adapter detects available methods and normalizes results at `src/platform/electronPlatformClient.ts:164-216`; the current browser adapter advertises no capabilities and returns typed `UNSUPPORTED_CAPABILITY` at `src/platform/browserPlatformClient.ts:3-30`.
4. The preload forwards asset operations at `electron/preload.ts:63-79` and conversations at `electron/preload.ts:290-294`. Main routes asset operations at `electron/main.ts:593-607` and registers conversation IPC at `electron/main.ts:652-655`.
5. Conversation IPC resolves the project directory and reads/writes `.nomi/conversations.json` at `electron/conversations/conversationsIpc.ts:17-55`. Local file import validates the project and bytes at `electron/assets/localFileImport.ts:7-25`; remote import and listing validate explicit project IDs and persist/list project assets at `electron/assets/projectAssetStore.ts:156-199` and `electron/assets/projectAssetStore.ts:201-263`.

Authorization extends step 3 only. It does not replace current IPC validation, filesystem isolation, or explicit `projectId` arguments. The renderer-side Electron adapter is a compatibility boundary, not an adversarial security boundary; future remote enforcement remains parent work.

## Public modules and exported contracts

Create `src/platform/authorization/contracts.ts` with exactly these public names. It must import no Electron, DOM, Node, provider, transport, or persistence types.

```ts
export const AUTHORIZATION_PERMISSIONS = [
  'organization.admin',
  'project.read',
  'project.write',
  'asset.read',
  'asset.write',
  'generation-job.read',
  'generation-job.create',
  'generation-job.cancel',
  'review.read',
  'review.write',
  'approval.read',
  'approval.decide',
] as const

export type AuthorizationPermission = (typeof AUTHORIZATION_PERMISSIONS)[number]
export type OrganizationPermission = 'organization.admin'
export type ProjectPermission = Exclude<AuthorizationPermission, OrganizationPermission>

export type AuthenticatedPrincipal = {
  id: string
  kind: 'human' | 'local-runtime'
  displayName?: string
}

export type ProjectAuthorization = {
  projectId: string
  permissions: readonly ProjectPermission[]
}

export type OrganizationMembership = {
  principalId: string
  organizationId: string
  status: 'active' | 'inactive'
  organizationPermissions: readonly OrganizationPermission[]
  projects: readonly ProjectAuthorization[]
}

export type PlatformSession =
  | { state: 'unauthenticated' }
  | {
      state: 'authenticated'
      principal: AuthenticatedPrincipal
      activeMembership: OrganizationMembership | null
    }

export type OrganizationResourceScope = {
  kind: 'organization'
  organizationId: string
}

export type ProjectResourceScope = {
  kind: 'project'
  organizationId: string
  projectId: string
}

export type AuthorizationResource =
  | { family: 'organization'; scope: OrganizationResourceScope }
  | { family: 'project'; scope: ProjectResourceScope }
  | {
      family: 'asset' | 'generation-job' | 'review' | 'approval'
      resourceId: string
      scope: ProjectResourceScope
    }

export type AuthorizationCheckRequest = {
  resource: AuthorizationResource
  permission: AuthorizationPermission
}

export type AuthorizationPolicyRequest = AuthorizationCheckRequest & {
  session: PlatformSession
}

export type AuthorizationAllowReason = 'ALLOW_EXPLICIT_PERMISSION'

export type AuthorizationDenyReason =
  | 'DENY_MALFORMED_REQUEST'
  | 'DENY_UNAUTHENTICATED'
  | 'DENY_NO_ACTIVE_MEMBERSHIP'
  | 'DENY_INACTIVE_MEMBERSHIP'
  | 'DENY_PRINCIPAL_MISMATCH'
  | 'DENY_ORGANIZATION_SCOPE_MISMATCH'
  | 'DENY_PROJECT_SCOPE_MISMATCH'
  | 'DENY_PERMISSION_NOT_APPLICABLE'
  | 'DENY_PERMISSION_NOT_GRANTED'

export type AuthorizationDecision =
  | { allowed: true; reason: AuthorizationAllowReason }
  | { allowed: false; reason: AuthorizationDenyReason }
```

`PlatformSession` deliberately has no session ID or expiry/refresh fields. Those concepts require an approved authentication lifecycle. `displayName` is optional presentation data, not an authorization input.

Create `src/platform/authorization/policy.ts` with one public function:

```ts
export function evaluateAuthorization(request: AuthorizationPolicyRequest): AuthorizationDecision
```

The implementation must treat its runtime input as untrusted despite the TypeScript signature, must not mutate it, must not read clocks or process/environment state, and must never throw. Any malformed or accessor-throwing value returns `DENY_MALFORMED_REQUEST`.

## Permission compatibility

Only the following permission/resource combinations are applicable:

| Resource family | Applicable permissions |
| --- | --- |
| `organization` | `organization.admin` |
| `project` | `project.read`, `project.write` |
| `asset` | `asset.read`, `asset.write` |
| `generation-job` | `generation-job.read`, `generation-job.create`, `generation-job.cancel` |
| `review` | `review.read`, `review.write` |
| `approval` | `approval.read`, `approval.decide` |

An otherwise valid permission used against another family returns `DENY_PERMISSION_NOT_APPLICABLE`; it is not reinterpreted as a broader read/write action.

## Deterministic policy

`evaluateAuthorization` applies this exact first-match order:

1. Validate the complete request shape. On failure, deny `DENY_MALFORMED_REQUEST`.
2. If `session.state` is `unauthenticated`, deny `DENY_UNAUTHENTICATED`.
3. If `activeMembership` is `null`, deny `DENY_NO_ACTIVE_MEMBERSHIP`.
4. If membership status is not `active`, deny `DENY_INACTIVE_MEMBERSHIP`.
5. If `membership.principalId !== principal.id`, deny `DENY_PRINCIPAL_MISMATCH`.
6. If the resource organization differs from `membership.organizationId`, deny `DENY_ORGANIZATION_SCOPE_MISMATCH`.
7. If the requested permission is not applicable to the resource family, deny `DENY_PERMISSION_NOT_APPLICABLE`.
8. For an organization resource, allow only when `organizationPermissions` contains the exact requested permission; otherwise deny `DENY_PERMISSION_NOT_GRANTED`.
9. For a project-scoped resource, find a `ProjectAuthorization` with `projectId === resource.scope.projectId`. If none exists, deny `DENY_PROJECT_SCOPE_MISMATCH`.
10. Allow `ALLOW_EXPLICIT_PERMISSION` only when that project's permission list contains the exact requested permission; otherwise deny `DENY_PERMISSION_NOT_GRANTED`.

Validation is also fail-closed and deterministic:

- IDs and optional `displayName` must be primitive strings. IDs must equal their trimmed value, be non-empty, and be at most 256 code units. A present `resourceId` follows the same rule.
- Discriminants and permissions must exactly match the literals above. Arrays must be real arrays, every member must validate, and duplicate project IDs or duplicate permissions make the request malformed.
- Organization resources require organization scope. Every other resource family requires project scope. Only asset, generation-job, review, and approval resources carry `resourceId`.
- `organizationPermissions` may contain only `organization.admin`; project permission arrays may contain only `ProjectPermission` values. Unknown values are malformed, not ignored.
- Extra object properties are ignored for forward-compatible parsing, but they never contribute authority. Getters/proxies that throw are caught by the evaluator and produce `DENY_MALFORMED_REQUEST`.
- The policy compares strings exactly and performs no case folding, Unicode normalization, prefix matching, wildcard matching, or hierarchy inference.

The decision includes no message, provider diagnostic, membership data, or resource data. Callers branch only on `allowed` and the stable reason code.

## PlatformClient extension

Extend `PlatformCapability` in `src/platform/client.ts` with:

```ts
| 'identity.session.read'
| 'authorization.check'
```

Capability iteration order is stable: `identity.session.read`, `authorization.check`, `conversations.read`, `conversations.write`, `assets.list`, `assets.import-file`, `assets.import-remote-url`. Electron includes the first two plus whichever existing bridge-backed capabilities are present; browser includes only `identity.session.read`.

Export these root service contracts from `src/platform/client.ts` and add them to `PlatformClient`:

```ts
export type PlatformIdentity = {
  getSession(): Promise<PlatformResult<PlatformSession>>
}

export type PlatformAuthorization = {
  check(request: AuthorizationCheckRequest): Promise<PlatformResult<AuthorizationDecision>>
}

export type PlatformClient = {
  readonly capabilities: ReadonlySet<PlatformCapability>
  supports(capability: PlatformCapability): boolean
  readonly identity: PlatformIdentity
  readonly authorization: PlatformAuthorization
  readonly conversations: PlatformConversations
  readonly assets: PlatformAssets
}
```

`AuthorizationCheckRequest` intentionally omits session and membership. Feature code supplies only the action and resource; the adapter supplies trusted runtime identity context. `PlatformResult` still represents whether a runtime can perform the check. `AuthorizationDecision` represents the policy outcome after a supported check. A denial is therefore a successful `PlatformResult` containing `{ allowed: false, ... }`, never a `PERMISSION_DENIED` platform error.

## Runtime adapter behavior

### Electron local continuity

`createElectronPlatformClient()` retains its injected bridge and current conversation/asset behavior. It additionally advertises `identity.session.read` and `authorization.check` without adding IPC or reading a cloud identity source.

`identity.getSession()` resolves to this synthetic session:

```ts
{
  state: 'authenticated',
  principal: {
    id: 'local-runtime:principal',
    kind: 'local-runtime',
    displayName: 'Local runtime',
  },
  activeMembership: {
    principalId: 'local-runtime:principal',
    organizationId: 'local-runtime:organization',
    status: 'active',
    organizationPermissions: [],
    projects: [],
  },
}
```

`authorization.check()` uses `evaluateAuthorization`. For each well-formed project-scoped request whose organization is exactly `local-runtime:organization`, it builds an ephemeral copy of the synthetic membership containing one `ProjectAuthorization` for the request's exact `projectId` and all defined `ProjectPermission` values. This preserves existing access to explicitly named local projects while keeping every decision project-scoped. The ephemeral grant is never persisted, returned from `identity.getSession()`, or represented as real organization membership.

Organization administration remains denied because the synthetic membership has no `organization.admin`. Requests for another organization deny `DENY_ORGANIZATION_SCOPE_MISMATCH`; malformed requests and incompatible permission/resource pairs deny through the normal policy. Project existence is still validated by the existing downstream repositories/IPC; authorization does not turn a nonexistent project into an existing one.

The local adapter's result is compatibility evidence only. It must never be accepted by a future remote adapter, server, RLS policy, or cross-device synchronization flow as an authenticated organization claim.

### Browser-safe placeholder

`createBrowserPlatformClient()` remains import-safe with no Electron, Node, `window`, cookie, or provider dependency.

- It advertises `identity.session.read` and returns `{ ok: true, value: { state: 'unauthenticated' } }` from `identity.getSession()`.
- It does not advertise `authorization.check`; `authorization.check()` resolves to `PlatformResult` failure with `code: 'UNSUPPORTED_CAPABILITY'`, `capability: 'authorization.check'`, and `retryable: false`.
- Existing conversation and asset methods retain their current typed unsupported behavior.
- It does not synthesize a remote principal, accept a caller-supplied membership, inspect browser storage, or infer authorization from UI state.

## Invariants and compatibility constraints

1. Absence, malformed input, unknown values, and adapter uncertainty always deny or return unsupported; none can allow.
2. A principal authorizes only through the one membership carried by the evaluated session. Principal and membership IDs must match exactly.
3. Organization and project isolation are independent checks. Matching a project ID never repairs an organization mismatch.
4. Every allow is caused by one exact permission in the exact applicable permission list. No permission implies another permission.
5. `organization.admin` is not a superuser bypass and ordinary permissions cannot administer an organization.
6. Resource identifiers and scopes remain explicit call arguments. Adapters must not silently replace a caller's project ID with active UI state.
7. Contracts and decisions contain no secrets or provider diagnostics. Existing `PlatformError.details` remains bounded and non-authoritative for authorization.
8. Supported policy denials resolve as `PlatformResult` success. Unsupported runtime capability resolves as `PlatformResult` failure. These states are never collapsed into empty data or a generic platform permission error.
9. Existing Electron payloads, IPC channel names, conversation files, asset files, DTOs, error normalization, and call-site behavior remain unchanged by this slice.
10. The local synthetic identity is process-local compatibility state. It proves neither persistence nor remote identity and cannot cross a future trust boundary.

## Test-author contract

Tests may be written without reading implementation against these paths and names:

- `src/platform/authorization/contracts.test.ts`: literal unions, resource shapes, and secret-free transport-neutral values from `contracts.ts`.
- `src/platform/authorization/policy.test.ts`: the exact decision order, all resource families, all applicable permissions, anonymous/null/inactive/mismatched membership cases, cross-organization, cross-project, missing permission, admin separation, malformed/hostile values, determinism, immutability, and no throws.
- `src/platform/platformAuthorization.adapters.test.ts`: synthetic Electron session, local project-scoped continuity, denied local organization administration, foreign-organization denial, browser unauthenticated identity, browser unsupported authorization, and capability sets.
- `src/platform/platformAuthorization.boundary.test.ts`: no provider SDK/types, token/cookie/credential fields, privileged-service concepts, Node/Electron/DOM imports in `contracts.ts` or `policy.ts`, and no browser import of desktop/Electron modules.

The initial test run must be recorded RED before implementation. Focused tests, typecheck, lint, build, full `pnpm run gates`, and an independent spec-to-diff review remain required after implementation; this document alone satisfies none of those gates.

## Non-goals and later parent work

This slice does not implement real organization authentication, membership persistence, invitations, role management, billing, publishing, service principals, session expiry/refresh/revocation, account linking, cloud API transport, server middleware, database schema, migrations, RLS, object-store policy, generation-worker identity, privileged-key custody, audit-log persistence, or production observability.

It does not authorize the six `everville-media-platform-*` RFC drafts, choose among their candidate topologies, edit their conclusions, or remove the approval breakpoint. It also does not migrate existing conversation/asset operations to a cloud backend or add authorization to unrelated direct `DesktopBridge` surfaces.

Parent `evmedia-r20.9` remains open for an approved identity provider and session lifecycle, authoritative organization/project membership storage, server-side enforcement, RLS or equivalent data-plane controls, privileged server-only operations, revocation, auditability, and end-to-end hostile-client verification. Any approved remote adapter must replace the browser placeholder without weakening the contracts or treating Electron's synthetic identity as portable authority.
