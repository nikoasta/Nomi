/**
 * @process everville-platform-assets
 * @description Reversible, vendor-neutral asset identity, version, provenance, and runtime-resolution slice for Nomi.
 * @inputs { projectRoot: string, beadId: string }
 * @outputs { success: boolean, beadId: string, review: object, commit?: string, reason?: string }
 * @process methodologies/spec-kit-brownfield.js
 * @process methodologies/tdd.js
 * @process specializations/qa-testing-automation/contract-testing.js
 * @process methodologies/superpowers/verification-before-completion.js
 * @skill methodologies/cc10x/skills/test-driven-development/SKILL.md
 * @skill specializations/qa-testing-automation/skills/pact-contract-testing/SKILL.md
 * @agent methodologies/rpikit/agents/security-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk'

const boundaryPath = 'docs/architecture/platform-assets-boundary.md'
const contractTestPaths = [
  'src/platform/assets/contracts.test.ts',
  'src/platform/assets/runtime.contract.test.ts',
  'src/platform/platformAssetRecords.adapters.test.ts',
  'src/platform/platformAssetRecords.boundary.test.ts',
  'electron/assets/projectAssetStore.identity.test.ts',
]
const adapterHarnessPath = 'src/platform/platformAssetRecords.adapters.test.ts'
const finalSecurityTestPath = 'electron/assets/projectAssetStore.identity.test.ts'
const finalSecurityImplementationPath = 'electron/assets/projectAssetStore.ts'
const projectSessionPath = 'src/workbench/project/workbenchProjectSession.ts'
const scopeRefreezeTestPath = 'src/platform/platformClient.contract.test.ts'
const implementationPaths = [
  'src/platform/assets/contracts.ts',
  'src/platform/assets/runtime.ts',
  'electron/assets/assetIdentity.ts',
  'electron/assets/projectAssetStore.ts',
  'src/platform/client.ts',
  'src/platform/browserPlatformClient.ts',
  'src/platform/electronPlatformClient.ts',
  'src/desktop/bridge.ts',
  'electron/preload.ts',
  'electron/main.ts',
  'src/workbench/api/assetUploadApi.ts',
  'src/workbench/assets/useAllProjectAssets.ts',
]
const generatedCompilerArtifactPaths = [
  'src/desktop/bridge.js',
  'src/desktop/bridge.js.map',
  'src/desktop/providerKind.js',
  'src/desktop/providerKind.js.map',
  'src/platform/assets/contracts.js',
  'src/platform/assets/contracts.js.map',
  'src/platform/assets/runtime.js',
  'src/platform/assets/runtime.js.map',
  'src/platform/authorization/contracts.js',
  'src/platform/authorization/contracts.js.map',
  'src/platform/authorization/policy.js',
  'src/platform/authorization/policy.js.map',
  'src/platform/browserPlatformClient.js',
  'src/platform/browserPlatformClient.js.map',
  'src/platform/client.js',
  'src/platform/client.js.map',
  'src/platform/electronPlatformClient.js',
  'src/platform/electronPlatformClient.js.map',
]
const mutableCompatibilityTestPaths = [
  'src/platform/platformClient.contract.test.ts',
  'src/platform/platformClient.boundary.test.ts',
]
const protectedCompatibilityTestPaths = [
  'src/platform/platformClient.composition.test.ts',
  'src/platform/platformClient.facades.test.ts',
  'src/platform/platformAuthorization.adapters.test.ts',
  'src/platform/generation/provider.contract.test.ts',
  'src/platform/generation/browserGenerationProvider.test.ts',
  'electron/runtime.assets.test.ts',
  'electron/assets/assetPaths.test.ts',
  'src/workbench/assets/assetLibrarySources.test.ts',
]
const compatibilityTestPaths = [...mutableCompatibilityTestPaths, ...protectedCompatibilityTestPaths]
const processDefinitionPaths = [
  '.a5c/processes/everville-platform-assets.js',
  '.a5c/processes/everville-platform-assets.inputs.json',
]
const frozenRfcPaths = [
  'docs/architecture/everville-media-platform-acceptance-matrix.md',
  'docs/architecture/everville-media-platform-cloud-options.md',
  'docs/architecture/everville-media-platform-decision-brief.md',
  'docs/architecture/everville-media-platform-rfc.md',
  'docs/architecture/everville-media-platform-runtime-audit.md',
  'docs/architecture/everville-media-platform-security-data.md',
]

const protectedRfcHashBaseline = `6e2798d63392443f0a6421cbc6e04b236d9338ed900f2707a40db0b611a52d36  docs/architecture/everville-media-platform-acceptance-matrix.md
f8f1196f010a47505b5ccea0368fea12e83fe2ef02e863dbe9d9d94a748c4b95  docs/architecture/everville-media-platform-cloud-options.md
cf25c90aa2310cb885141910cb7a6ec67af2b33b85d57782ce25e0b1cd8752d0  docs/architecture/everville-media-platform-decision-brief.md
8a3be9f1a3285ac94ba6b21e220684ee71841797c1b0a1b990559c66998816e2  docs/architecture/everville-media-platform-rfc.md
84b06c1cbf50e3e15494e3261da51c214a2cd2d06748a575dd089904ce74cd77  docs/architecture/everville-media-platform-runtime-audit.md
61c8c195b1a6064fb84b1bdd16b249c18694d8838d676493fc42f6ffdb273c35  docs/architecture/everville-media-platform-security-data.md`

const milestonePaths = [
  '.a5c/processes/everville-platform-assets.js',
  boundaryPath,
  ...contractTestPaths,
  ...implementationPaths,
  ...mutableCompatibilityTestPaths,
]
const reviewCodePaths = [boundaryPath, ...contractTestPaths, ...implementationPaths, ...mutableCompatibilityTestPaths]
const requiredChangedPaths = [
  boundaryPath,
  ...contractTestPaths,
  'src/platform/assets/contracts.ts',
  'src/platform/assets/runtime.ts',
  'electron/assets/assetIdentity.ts',
]
const allowedDirtyPaths = ['.beads/interactions.jsonl', ...milestonePaths, ...frozenRfcPaths]
const reviewRecoveryImplementationPaths = [...implementationPaths, projectSessionPath]
const reviewRecoveryMilestonePaths = [...milestonePaths, projectSessionPath]
const reviewRecoveryCodePaths = [...reviewCodePaths, projectSessionPath]
const reviewRecoveryAllowedDirtyPaths = [...allowedDirtyPaths, projectSessionPath]
const boundaryAllowedPaths = ['.beads/interactions.jsonl', boundaryPath, ...frozenRfcPaths]
const preRedAllowedPaths = ['.beads/interactions.jsonl', boundaryPath, ...contractTestPaths, ...frozenRfcPaths]
const implementationAllowedPaths = [
  '.beads/interactions.jsonl',
  boundaryPath,
  ...contractTestPaths,
  ...implementationPaths,
  ...frozenRfcPaths,
]

function quote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function regexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function checkedShell(parts) {
  return ['set -o pipefail', ...parts].join(' && ')
}

const allowedDirtyPattern = `^(${allowedDirtyPaths.map(regexEscape).join('|')})$`
const boundaryAllowedPattern = `^(${boundaryAllowedPaths.map(regexEscape).join('|')})$`
const preRedAllowedPattern = `^(${preRedAllowedPaths.map(regexEscape).join('|')})$`
const implementationAllowedPattern = `^(${implementationAllowedPaths.map(regexEscape).join('|')})$`
const propertyKeyPrefixPattern = `(^|[,{;[:space:]])["']?`
const propertyKeySuffixPattern = `["']?[?]?[[:space:]]*:`
const credentialPropertyPattern = `${propertyKeyPrefixPattern}(access[_-]?token|refresh[_-]?token|bearer[_-]?token|api[_-]?key|password|credential|client[_-]?secret|service[_-]?role|private[_-]?key)${propertyKeySuffixPattern}`
const secretPropertyPattern = `${propertyKeyPrefixPattern}(secret|authorization|headers?|cookie|access[_-]?token|refresh[_-]?token|bearer[_-]?token|api[_-]?key|password|credential|client[_-]?secret|service[_-]?role|private[_-]?key|raw(Prompt|Response|Payload)|providerResponse)${propertyKeySuffixPattern}`
const locatorPropertyPattern = `${propertyKeyPrefixPattern}(url|uri|locator|path|absolutePath|relativePath|bucket(Key)?|object(Key)?|signedUrl|providerUrl|raw(Prompt|Response|Payload)|credentials?)${propertyKeySuffixPattern}`

function taskIo(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  }
}

function shellTaskPassed(result) {
  return result?.exitCode === 0
}

function isEmptyUnexpectedMilestoneWrites(result) {
  const output = `${result?.stdout ?? ''}\n${result?.stderr ?? ''}`.trim()
  return result?.exitCode !== 0 && /Unexpected milestone writes:\s*$/.test(output)
}

function unexpectedMilestoneWritesInclude(result, path) {
  if (result?.exitCode === 0) return false
  const output = `${result?.stdout ?? ''}\n${result?.stderr ?? ''}`
  const marker = 'Unexpected milestone writes:'
  const markerIndex = output.lastIndexOf(marker)
  if (markerIndex < 0) return false
  return output
    .slice(markerIndex + marker.length)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .includes(path)
}

function reviewPassed(review) {
  return (
    review?.passed === true &&
    Number.isFinite(review?.score) &&
    review.score >= 90 &&
    review.score <= 100 &&
    Array.isArray(review?.blockers) &&
    review.blockers.length === 0
  )
}

function reviewHasActionableBlockers(review) {
  return (
    review?.passed === false &&
    Array.isArray(review?.blockers) &&
    review.blockers.length > 0 &&
    review.blockers.every((blocker) => /^.+:\d+\s+-\s+.+$/.test(blocker))
  )
}

function reviewRequiresScopeRefreeze(review) {
  if (!Array.isArray(review?.blockers)) return false
  return review.blockers.some(
    (blocker) => blocker.startsWith(`${boundaryPath}:`) || blocker.startsWith(`${projectSessionPath}:`),
  )
}

function remediationMadeProgress(remediation) {
  return (
    Array.isArray(remediation?.filesModified) &&
    remediation.filesModified.length > 0 &&
    Array.isArray(remediation?.blockersResolved) &&
    remediation.blockersResolved.length > 0
  )
}

function remediationVerifiedNoOp(remediation, review) {
  const blockers = Array.isArray(review?.blockers) ? review.blockers : []
  return (
    blockers.length > 0 &&
    Array.isArray(remediation?.filesModified) &&
    remediation.filesModified.length === 0 &&
    Array.isArray(remediation?.blockersVerified) &&
    remediation.blockersVerified.length >= blockers.length &&
    remediation.blockersVerified.every((finding) => typeof finding === 'string' && finding.trim().length > 0) &&
    Array.isArray(remediation?.blockersResolved) &&
    remediation.blockersResolved.length >= blockers.length &&
    remediation.blockersResolved.every((finding) => typeof finding === 'string' && finding.trim().length > 0) &&
    typeof remediation?.summary === 'string' &&
    remediation.summary.trim().length > 0
  )
}

function reviewRequiresAdapterHarnessRefreeze(review) {
  return (
    Array.isArray(review?.blockers) && review.blockers.some((blocker) => blocker.startsWith(`${adapterHarnessPath}:`))
  )
}

function reviewContradictsCurrentEvidence(review, focusedGate, frozenTestHashes) {
  if (!shellTaskPassed(focusedGate) || !Array.isArray(review?.blockers)) return false
  const blockers = review.blockers.join('\n')
  const currentAdapterHash = frozenTestHashes?.stdout
    ?.split('\n')
    .find((line) => line.endsWith(`  ${adapterHarnessPath}`))
    ?.split(' ')[0]
  const contradictsGreenGate =
    /(?:focused gate evidence|supplied focused gate|focused gate).*(?:exit(?:Code)?\s*1|exits?\s*1|is\s+red|not\s+pass)|no passing focused gate/i.test(
      blockers,
    )
  const contradictsCurrentHarness = Boolean(
    currentAdapterHash && blockers.includes(currentAdapterHash.slice(0, 8)) && blockers.includes('2d3960e1'),
  )
  return contradictsGreenGate || contradictsCurrentHarness
}

function reviewEvidenceReady(result) {
  return (
    shellTaskPassed(result) &&
    typeof result?.stdout === 'string' &&
    result.stdout.trim().length > 0 &&
    result.stdout.includes('--- REVIEW RECENCY NONCE AND TREE MANIFEST ---') &&
    result.stdout.includes('--- FOCUSED GATE SUMMARY ---') &&
    result.stdout.includes('--- CURRENT TRACKED REVIEW CODE DIFF ---') &&
    result.stdout.includes('--- UNTRACKED REVIEW CODE ARTIFACTS ---')
  )
}

const readSpecTask = defineTask('read-platform-assets-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.beadId} and dependency specifications verbatim`,
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      `test "$(bd show ${quote(args.beadId)} --json | jq -r '.[0].status')" = in_progress`,
      'for id in evmedia-r20.2.1 evmedia-r20.7.1 evmedia-r20.9.1; do test "$(bd show "$id" --json | jq -r \'.[0].status\')" = closed || { echo "Prerequisite $id is not closed"; exit 1; }; done',
      'for id in evmedia-r20.2 evmedia-r20.7 evmedia-r20.9; do test "$(bd show "$id" --json | jq -r \'.[0].status\')" = open || { echo "Prerequisite parent $id is not open"; exit 1; }; done',
      'test "$(bd show evmedia-r20.8 --json | jq -r \'.[0].status\')" = open',
      'test "$(bd show evmedia-r20.4 --json | jq -r \'.[0].status\')" = in_progress',
      `spec=$(bd show ${quote(args.beadId)})`,
      'test -n "$spec"',
      `printf '%s\n' "$spec"`,
      "printf '\\n--- ASSET PARENT ---\\n'",
      'bd show evmedia-r20.8',
      "printf '\\n--- PLATFORM CLIENT PARENT ---\\n'",
      'bd show evmedia-r20.2',
      "printf '\\n--- AUTHORIZATION PARENT ---\\n'",
      'bd show evmedia-r20.9',
      "printf '\\n--- GENERATION PARENT ---\\n'",
      'bd show evmedia-r20.7',
      "printf '\\n--- RFC STATE ---\\n'",
      'bd show evmedia-r20.4',
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'runtime-read', 'spec'],
}))

const hashFrozenRfcTask = defineTask('hash-platform-assets-frozen-rfcs', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze the six unapproved RFC drafts',
  shell: {
    command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')}) && test "$current" = ${quote(protectedRfcHashBaseline)} && printf '%s\\n' "$current"`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'rfc', 'shell'],
}))

const freshStartTask = defineTask('platform-assets-fresh-start', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify a clean bounded start for the asset milestone',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
      `for file in ${processDefinitionPaths.map(quote).join(' ')}; do git ls-files --error-unmatch "$file" >/dev/null || { echo "Untracked process definition: $file"; exit 1; }; done`,
      `git diff --quiet HEAD -- ${processDefinitionPaths.map(quote).join(' ')} || { echo "Process definition differs from committed revision"; exit 1; }`,
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(`^(.beads/interactions\\.jsonl|${frozenRfcPaths.map(regexEscape).join('|')})$`)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected pre-existing writes:\\n%s\\n" "$unexpected"; exit 1; }',
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['git', 'preflight', 'scope', 'shell'],
}))

const preflightTask = defineTask('platform-assets-runtime-preflight', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace the live asset path and planned path collisions',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      "printf '%s\\n' '--- EXACT PATH COLLISION CHECK ---'",
      `for file in ${milestonePaths.map(quote).join(' ')}; do if [ -e "$file" ]; then echo "EXISTS $file"; else echo "NEW $file"; fi; done`,
      "printf '%s\\n' '--- LIVE ASSET PATH ---'",
      `for file in ${[
        'src/workbench/api/assetUploadApi.ts',
        'src/platform/client.ts',
        'src/platform/electronPlatformClient.ts',
        'src/platform/browserPlatformClient.ts',
        'src/desktop/bridge.ts',
        'electron/preload.ts',
        'electron/main.ts',
        'electron/assets/projectAssetStore.ts',
        'electron/assets/assetPaths.ts',
        'src/workbench/assets/useAllProjectAssets.ts',
        'src/workbench/assets/assetTypes.ts',
        'src/workbench/assets/useAssetPool.ts',
      ]
        .map(quote)
        .join(' ')}; do printf '\\n--- %s ---\\n' "$file"; sed -n '1,380p' "$file"; done`,
      "printf '%s\\n' '--- URL AND ID COUPLING ---'",
      `rg -n "nomi-local://|file://|blob:|absolutePath|relativePath|stableAssetId|assetId|renderUrl|providerUrl" src/workbench src/platform electron/assets electron/export | sed -n '1,700p'`,
      "printf '%s\\n' '--- EXISTING TESTS ---'",
      `for file in ${compatibilityTestPaths.map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; sed -n '1,360p' "$file"; done`,
    ]),
    expectedExitCode: 0,
    timeoutMs: 120000,
  },
  io: taskIo(taskCtx),
  labels: ['brownfield', 'preflight', 'runtime-call-path', 'shell'],
}))

const boundaryTask = defineTask('design-platform-assets-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document the reversible asset-domain boundary',
  agent: {
    name: 'platform-assets-architect',
    prompt: {
      role: 'staff TypeScript platform architect',
      task: `Write only ${boundaryPath} as the implementation contract for the current Beads child.`,
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        preflightVerbatim: args.preflight,
      },
      instructions: [
        'Treat the Beads acceptance text as authoritative and the runtime preflight as current-state evidence.',
        'Trace import -> sidecar identity/version -> list -> runtime resolve -> asset-library display with exact file paths and functions.',
        'Define opaque path-independent Asset and AssetVersion IDs, organization/project scope, immutable digest/size/MIME, truthful provenance, validation/quarantine, lineage, and ephemeral resolution.',
        'Specify a distinct PlatformClient assetRecords service. Preserve the legacy assets facade and existing local renderer behavior.',
        'For existing sidecars without platform identity, retain the legacy compatibility path and mark migration as parent work. Do not invent stable historical identity or rewrite old files.',
        'Document authorization checks, hostile inputs, serialization bans, idempotency expectations, compatibility, non-goals, exact planned files, and deterministic acceptance tests.',
        'Do not choose a cloud/storage/auth vendor, add migrations/RLS, modify an RFC draft, or claim the parent complete.',
        `Edit exactly ${boundaryPath}. Do not edit source, tests, Beads, package files, lockfiles, or the six frozen RFC drafts.`,
      ],
      outputFormat: 'JSON with filesModified, runtimeCallPaths, contracts, risks, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'runtimeCallPaths', 'contracts', 'risks', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        contracts: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'architecture', 'brownfield', 'runtime-call-path'],
}))

const readBoundaryTask = defineTask('read-platform-assets-boundary', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read the asset boundary verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && test -s ${quote(boundaryPath)} && cat ${quote(boundaryPath)}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['boundary', 'runtime-read', 'shell'],
}))

const boundaryScopeTask = defineTask('verify-platform-assets-boundary-scope', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze the boundary before test authoring',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(boundaryAllowedPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected boundary writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `test -s ${quote(boundaryPath)}`,
      `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
      `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['boundary', 'frozen-input', 'scope', 'shell'],
}))

const testsScopeTask = defineTask('verify-platform-assets-tests-scope', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze the authored tests before RED',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(preRedAllowedPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected pre-RED writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `for file in ${contractTestPaths.map(quote).join(' ')}; do test -s "$file" || { echo "Missing test $file"; exit 1; }; done`,
      `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
      `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
      `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
      `git diff --quiet HEAD -- ${[...implementationPaths, ...mutableCompatibilityTestPaths].map(quote).join(' ')}`,
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['frozen-input', 'scope', 'shell', 'tdd'],
}))

const authorTestsTask = defineTask('author-platform-assets-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author frozen asset-domain tests before implementation',
  agent: {
    name: 'platform-assets-test-author',
    prompt: {
      role: 'senior TypeScript contract and application-security test engineer',
      task: 'Author the complete acceptance and hostile-input test suite before implementation exists.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
      },
      instructions: [
        'Do not read implementation directories. Author tests strictly from SPEC and BOUNDARY above.',
        `Create or edit exactly these tests: ${contractTestPaths.join(', ')}. Do not touch any implementation file.`,
        'Cover opaque/path-independent IDs, immutable version identity, digest/size/MIME, scope, provenance variants, validation/quarantine, predecessor and derivation lineage, runtime resolution, and legacy-unverified truthfulness.',
        'Add hostile tests for URL/path/control/traversal IDs, locator serialization, scope mismatch without existence leakage, forged trusted fields, digest/size/MIME mismatch, lineage cycles, cross-asset predecessors, duplicate derivations, raw secret/provider payloads, and browser import safety.',
        'In projectAssetStore.identity.test.ts, parse the newly persisted identity sidecar as JSON and recursively reject locator/storage keys plus secret, authorization, headers, cookie, credential, token, raw prompt/response/payload, and provider response fields. Prove legacy path metadata remains only in the legacy projection and is not copied into the stable domain record.',
        'Cover the vertical compatibility path: new local import identity survives list projection; assetRecords resolution returns ephemeral nomi-local only in Electron; legacy assets remain available through the old facade; browser returns typed unsupported.',
        'Every new suite must collect before implementation exists: dynamically import planned new modules or exports inside test bodies, never through a missing top-level import. Each suite must contain at least one intentional behavioral RED assertion.',
        'Before any dynamic import of a missing planned file or export, fail through an explicit assertion whose message starts RED_CONTRACT: and names the suite contract. Never let module resolution, transform, or loader errors represent RED.',
        'Use deterministic fixtures and property tests where valuable. Do not weaken existing tests or assert cloud-provider behavior.',
        'Do not execute the generated tests. The orchestrator will hash them first, then run each suite independently to capture RED. Do not implement production code.',
      ],
      outputFormat: 'JSON with filesModified, testsAuthored, expectedFailures, commandsRun, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'testsAuthored', 'expectedFailures', 'commandsRun', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        testsAuthored: { type: 'array', items: { type: 'string' } },
        expectedFailures: { type: 'array', items: { type: 'string' } },
        commandsRun: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'frozen-input', 'security', 'tdd', 'tests-first'],
}))

const redGateTask = defineTask('record-platform-assets-red', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record deterministic RED evidence',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      `for file in ${contractTestPaths.map(quote).join(' ')}; do test -s "$file" || { echo "Missing test $file"; exit 1; }; done`,
      `for file in ${contractTestPaths.map(quote).join(' ')}; do
        log=$(mktemp)
        code=0
        if NO_COLOR=1 pnpm exec vitest run "$file" >"$log" 2>&1; then
          code=0
        else
          code=$?
        fi
        printf '\n--- RED %s (exit %s) ---\n' "$file" "$code"
        cat "$log"
        test "$code" -ne 0 || { echo "Expected RED but $file passed"; /usr/bin/trash "$log"; exit 1; }
        if rg -q "No test files found|Failed Suites|SyntaxError|Failed to parse|Parse failure|Cannot find module|Failed to load url|ERR_MODULE_NOT_FOUND" "$log"; then
          echo "Invalid RED infrastructure failure in $file"
          /usr/bin/trash "$log"
          exit 1
        fi
        rg -q "Test Files.*failed" "$log" || { echo "No failed collected test file for $file"; /usr/bin/trash "$log"; exit 1; }
        rg -q "Tests.*failed" "$log" || { echo "No intentional failing test for $file"; /usr/bin/trash "$log"; exit 1; }
        rg -q "RED_CONTRACT:" "$log" || { echo "No explicit RED_CONTRACT assertion for $file"; /usr/bin/trash "$log"; exit 1; }
        /usr/bin/trash "$log"
      done`,
    ]),
    expectedExitCode: 0,
    timeoutMs: 180000,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'red', 'shell', 'tdd'],
}))

const hashPathsTask = defineTask('hash-platform-assets-paths-v3', (args, taskCtx) => ({
  kind: 'shell',
  title: `Freeze ${args.label}`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${args.paths.map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'hash', 'shell'],
}))

const hashCurrentReviewTreeTask = defineTask(
  'hash-platform-assets-review-tree-recency-v16-scope-recovery-20260719',
  (args, taskCtx) => ({
  kind: 'shell',
  title: `Freeze current review tree ${args.reviewNonce}`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'hash', 'recency', 'review', 'shell'],
  }),
)

const hashFinalCurrentReviewTreeTask = defineTask(
  'hash-platform-assets-final-review-tree-recency-v7',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Freeze final current review tree ${args.reviewNonce}`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'final-review', 'hash', 'recency', 'review', 'shell'],
  }),
)

const hashCurrentContractTestsTask = defineTask(
  'hash-platform-assets-current-contract-tests-recency-v3-scope-recovery-20260719',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze current asset contract tests before review',
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${contractTestPaths.map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['contract-correction', 'evidence', 'frozen-input', 'hash', 'recency', 'review', 'shell'],
  }),
)

const hashReviewRecoveryBoundaryTask = defineTask(
  'hash-platform-assets-review-recovery-boundary-20260719a',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze the current review-recovery boundary',
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${quote(boundaryPath)}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['boundary', 'evidence', 'frozen-input', 'hash', 'recovery', 'review', 'shell'],
  }),
)

const hashReviewRecoveryCompatibilityTask = defineTask(
  'hash-platform-assets-review-recovery-compatibility-20260719a',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze the current review-recovery compatibility tests',
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['compatibility', 'evidence', 'frozen-input', 'hash', 'recovery', 'review', 'shell'],
  }),
)

const hashReviewRecoveryMilestoneTreeTask = defineTask(
  'hash-platform-assets-review-recovery-milestone-tree-20260719d',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze the current review-recovery milestone tree',
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${reviewRecoveryMilestonePaths.map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'gate', 'hash', 'recovery', 'review', 'shell'],
  }),
)

const verifyReviewRecoveryMilestoneTreeTask = defineTask(
  'verify-platform-assets-review-recovery-milestone-tree-20260719d',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify the review-recovery focused gate preserved the milestone tree',
    shell: {
      command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${reviewRecoveryMilestonePaths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\n' "$current"`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'gate', 'hash', 'recovery', 'review', 'shell'],
  }),
)

const hashPostReviewGateRemediatedTreeTask = defineTask(
  'hash-platform-assets-post-review-gate-remediated-tree-v5',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Freeze post-review gate-remediated tree ${args.attempt}`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'remediation', 'shell'],
  }),
)

const hashFullGateRemediatedTreeTask = defineTask(
  'hash-platform-assets-full-gate-remediated-tree-20260719a',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Freeze full-gate remediated tree ${args.round}`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'remediation', 'shell'],
  }),
)

const hashCurrentExecutableGateTreeTask = defineTask(
  'hash-platform-assets-current-executable-gate-tree-v2',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze current tree before the executable focused gate',
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${milestonePaths.map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'shell'],
  }),
)

const hashCurrentReviewRemediatedTreeTask = defineTask(
  'hash-platform-assets-current-review-remediated-tree-v5',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Freeze current-review remediated tree ${args.attempt}`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'remediation', 'shell'],
  }),
)

const verifyPathHashesTask = defineTask('verify-platform-assets-path-hashes-v3', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify ${args.label} did not change`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${args.paths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\\n' "$current"`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'hash', 'scope', 'shell'],
}))

const verifyFullGateRemediationTreeTask = defineTask(
  'verify-platform-assets-full-gate-remediation-tree-20260719a',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Verify ${args.label} did not change`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${args.paths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\n' "$current"`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'full-gate', 'hash', 'remediation', 'scope', 'shell'],
  }),
)

const verifyFinalReviewTreeTask = defineTask('verify-platform-assets-final-review-tree-v8', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify final review tree ${args.label} did not change`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${args.paths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\n' "$current"`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'final-review', 'frozen-input', 'hash', 'scope', 'shell'],
}))

const verifyCurrentExecutableGateTreeTask = defineTask(
  'verify-platform-assets-current-executable-gate-tree-v2',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify the executable focused gate preserved the current tree',
    shell: {
      command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${milestonePaths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\n' "$current"`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'scope', 'shell'],
  }),
)

const verifyCurrentReviewRemediationTreeTask = defineTask(
  'verify-platform-assets-current-review-remediation-tree-v6',
  (args, taskCtx) => ({
    kind: 'shell',
    title: `Verify current-review remediation gate preserved tree ${args.attempt}`,
    shell: {
      command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${(args.paths ?? milestonePaths).map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\n' "$current"`,
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'gate', 'hash', 'recency', 'remediation', 'scope', 'shell'],
  }),
)

const readTestsTask = defineTask('read-platform-assets-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read frozen tests verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && for file in ${contractTestPaths.map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['frozen-input', 'runtime-read', 'shell', 'tests'],
}))

const implementTask = defineTask('implement-platform-assets-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the asset identity/version/provenance vertical slice',
  agent: {
    name: 'platform-assets-implementer',
    prompt: {
      role: 'staff TypeScript and Electron platform engineer',
      task: 'Implement the full current Beads child against frozen tests without selecting cloud topology.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
        frozenTestsVerbatim: args.tests,
        preflightVerbatim: args.preflight,
      },
      instructions: [
        'Compare SPEC, BOUNDARY, and FROZEN TESTS directly. Do not change their meaning.',
        `Edit only these exact implementation paths: ${implementationPaths.join(', ')}. Create only the three planned new implementation files after confirming they do not exist.`,
        `Do not edit ${boundaryPath}, frozen tests, existing compatibility tests, Beads, RFC drafts, package files, lockfiles, migrations, or generated assets.`,
        'Implement import -> stable sidecar identity/version -> list -> assetRecords projection -> ephemeral resolve -> all-project asset-library display.',
        'Keep PlatformClient.assets behavior-compatible and add a distinct assetRecords service. Browser must return typed unsupported without window/Electron imports.',
        'Newly imported local assets must keep the same logical/version IDs between write and list. Existing sidecars without identity remain legacy compatibility records; do not rewrite historical sidecars or invent trusted facts.',
        'Domain serialization must exclude runtime locators, paths, bucket keys, raw provider payloads, credentials, and raw secret-bearing prompts. Electron may produce nomi-local only in the resolution result.',
        'Use existing authorization permissions and explicit organization/project scope. Preserve Electron local-runtime continuity without claiming cloud authentication.',
        'Do not execute generated code or tests. The orchestrator will freeze implementation bytes first, then run all focused gates. Report exact files and decisions.',
      ],
      outputFormat: 'JSON with filesModified, contractDecisions, compatibilityPreserved, testsRun, risks, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'contractDecisions', 'compatibilityPreserved', 'testsRun', 'risks', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        contractDecisions: { type: 'array', items: { type: 'string' } },
        compatibilityPreserved: { type: 'array', items: { type: 'string' } },
        testsRun: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'brownfield', 'implementation', 'security', 'tdd'],
}))

const implementationScopeTask = defineTask('verify-platform-assets-implementation-scope', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze implementation before compatibility updates',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(implementationAllowedPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected implementation writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `test "$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})" = ${quote(args.testHashes.trim())}`,
      `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
      `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
      `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
      `git diff --quiet HEAD -- ${mutableCompatibilityTestPaths.map(quote).join(' ')}`,
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['frozen-input', 'implementation', 'scope', 'shell'],
}))

const compatibilityTask = defineTask('update-platform-assets-compatibility-contracts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update exact PlatformClient compatibility expectations',
  agent: {
    name: 'platform-assets-compatibility-maintainer',
    prompt: {
      role: 'senior TypeScript compatibility-test maintainer',
      task: 'Update only the explicit PlatformClient capability expectations required by the new assetRecords service.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
        implementationHashes: args.implementationHashes,
      },
      instructions: [
        `Edit exactly these existing tests: ${mutableCompatibilityTestPaths.join(', ')}. Do not edit any other file.`,
        'Add only the new assetRecords capability and its browser/Electron adapter boundary expectations. Preserve every legacy assets assertion and all unrelated exact capability arrays.',
        'Read current source only to match the implemented public shape. Do not change implementation, frozen contract tests, boundary, Beads, RFCs, packages, or lockfiles.',
        'Do not add cloud/storage vendor behavior, migration assumptions, signed URLs, or parent-level claims.',
        'Do not execute the edited tests. The orchestrator will freeze their bytes first, then run all focused gates. Report the exact assertions changed.',
      ],
      outputFormat: 'JSON with filesModified, assertionsChanged, testsRun, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'assertionsChanged', 'testsRun', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        assertionsChanged: { type: 'array', items: { type: 'string' } },
        testsRun: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'compatibility', 'tests'],
}))

const compatibilityScopeTask = defineTask('verify-platform-assets-compatibility-scope', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze compatibility tests and protected artifacts',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(allowedDirtyPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected compatibility writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `test "$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})" = ${quote(args.testHashes.trim())}`,
      `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
      `test "$(shasum -a 256 ${implementationPaths.map(quote).join(' ')})" = ${quote(args.implementationHashes.trim())}`,
      `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
      `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
      `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
      `for file in ${mutableCompatibilityTestPaths.map(quote).join(' ')}; do test -s "$file"; done`,
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['compatibility', 'frozen-input', 'scope', 'shell'],
}))

const createVerifyFrozenTask = (taskId) =>
  defineTask(taskId, (args, taskCtx) => {
    const scopedAllowedDirtyPaths = args.allowedDirtyPaths ?? allowedDirtyPaths
    const scopedAllowedDirtyPattern = `^(${[
      ...scopedAllowedDirtyPaths,
      ...(args.allowCompilerArtifacts ? generatedCompilerArtifactPaths : []),
    ]
      .map(regexEscape)
      .join('|')})$`

    return {
      kind: 'shell',
      title: 'Verify frozen spec artifacts and bounded writes',
      shell: {
        command: checkedShell([
          `cd ${quote(args.projectRoot)}`,
          `currentTests=$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})`,
          `test "$currentTests" = ${quote(args.testHashes.trim())}`,
          `currentBoundary=$(shasum -a 256 ${quote(boundaryPath)})`,
          `test "$currentBoundary" = ${quote(args.boundaryHash.trim())}`,
          `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
          `test "$currentRfcs" = ${quote(args.rfcHashes.trim())}`,
          `currentLedger=$(shasum -a 256 ${quote('.beads/interactions.jsonl')})`,
          `test "$currentLedger" = ${quote(args.ledgerHash.trim())}`,
          `currentCompatibility=$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})`,
          `test "$currentCompatibility" = ${quote(args.compatibilityHashes.trim())}`,
          `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
          'if ! git diff --cached --quiet; then echo "Unexpected staged changes before review"; exit 1; fi',
          `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
          `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(scopedAllowedDirtyPattern)} || true)`,
          'test -z "$unexpected" || { printf "Unexpected milestone writes:\\n%s\\n" "$unexpected"; exit 1; }',
        ]),
        expectedExitCode: 0,
      },
      io: taskIo(taskCtx),
      labels: ['frozen-input', 'scope', 'security', 'shell'],
    }
  })

const verifyFrozenTask = createVerifyFrozenTask('verify-platform-assets-frozen-inputs')
const verifyCurrentReviewRemediationFrozenTask = createVerifyFrozenTask(
  'verify-platform-assets-current-review-remediation-frozen-v5',
)
const verifyReviewRecoveryFrozenTask = createVerifyFrozenTask(
  'verify-platform-assets-review-recovery-frozen-20260719a',
)
const verifyFinalReviewFrozenTask = createVerifyFrozenTask('verify-platform-assets-final-review-frozen-v6')
const verifyFullGateRemediationFrozenTask = createVerifyFrozenTask(
  'verify-platform-assets-full-gate-remediation-frozen-20260719a',
)

const createFocusedGateTask = (taskId, title) =>
  defineTask(taskId, (args, taskCtx) => {
    const gateMilestonePaths = args.milestonePaths ?? milestonePaths
    const gateImplementationPaths = args.implementationPaths ?? implementationPaths
    const gateAllowedDirtyPaths = args.allowedDirtyPaths ?? allowedDirtyPaths
    const gateAllowedDirtyPattern = `^(${gateAllowedDirtyPaths.map(regexEscape).join('|')})$`
    return {
      kind: 'shell',
      title,
      shell: {
        command: checkedShell([
          `cd ${quote(args.projectRoot)}`,
          `currentGateTree=$(shasum -a 256 ${gateMilestonePaths.map(quote).join(' ')})`,
          `test "$currentGateTree" = ${quote(args.frozenTreeHashes.trim())}`,
          `focusedGateTreeDigest=$(printf '%s' "$currentGateTree" | shasum -a 256 | awk '{print $1}')`,
          `printf 'FOCUSED_GATE_TREE_SHA256=%s\n' "$focusedGateTreeDigest"`,
          `pnpm exec vitest run ${[...contractTestPaths, ...compatibilityTestPaths].map(quote).join(' ')}`,
          'pnpm run typecheck',
          `pnpm exec eslint ${[...gateImplementationPaths, ...contractTestPaths, ...mutableCompatibilityTestPaths].map(quote).join(' ')}`,
          'if ! git diff --cached --quiet; then echo "Unexpected staged changes before review"; exit 1; fi',
          `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
          `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(gateAllowedDirtyPattern)} || true)`,
          'test -z "$unexpected" || { printf "Unexpected milestone writes:\\n%s\\n" "$unexpected"; exit 1; }',
          'git diff --quiet -- package.json pnpm-lock.yaml',
          `vendorHits=$(
        for file in ${gateImplementationPaths.map(quote).join(' ')}; do
          if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            git diff --unified=0 HEAD -- "$file" | sed -n '/^+++ /d; /^+/p'
          elif [ -f "$file" ]; then
            sed 's/^/+/' "$file"
          fi
        done | rg -n -i "(@supabase|@vercel|firebase|clerk|auth0|cognito|okta|workos|keycloak|cloudflare|s3|gcs|azure[[:space:]_-]*blob)" || true
      )`,
          `test -z "$vendorHits" || { printf 'Unapproved cloud/storage vendor coupling found in milestone additions:\\n%s\\n' "$vendorHits"; exit 1; }`,
          `if rg -n -i ${quote(credentialPropertyPattern)} ${['src/platform/assets/contracts.ts', 'src/platform/client.ts'].map(quote).join(' ')}; then echo 'Credential-bearing public asset contract found'; exit 1; fi`,
          `if rg -n -i ${quote(secretPropertyPattern)} ${['src/platform/assets/contracts.ts', 'electron/assets/assetIdentity.ts'].map(quote).join(' ')}; then echo 'Secret or raw-provider field found in persisted asset identity shape'; exit 1; fi`,
          `if rg -n "from[[:space:]]+[^[:alnum:]](node:|electron)|import\\([^)]*(node:|electron)|require\\([^)]*(node:|electron)|\\b(window|document|process|Buffer)\\b" ${['src/platform/assets/contracts.ts', 'src/platform/assets/runtime.ts'].map(quote).join(' ')}; then echo 'Runtime-specific import or global in pure asset contracts'; exit 1; fi`,
          `rg -q "^export type AssetResolutionPurpose" ${quote('src/platform/assets/contracts.ts')}`,
          `persistedAssetContracts=$(sed -n '1,/^export type AssetResolutionPurpose/p' ${quote('src/platform/assets/contracts.ts')})`,
          `if printf '%s\\n' "$persistedAssetContracts" | rg -n -i ${quote(locatorPropertyPattern)}; then echo 'Persisted domain contract contains locator, storage, credential, or raw-provider fields'; exit 1; fi`,
          `if rg -n "from[[:space:]]+[^[:alnum:]].*(generation|provider|electron|desktop)|import\\([^[:alnum:]].*(generation|provider|electron|desktop)" ${quote('src/platform/assets/contracts.ts')}; then echo 'Pure asset contract imports a provider or runtime layer'; exit 1; fi`,
          `if rg -n -i "create[[:space:]]+policy|row[[:space:]]+level[[:space:]]+security|alter[[:space:]]+table|supabase/migrations|drizzle|prisma" ${gateImplementationPaths.map(quote).join(' ')}; then echo 'Migration or RLS implementation is outside this child'; exit 1; fi`,
          `rg -q -i "sidecar" ${quote('electron/assets/projectAssetStore.identity.test.ts')}`,
          `for term in locator secret authorization headers cookie credential token rawPrompt rawResponse rawPayload providerResponse; do rg -q -i "$term" ${quote('electron/assets/projectAssetStore.identity.test.ts')} || { echo "Missing serialized sidecar hostile assertion for $term"; exit 1; }; done`,
          `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
          `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
          `for file in ${['src/platform/assets/contracts.ts', 'src/platform/assets/runtime.ts', 'electron/assets/assetIdentity.ts'].map(quote).join(' ')}; do lines=$(wc -l < "$file"); test "$lines" -le 800 || { echo "$file exceeds 800 lines"; exit 1; }; done`,
        ]),
        expectedExitCode: 0,
        timeoutMs: 600000,
      },
      io: taskIo(taskCtx),
      labels: ['compatibility', 'gate', 'security', 'shell', 'tests'],
    }
  })

const focusedGateTask = createFocusedGateTask(
  'run-platform-assets-focused-gates-v6',
  'Run asset-domain security and compatibility gates',
)

const currentReviewRemediationFocusedGateTask = createFocusedGateTask(
  'run-platform-assets-current-review-remediation-focused-gates-20260719b',
  'Run focused gates after current-review remediation',
)

const reviewRecoveryFocusedGateTask = createFocusedGateTask(
  'run-platform-assets-review-recovery-focused-gates-20260719d',
  'Run focused gates for the recovered current review scope',
)

const finalCurrentReviewFocusedGateTask = createFocusedGateTask(
  'run-platform-assets-final-current-review-focused-gates-v8',
  'Run the final current-tree focused gates before independent review',
)

const postReviewFocusedGateTask = createFocusedGateTask(
  'run-platform-assets-post-review-remediation-focused-gates-20260719b',
  'Run focused gates after post-review remediation',
)

const readReviewEvidenceTask = defineTask('read-platform-assets-review-evidence-v2', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Assemble recency-anchored review evidence',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      "printf '%s\\n' '--- RED EVIDENCE ---'",
      `printf '%s\\n' ${quote(args.redEvidence)}`,
      "printf '%s\\n' '--- FROZEN-INPUT VERIFICATION ---'",
      `printf '%s\\n' ${quote(args.frozenVerificationEvidence)}`,
      "printf '%s\\n' '--- FOCUSED GATE EVIDENCE ---'",
      `printf '%s\\n' ${quote(args.focusedGateEvidence)}`,
      "printf '%s\\n' '--- FROZEN HASHES ---'",
      `printf '%s\\n' ${quote(args.testHashes)} ${quote(args.boundaryHash)} ${quote(args.rfcHashes)} ${quote(args.ledgerHash)} ${quote(args.compatibilityHashes)} ${quote(args.reviewedTreeHashes)}`,
      "printf '%s\\n' '--- GIT DIFF ---'",
      `git diff -- ${milestonePaths.map(quote).join(' ')}`,
      "printf '%s\\n' '--- ARTIFACTS ---'",
      `for file in ${milestonePaths.map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
    ]),
    expectedExitCode: 0,
    timeoutMs: 120000,
  },
  io: taskIo(taskCtx),
  labels: ['artifacts', 'evidence', 'review', 'runtime-read', 'shell'],
}))

const createBoundedReviewEvidenceTask = (taskId) =>
  defineTask(taskId, (args, taskCtx) => {
    const evidenceMilestonePaths = args.milestonePaths ?? milestonePaths
    const evidenceReviewCodePaths = args.reviewCodePaths ?? reviewCodePaths
    const fullGateEvidence = args.fullGateEvidence ?? ''
    const reconciliationEvidence = args.reconciliationEvidence ?? ''
    return {
      kind: 'shell',
      title: 'Assemble bounded verified current review evidence',
      shell: {
        command: checkedShell([
          `cd ${quote(args.projectRoot)}`,
          `printf '%s\n' ${quote(args.focusedGateEvidence)} | jq -e '.exitCode == 0 and .success == true' >/dev/null`,
          `currentTests=$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})`,
          `test "$currentTests" = ${quote(args.testHashes.trim())}`,
          `currentTree=$(shasum -a 256 ${evidenceMilestonePaths.map(quote).join(' ')})`,
          `test "$currentTree" = ${quote(args.reviewedTreeHashes.trim())}`,
          `test ${quote(args.focusedGateTreeHashes.trim())} = ${quote(args.reviewedTreeHashes.trim())}`,
          `expectedGateTreeDigest=$(printf '%s' ${quote(args.focusedGateTreeHashes.trim())} | shasum -a 256 | awk '{print $1}')`,
          `printf '%s\n' ${quote(args.focusedGateEvidence)} | jq -r '.stdout // ""' | rg -F -x "FOCUSED_GATE_TREE_SHA256=$expectedGateTreeDigest" >/dev/null`,
          `if [ -n ${quote(fullGateEvidence)} ]; then printf '%s\n' ${quote(fullGateEvidence)} | jq -e '.exitCode == 0 and .success == true' >/dev/null; fi`,
          `evidence=$(mktemp "${'${TMPDIR:-/tmp}'}/evmedia-platform-assets-review.XXXXXX")`,
          `trap 'rm -f "$evidence"' EXIT`,
          `{ printf '%s\n' '--- REVIEW RECENCY NONCE AND TREE MANIFEST ---'; printf '%s\n' ${quote(args.reviewNonce)}; printf '%s\n' '--- RED EVIDENCE SUMMARY ---'; printf '%s\n' ${quote(args.redEvidence)} | jq -c '{exitCode,success,stderr,stdoutBytes:(.stdout|length)}'; printf '%s\n' ${quote(args.redEvidence)} | shasum -a 256; printf '%s\n' ${quote(args.redEvidence)} | jq -r '.stdout // ""' | rg -m 12 '^--- RED |failed|Failed Tests|AssertionError: RED_|FINAL SECURITY RED' || true; printf '%s\n' '--- FROZEN-INPUT VERIFICATION SUMMARY ---'; printf '%s\n' ${quote(args.frozenVerificationEvidence)} | jq -c '{exitCode,success,stderr,stdoutBytes:(.stdout|length)}'; printf '%s\n' '--- FOCUSED GATE SUMMARY ---'; printf '%s\n' ${quote(args.focusedGateEvidence)} | jq -c '{exitCode,success,stderr,stdoutBytes:(.stdout|length)}'; if [ -n ${quote(fullGateEvidence)} ]; then printf '%s\n' '--- FULL GATE SUMMARY ---'; printf '%s\n' ${quote(fullGateEvidence)} | jq -c '{exitCode,success,stderr,stdoutBytes:(.stdout|length)}'; fi; if [ -n ${quote(reconciliationEvidence)} ]; then printf '%s\n' '--- VERIFIED REVIEW RECONCILIATION ---'; printf '%s\n' ${quote(reconciliationEvidence)}; fi; printf '%s\n' '--- FROZEN HASHES ---'; printf '%s\n' ${quote(args.testHashes)} ${quote(args.boundaryHash)} ${quote(args.rfcHashes)} ${quote(args.ledgerHash)} ${quote(args.compatibilityHashes)}; printf '%s\n' '--- CURRENT TRACKED REVIEW CODE DIFF ---'; for file in ${evidenceReviewCodePaths.map(quote).join(' ')}; do if git ls-files --error-unmatch "$file" >/dev/null 2>&1 && ! git diff --quiet HEAD -- "$file"; then printf '\n--- %s (current changed lines) ---\n' "$file"; git diff --unified=0 HEAD -- "$file" | sed -n '/^+++ /d; s/^+//p'; fi; done; printf '%s\n' '--- UNTRACKED REVIEW CODE ARTIFACTS ---'; for file in ${evidenceReviewCodePaths.map(quote).join(' ')}; do if ! git ls-files --error-unmatch "$file" >/dev/null 2>&1; then printf '\n--- %s ---\n' "$file"; cat "$file"; fi; done; } > "$evidence"`,
          `evidenceBytes=$(wc -c < "$evidence" | tr -d ' ')`,
          `{ test "$evidenceBytes" -ge 1000 || { echo "Review evidence is incomplete: $evidenceBytes bytes" >&2; exit 1; }; }`,
          `{ test "$evidenceBytes" -le 250000 || { echo "Review evidence exceeds bounded prompt budget: $evidenceBytes bytes" >&2; exit 1; }; }`,
          `cat "$evidence"`,
        ]),
        expectedExitCode: 0,
        timeoutMs: 120000,
      },
      io: taskIo(taskCtx),
      labels: ['artifacts', 'bounded', 'evidence', 'recency', 'review', 'runtime-read', 'shell'],
    }
  })

const readBoundedReviewEvidenceTask = createBoundedReviewEvidenceTask(
  'read-platform-assets-review-evidence-recency-v15-scope-recovery-20260719',
)
const readFinalBoundedReviewEvidenceTask = createBoundedReviewEvidenceTask(
  'read-platform-assets-final-review-evidence-recency-v7',
)

const createReviewTask = (taskId, title) =>
  defineTask(taskId, (args, taskCtx) => ({
    kind: 'agent',
    title,
    agent: {
      name: 'platform-assets-security-reviewer',
      prompt: {
        role: 'independent staff application-security and data-integrity reviewer',
        task: 'Decide whether the current Beads child is fully implemented without topology creep or compatibility regression.',
        context: {
          specVerbatim: args.spec,
          artifactsVerbatim: args.artifacts,
        },
        instructions: [
          'SPEC (verbatim) and ARTIFACTS (verbatim) are supplied above. Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
          'Require test-first RED evidence, frozen tests/boundary/RFC hashes, a passing focused gate, and exact bounded write scope.',
          'Fail on path/URL-derived logical identity for new imports, mutable version identity, invented legacy facts, locator leakage into persisted records, raw provider/secret payloads, fail-open scope checks, forged trusted state, lineage cycles, or cross-organization/project leakage.',
          'Fail if assetRecords overloads the legacy assets facade, browser imports Electron/Node, Electron claims cloud authentication, or current list/import behavior regresses.',
          'Fail on cloud SDKs, storage topology, migrations/RLS, edits to frozen RFCs, hidden historical rewrites, or unsupported claims that parent evmedia-r20.8 is complete.',
          'Distinguish current-child blockers from intentionally pending parent work: real cloud objects, signed delivery, tenant enforcement, full migration, retention/GC, canvas/timeline/export identity migration, and rollback.',
          'Every blocker must be actionable and formatted path:line - finding. Return score 0-100.',
        ],
        outputFormat: 'JSON with passed, score, blockers, risks, summary',
      },
      outputSchema: {
        type: 'object',
        required: ['passed', 'score', 'blockers', 'risks', 'summary'],
        properties: {
          passed: { type: 'boolean' },
          score: { type: 'number', minimum: 0, maximum: 100 },
          blockers: { type: 'array', items: { type: 'string', pattern: '^.+:[0-9]+\\s+-\\s+.+$' } },
          risks: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    },
    io: taskIo(taskCtx),
    labels: ['agent', 'independent-review', 'quality-gate', 'security'],
  }))

const reviewTask = createReviewTask(
  'review-platform-assets-slice-v3',
  'Independently review asset-domain security and intent fidelity',
)

const currentEvidenceReviewTask = createReviewTask(
  'review-platform-assets-current-bounded-evidence-v15-scope-recovery-20260719',
  'Independently review the current bounded asset evidence',
)

const finalEvidenceReviewTask = createReviewTask(
  'review-platform-assets-final-bounded-evidence-v7',
  'Independently review the final current asset evidence',
)

const createRemediateTask = (taskId, title) =>
  defineTask(taskId, (args, taskCtx) => {
    const remediationImplementationPaths = args.implementationPaths ?? implementationPaths
    return {
      kind: 'agent',
      title,
      agent: {
        name: 'platform-assets-remediator',
        prompt: {
          role: 'staff TypeScript application-security maintainer',
          task: 'Fix every verified review blocker without changing frozen inputs or milestone scope.',
          context: {
            projectRoot: args.projectRoot,
            reviewVerbatim: args.review,
            artifactsVerbatim: args.artifacts,
            specVerbatim: args.spec,
          },
          instructions: [
            'Compare SPEC to ARTIFACTS directly and verify every blocker against current code.',
            `Edit only these implementation paths: ${remediationImplementationPaths.join(', ')}. Do not create helper files.`,
            `If present and untracked, delete only these known TypeScript gate artifacts: ${generatedCompilerArtifactPaths.join(', ')}. Do not edit or create them, and refuse to delete any of them if tracked.`,
            `Do not edit ${boundaryPath}, tests, Beads, RFC drafts, package files, migrations, or lockfiles.`,
            'Preserve stable identity, truthful provenance, locator separation, browser safety, Electron continuity, and legacy facade behavior.',
            'Do not add cloud/storage vendor coupling or broaden this child.',
            'When the focused gate reports that an implementation file exceeds 800 lines, compact that exact file below 800 lines without removing validation, changing behavior, creating helper files, editing tests, or broadening scope.',
            'Do not execute generated code or tests. The orchestrator will freeze remediated bytes first, then run focused gates. Report each verified blocker, fix, and file.',
          ],
          outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
        },
        outputSchema: {
          type: 'object',
          required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
          properties: {
            filesModified: { type: 'array', items: { type: 'string' } },
            blockersVerified: { type: 'array', items: { type: 'string' } },
            blockersResolved: { type: 'array', items: { type: 'string' } },
            testResults: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
        },
      },
      io: taskIo(taskCtx),
      labels: ['agent', 'refinement', 'remediation', 'security'],
    }
  })

const remediateTask = createRemediateTask(
  'remediate-platform-assets-slice-v3',
  'Remediate verified asset-review blockers',
)

const currentEvidenceRemediateTask = createRemediateTask(
  'remediate-platform-assets-current-review-v9',
  'Remediate blockers from the current bounded asset review',
)

const postReviewGateRemediateTask = createRemediateTask(
  'remediate-platform-assets-post-review-gate-20260719a',
  'Remediate focused-gate regressions after current review fixes',
)

const fullGateRemediateTask = createRemediateTask(
  'remediate-platform-assets-full-gate-20260719a',
  'Remediate full repository gate failures',
)

const refreezeAdapterHarnessTask = defineTask('refreeze-platform-assets-adapter-harness-v1', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Correct and refreeze the adapter contract harness',
  agent: {
    name: 'platform-assets-adapter-harness-maintainer',
    prompt: {
      role: 'staff TypeScript contract-test maintainer',
      task: 'Correct only the obsolete adapter fixtures identified by independent review, preserving the strengthened production contract.',
      context: {
        projectRoot: args.projectRoot,
        reviewVerbatim: args.review,
        previousFrozenTestHashes: args.testHashes,
      },
      instructions: [
        `Edit exactly ${adapterHarnessPath}. Do not edit production code, any other test, Beads, RFC drafts, process files, packages, lockfiles, migrations, or generated assets.`,
        'This is a controlled test-contract refreeze after an independently verified fixture mismatch. Preserve the original RED evidence; do not weaken assertions or production validation.',
        'Replace partial import fixtures with complete canonical AssetRecordBundle values and make the mock call AssetRecordImportOperation.authorizeAssetWrite for the exact selected asset ID before returning the persisted bundle.',
        'Replace the partial resolution fixture with a complete canonical AssetResolution including integrity metadata accepted by the public parser.',
        'Replace authorization-filtered list fixtures with complete canonical bundles while retaining the assertion that denied records do not leak existence or metadata.',
        'Do not execute tests or generated code. The orchestrator will hash the corrected harness, verify every other frozen input byte, and run the focused gate.',
      ],
      outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1 },
        blockersVerified: { type: 'array', items: { type: 'string' } },
        blockersResolved: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'contract-correction', 'frozen-input', 'provenance', 'tests-first'],
}))

const verifyAdapterHarnessRefreezeTask = defineTask(
  'verify-platform-assets-adapter-harness-refreeze-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify the controlled adapter harness refreeze',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `expectedProtected=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg -v ${quote(`  ${adapterHarnessPath}$`)})`,
        `currentProtected=$(shasum -a 256 ${contractTestPaths
          .filter((path) => path !== adapterHarnessPath)
          .map(quote)
          .join(' ')})`,
        'test "$currentProtected" = "$expectedProtected"',
        `previousAdapter=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg ${quote(`  ${adapterHarnessPath}$`)} | cut -d ' ' -f 1)`,
        `currentAdapter=$(shasum -a 256 ${quote(adapterHarnessPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousAdapter" && test "$currentAdapter" != "$previousAdapter"',
        `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
        `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(args.rfcHashes.trim())}`,
        `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
        `test "$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})" = ${quote(args.compatibilityHashes.trim())}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        `printf '%s\n' "controlled-refreeze ${adapterHarnessPath} $previousAdapter -> $currentAdapter"`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['contract-correction', 'evidence', 'frozen-input', 'provenance', 'shell'],
  }),
)

const refreezeReviewScopeTask = defineTask('refreeze-platform-assets-review-scope-v1', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile and refreeze the independently reviewed asset write scope',
  agent: {
    name: 'platform-assets-scope-refreezer',
    prompt: {
      role: 'staff TypeScript contract-test and architecture maintainer',
      task: 'Reconcile the exact reviewed write scope and add a test-first project-close authorization regression without touching production code.',
      context: {
        projectRoot: args.projectRoot,
        reviewVerbatim: args.review,
        boundaryVerbatim: args.boundary,
        compatibilityTestVerbatim: args.compatibilityTest,
      },
      instructions: [
        `Edit exactly ${boundaryPath} and ${scopeRefreezeTestPath}. Do not edit production code, any other test, Beads, RFC drafts, process files, packages, lockfiles, migrations, or generated assets.`,
        `In ${boundaryPath}, replace the stale planned-files table and no-edit claim with the exact reviewed implementation/test surface already required by the live production path, including ${projectSessionPath}. Keep the child topology-neutral and keep all six RFC drafts frozen.`,
        `In ${scopeRefreezeTestPath}, add a regression named "[asset-records][project-close] clears main-process active project binding". It must fail against current code because clearActiveWorkbenchProjectSaveTarget does not call capability.setActiveProject(''). Also prove a mismatched projectId does not clear the binding.`,
        'Mock only the existing desktop bridge boundary. Do not weaken, delete, skip, or rewrite existing assertions.',
        'Do not execute tests. The orchestrator will verify the exact two-file write scope, record RED evidence, refreeze both files, then hand production remediation to a separate agent.',
      ],
      outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 },
        blockersVerified: { type: 'array', items: { type: 'string' } },
        blockersResolved: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'contract-correction', 'frozen-input', 'scope', 'tests-first'],
}))

const verifyReviewScopeRefreezeTask = defineTask(
  'verify-platform-assets-review-scope-refreeze-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify controlled review-scope and regression-test refreeze',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `test "$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})" = ${quote(args.testHashes.trim())}`,
        `test "$(shasum -a 256 ${reviewRecoveryImplementationPaths.map(quote).join(' ')})" = ${quote(args.implementationHashes.trim())}`,
        `previousBoundary=$(printf '%s\n' ${quote(args.boundaryHash.trim())} | cut -d ' ' -f 1)`,
        `currentBoundary=$(shasum -a 256 ${quote(boundaryPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousBoundary" && test "$currentBoundary" != "$previousBoundary"',
        `previousTarget=$(printf '%s\n' ${quote(args.compatibilityHashes.trim())} | rg -F ${quote(`  ${scopeRefreezeTestPath}`)} | cut -d ' ' -f 1)`,
        `currentTarget=$(shasum -a 256 ${quote(scopeRefreezeTestPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousTarget" && test "$currentTarget" != "$previousTarget"',
        `expectedOther=$(printf '%s\n' ${quote(args.compatibilityHashes.trim())} | rg -v -F ${quote(`  ${scopeRefreezeTestPath}`)})`,
        `currentOther=$(shasum -a 256 ${mutableCompatibilityTestPaths
          .filter((path) => path !== scopeRefreezeTestPath)
          .map(quote)
          .join(' ')})`,
        'test "$currentOther" = "$expectedOther"',
        `rg -F ${quote(projectSessionPath)} ${quote(boundaryPath)} >/dev/null`,
        `for file in ${['src/desktop/bridge.ts', 'electron/preload.ts', 'electron/main.ts', ...mutableCompatibilityTestPaths].map(quote).join(' ')}; do rg -F "$file" ${quote(boundaryPath)} >/dev/null || { echo "Refrozen boundary omits reviewed path: $file"; exit 1; }; done`,
        `rg -F ${quote('[asset-records][project-close] clears main-process active project binding')} ${quote(scopeRefreezeTestPath)} >/dev/null`,
        `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
        `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
        'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
        'git diff --check',
        `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
        `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(`^(${reviewRecoveryAllowedDirtyPaths.map(regexEscape).join('|')})$`)} || true)`,
        'test -z "$unexpected" || { printf "Unexpected controlled-refreeze writes:\\n%s\\n" "$unexpected"; exit 1; }',
        `printf '%s\n' "controlled-review-scope-refreeze $previousBoundary -> $currentBoundary; ${scopeRefreezeTestPath} $previousTarget -> $currentTarget"`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['contract-correction', 'evidence', 'frozen-input', 'scope', 'shell', 'tests-first'],
  }),
)

const finalSecurityRegressionTask = defineTask(
  'refreeze-platform-assets-final-project-root-regression-v2',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Add the final project-root isolation regression before production remediation',
    agent: {
      name: 'platform-assets-final-security-test-maintainer',
      prompt: {
        role: 'staff TypeScript filesystem-isolation contract-test maintainer',
        task: 'Turn the verified final-review project-root isolation blocker into an exact failing integration regression.',
        context: {
          projectRoot: args.projectRoot,
          reviewVerbatim: args.review,
          previousContractTestHashes: args.testHashes,
        },
        instructions: [
          `Edit exactly ${finalSecurityTestPath}. Do not edit or read production code, any other test, the boundary, Beads, RFC drafts, process files, packages, lockfiles, migrations, or generated assets.`,
          'Add a regression named "[asset-records][project-root] rejects explicit roots not bound to request project" using only the existing public test harness and helpers in this file.',
          'Construct an asset store with an explicit filesystem root belonging to one project and an authorization adapter that allows the request. Exercise a request scoped to a different project and prove the operation fails closed before bytes, sidecars, or records are written into the supplied root. Cover the live store primitive rather than a mock or source-text assertion.',
          'Keep the expected failure at the project-root binding boundary. Do not weaken authorization, identity, integrity, or existing compatibility assertions.',
          'Do not weaken, delete, skip, or rewrite existing assertions. Reuse existing helpers and public types where possible.',
          'Do not run tests. The orchestrator will verify the one-file write scope, capture behavioral RED, freeze the bytes, and then assign production remediation to a separate agent.',
        ],
        outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
      },
      outputSchema: {
        type: 'object',
        required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
        properties: {
          filesModified: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1 },
          blockersVerified: { type: 'array', items: { type: 'string' }, minItems: 1 },
          blockersResolved: { type: 'array', items: { type: 'string' }, minItems: 1 },
          testResults: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    },
    io: taskIo(taskCtx),
    labels: ['agent', 'contract-correction', 'security', 'tests-first'],
  }),
)

const verifyFinalSecurityRegressionTask = defineTask(
  'verify-platform-assets-final-project-root-regression-v3',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify final security regression write scope before RED execution',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `test "$(shasum -a 256 ${reviewRecoveryImplementationPaths.map(quote).join(' ')})" = ${quote(args.implementationHashes.trim())}`,
        `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
        `previousTarget=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg -F ${quote(`  ${finalSecurityTestPath}`)} | cut -d ' ' -f 1)`,
        `currentTarget=$(shasum -a 256 ${quote(finalSecurityTestPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousTarget" && test "$currentTarget" != "$previousTarget"',
        `expectedOther=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg -v -F ${quote(`  ${finalSecurityTestPath}`)})`,
        `currentOther=$(shasum -a 256 ${contractTestPaths
          .filter((path) => path !== finalSecurityTestPath)
          .map(quote)
          .join(' ')})`,
        'test "$currentOther" = "$expectedOther"',
        `test "$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})" = ${quote(args.compatibilityHashes.trim())}`,
        `rg -F ${quote('[asset-records][project-root] rejects explicit roots not bound to request project')} ${quote(finalSecurityTestPath)} >/dev/null`,
        `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(protectedRfcHashBaseline)}`,
        `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        'git diff --cached --quiet || { echo "Unexpected staged changes"; exit 1; }',
        'git diff --check',
        `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
        `unexpected=$(printf '%s\n' "$dirty" | sed '/^$/d' | rg -v ${quote(`^(${reviewRecoveryAllowedDirtyPaths.map(regexEscape).join('|')})$`)} || true)`,
        'test -z "$unexpected" || { printf "Unexpected final-security regression writes:\n%s\n" "$unexpected"; exit 1; }',
        `printf '%s\n' "final-project-root-regression ${finalSecurityTestPath} $previousTarget -> $currentTarget"`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['contract-correction', 'evidence', 'frozen-input', 'scope', 'security', 'shell', 'tests-first'],
  }),
)

const createFinalSecurityRedTask = (taskId, title, testPath, testName) =>
  defineTask(taskId, (args, taskCtx) => ({
    kind: 'shell',
    title,
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `log=$(mktemp "${'${TMPDIR:-/tmp}'}/evmedia-final-security-red.XXXXXX")`,
        `trap '/usr/bin/trash "$log" >/dev/null 2>&1 || true' EXIT`,
        `code=0; pnpm exec vitest run ${quote(testPath)} -t ${quote(regexEscape(testName))} >"$log" 2>&1 || code=$?`,
        'test "$code" -ne 0 || { echo "Expected final security RED but targeted test passed"; cat "$log"; exit 1; }',
        'if rg -q "Startup Error|SyntaxError|No test files found|Failed Suites|Failed to load url|Cannot find module|ERR_MODULE_NOT_FOUND" "$log"; then echo "Invalid final security RED infrastructure failure"; cat "$log"; exit 1; fi',
        `rg -F ${quote(testName)} "$log" >/dev/null`,
        'rg -q "Tests[[:space:]]+1 failed|1 failed" "$log" || { echo "Targeted final security test did not produce one collected failing test"; cat "$log"; exit 1; }',
        'rg -q "AssertionError|expected.*to" "$log" || { echo "Targeted final security RED was not an assertion failure"; cat "$log"; exit 1; }',
        `printf '%s\n' ${quote(`--- FINAL SECURITY RED: ${testName} ---`)}`,
        'cat "$log"',
      ]),
      expectedExitCode: 0,
      timeoutMs: 180000,
    },
    io: taskIo(taskCtx),
    labels: ['behavioral-red', 'evidence', 'red', 'security', 'shell', 'tdd'],
  }))

const draftProjectRootIsolationRedTask = createFinalSecurityRedTask(
  'record-platform-assets-final-project-root-isolation-red-v2',
  'Record behavioral RED for cross-project explicit asset roots',
  finalSecurityTestPath,
  '[asset-records][project-root] rejects explicit roots not bound to request project',
)

const hashFinalProjectRootDraftTestsTask = defineTask(
  'hash-platform-assets-final-project-root-draft-tests-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze the draft project-root regression before error-contract correction',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `shasum -a 256 ${contractTestPaths.map(quote).join(' ')}`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'hash', 'security', 'shell', 'tests-first'],
  }),
)

const correctFinalProjectRootErrorContractTask = defineTask(
  'correct-platform-assets-final-project-root-error-contract-v1',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Align the project-root regression with the public permission-denied contract',
    agent: {
      name: 'platform-assets-final-security-test-maintainer',
      prompt: {
        role: 'staff TypeScript public-contract test maintainer',
        task: 'Correct only the error-code expectation in the frozen project-root regression before implementation.',
        context: {
          projectRoot: args.projectRoot,
          draftTestHashes: args.testHashes,
          reviewVerbatim: args.review,
        },
        instructions: [
          `Read only ${finalSecurityTestPath} and src/platform/client.ts. Edit exactly ${finalSecurityTestPath}. Do not read or edit production implementation, any other test, the boundary, Beads, RFC drafts, process files, packages, lockfiles, migrations, or generated assets.`,
          'The public PlatformOperationErrorCode contract uses PERMISSION_DENIED, not FORBIDDEN. In the exact regression named "[asset-records][project-root] rejects explicit roots not bound to request project", replace only the incorrect expected code with PERMISSION_DENIED.',
          'Preserve the live-store call path, fresh idempotency key, authorized cross-project attempt, retryable=false assertion, and byte-for-byte root immutability assertions.',
          'Do not weaken, delete, skip, rename, or otherwise rewrite the regression or any existing assertion.',
          'Do not run tests. The orchestrator will verify the one-file correction, rerun behavioral RED, and refreeze the corrected bytes before implementation.',
        ],
        outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
      },
      outputSchema: {
        type: 'object',
        required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
        properties: {
          filesModified: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1 },
          blockersVerified: { type: 'array', items: { type: 'string' }, minItems: 1 },
          blockersResolved: { type: 'array', items: { type: 'string' }, minItems: 1 },
          testResults: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    },
    io: taskIo(taskCtx),
    labels: ['agent', 'contract-correction', 'frozen-input', 'security', 'tests-first'],
  }),
)

const verifyFinalProjectRootErrorContractTask = defineTask(
  'verify-platform-assets-final-project-root-error-contract-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify controlled project-root error-contract correction',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `test "$(shasum -a 256 ${reviewRecoveryImplementationPaths.map(quote).join(' ')})" = ${quote(args.implementationHashes.trim())}`,
        `previousTarget=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg -F ${quote(`  ${finalSecurityTestPath}`)} | cut -d ' ' -f 1)`,
        `currentTarget=$(shasum -a 256 ${quote(finalSecurityTestPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousTarget" && test "$currentTarget" != "$previousTarget"',
        `expectedOther=$(printf '%s\n' ${quote(args.testHashes.trim())} | rg -v -F ${quote(`  ${finalSecurityTestPath}`)})`,
        `currentOther=$(shasum -a 256 ${contractTestPaths
          .filter((candidate) => candidate !== finalSecurityTestPath)
          .map(quote)
          .join(' ')})`,
        'test "$currentOther" = "$expectedOther"',
        `rg -F ${quote('[asset-records][project-root] rejects explicit roots not bound to request project')} ${quote(finalSecurityTestPath)} >/dev/null`,
        `rg -F ${quote('code: "PERMISSION_DENIED"')} ${quote(finalSecurityTestPath)} >/dev/null`,
        `if rg -F ${quote('code: "FORBIDDEN"')} ${quote(finalSecurityTestPath)} >/dev/null; then echo "Obsolete FORBIDDEN expectation remains"; exit 1; fi`,
        `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
        `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(args.rfcHashes.trim())}`,
        `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
        `test "$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})" = ${quote(args.compatibilityHashes.trim())}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        'git diff --cached --quiet',
        'git diff --check',
        `printf '%s\n' "project-root-error-contract ${finalSecurityTestPath} $previousTarget -> $currentTarget"`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['contract-correction', 'evidence', 'frozen-input', 'security', 'shell', 'tests-first'],
  }),
)

const finalProjectRootIsolationRedTask = createFinalSecurityRedTask(
  'record-platform-assets-final-project-root-isolation-red-v3',
  'Record corrected behavioral RED for cross-project explicit asset roots',
  finalSecurityTestPath,
  '[asset-records][project-root] rejects explicit roots not bound to request project',
)

const hashFinalProjectRootContractTestsTask = defineTask(
  'hash-platform-assets-final-project-root-contract-tests-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze corrected project-root contract tests after behavioral RED',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `shasum -a 256 ${contractTestPaths.map(quote).join(' ')}`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'hash', 'security', 'shell', 'tests-first'],
  }),
)

const verifyFinalProjectRootImplementationBaselineTask = defineTask(
  'verify-platform-assets-final-project-root-implementation-baseline-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify implementation stayed frozen through project-root test correction and RED',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `current=$(shasum -a 256 ${reviewRecoveryImplementationPaths.map(quote).join(' ')})`,
        `test "$current" = ${quote(args.expected.trim())}`,
        `printf '%s\n' "$current"`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'hash', 'security', 'shell', 'tests-first'],
  }),
)

const hashFinalProjectRootRemediationInputTask = defineTask(
  'hash-platform-assets-final-project-root-remediation-input-v2',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Freeze project-root product-remediation input tree',
    shell: {
      command: checkedShell([`cd ${quote(args.projectRoot)}`, `shasum -a 256 ${args.paths.map(quote).join(' ')}`]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'frozen-input', 'hash', 'remediation', 'security', 'shell'],
  }),
)

const finalProjectRootRemediationTask = defineTask(
  'remediate-platform-assets-final-project-root-isolation-v2',
  (args, taskCtx) => ({
    kind: 'agent',
    title: 'Bind explicit asset roots to project scope in the live Electron store',
    agent: {
      name: 'platform-assets-project-root-remediator',
      prompt: {
        role: 'staff TypeScript Electron filesystem-isolation engineer',
        task: 'Fix the verified cross-project explicit-root vulnerability without changing frozen contracts or runtime topology.',
        context: {
          projectRoot: args.projectRoot,
          reviewVerbatim: args.review,
          correctedRedEvidence: args.redEvidence,
          frozenTestHashes: args.testHashes,
          implementationBaseline: args.implementationHashes,
        },
        instructions: [
          `Read ${finalSecurityTestPath}, src/platform/client.ts, and ${finalSecurityImplementationPath}. Edit exactly ${finalSecurityImplementationPath}. Do not edit tests, any other implementation, the boundary, Beads, RFC drafts, process files, packages, lockfiles, migrations, or generated assets.`,
          'Fix the store primitive at the shared projectRootFor boundary so file import, remote/data import, list, and resolve all fail closed when an explicit filesystem root is already bound to a different organization/project scope, even when authorization allows the request.',
          'Persist an atomic local scope binding under the explicit root when first established, validate exact organizationId and projectId on every later use, reject malformed, symlinked, or mismatched binding state, and avoid modifying the root on rejected cross-project requests.',
          'Preserve the public PERMISSION_DENIED error code, existing local Electron projectDirById behavior, asset identity authority, idempotency, integrity, provenance, and legacy assets facade.',
          'Do not introduce cloud SDKs, migrations, RLS, provider secrets, topology choices, or new files in the repository.',
          'Do not run tests. The orchestrator will verify the exact one-file product write, frozen test hashes, and then run the focused gates.',
        ],
        outputFormat: 'JSON with filesModified, blockersVerified, blockersResolved, testResults, summary',
      },
      outputSchema: {
        type: 'object',
        required: ['filesModified', 'blockersVerified', 'blockersResolved', 'testResults', 'summary'],
        properties: {
          filesModified: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 1 },
          blockersVerified: { type: 'array', items: { type: 'string' }, minItems: 1 },
          blockersResolved: { type: 'array', items: { type: 'string' }, minItems: 1 },
          testResults: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      },
    },
    io: taskIo(taskCtx),
    labels: ['agent', 'filesystem-isolation', 'remediation', 'security'],
  }),
)

const verifyFinalProjectRootRemediationTask = defineTask(
  'verify-platform-assets-final-project-root-remediation-v3',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Verify exact project-root product remediation and freeze its tree',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `test "$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})" = ${quote(args.testHashes.trim())}`,
        `previousTarget=$(printf '%s\n' ${quote(args.implementationHashes.trim())} | rg -F ${quote(`  ${finalSecurityImplementationPath}`)} | cut -d ' ' -f 1)`,
        `currentTarget=$(shasum -a 256 ${quote(finalSecurityImplementationPath)} | cut -d ' ' -f 1)`,
        'test -n "$previousTarget" && test "$currentTarget" != "$previousTarget"',
        `expectedOther=$(printf '%s\n' ${quote(args.implementationHashes.trim())} | rg -v -F ${quote(`  ${finalSecurityImplementationPath}`)})`,
        `currentOther=$(shasum -a 256 ${reviewRecoveryImplementationPaths
          .filter((candidate) => candidate !== finalSecurityImplementationPath)
          .map(quote)
          .join(' ')})`,
        'test "$currentOther" = "$expectedOther"',
        `test "$(shasum -a 256 ${quote(boundaryPath)})" = ${quote(args.boundaryHash.trim())}`,
        `test "$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})" = ${quote(args.rfcHashes.trim())}`,
        `test "$(shasum -a 256 ${quote('.beads/interactions.jsonl')})" = ${quote(args.ledgerHash.trim())}`,
        `test "$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})" = ${quote(args.compatibilityHashes.trim())}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        'git diff --cached --quiet',
        'git diff --check',
        `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
        `unexpected=$(printf '%s\n' "$dirty" | sed '/^$/d' | rg -v ${quote(`^(${args.allowedDirtyPaths.map(regexEscape).join('|')})$`)} || true)`,
        'test -z "$unexpected" || { printf "Unexpected project-root remediation writes:\n%s\n" "$unexpected"; exit 1; }',
        `shasum -a 256 ${args.paths.map(quote).join(' ')}`,
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'filesystem-isolation', 'frozen-input', 'remediation', 'security', 'shell'],
  }),
)

const projectCloseAuthorizationRedTask = defineTask(
  'record-platform-assets-project-close-authorization-red-v1',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Record RED evidence for stale project-close authorization',
    shell: {
      command: `cd ${quote(args.projectRoot)} && log=$(mktemp "${'${TMPDIR:-/tmp}'}/evmedia-project-close-red.XXXXXX") && trap '/usr/bin/trash "$log" >/dev/null 2>&1 || true' EXIT && pnpm exec vitest run ${quote(scopeRefreezeTestPath)} -t ${quote('[asset-records][project-close] clears main-process active project binding')} >"$log" 2>&1; code=$?; test "$code" -ne 0 && rg -F ${quote('[asset-records][project-close] clears main-process active project binding')} "$log" >/dev/null && cat "$log"`,
      expectedExitCode: 0,
      timeoutMs: 180000,
    },
    io: taskIo(taskCtx),
    labels: ['evidence', 'red', 'security', 'shell', 'tdd'],
  }),
)

const projectCloseAuthorizationBehaviorRedTask = defineTask(
  'record-platform-assets-project-close-authorization-behavior-red-v2',
  (args, taskCtx) => ({
    kind: 'shell',
    title: 'Record behavioral RED for stale project-close authorization',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        `log=$(mktemp "${'${TMPDIR:-/tmp}'}/evmedia-project-close-behavior-red.XXXXXX")`,
        `trap '/usr/bin/trash "$log" >/dev/null 2>&1 || true' EXIT`,
        `code=0; pnpm exec vitest run ${quote(scopeRefreezeTestPath)} -t ${quote('\\[asset-records\\]\\[project-close\\] clears main-process active project binding')} >"$log" 2>&1 || code=$?`,
        `test "$code" -ne 0 || { echo 'Expected behavioral RED but targeted test passed'; cat "$log"; exit 1; }`,
        `if rg -q "Startup Error|SyntaxError|No test files found|Failed Suites|Failed to load url|Cannot find module|ERR_MODULE_NOT_FOUND" "$log"; then echo 'Invalid project-close RED infrastructure failure'; cat "$log"; exit 1; fi`,
        `rg -F ${quote('[asset-records][project-close] clears main-process active project binding')} "$log" >/dev/null`,
        `rg -q "Tests[[:space:]]+1 failed|1 failed" "$log" || { echo 'Targeted project-close test did not produce one collected failing test'; cat "$log"; exit 1; }`,
        `rg -q "AssertionError|expected.*to" "$log" || { echo 'Targeted project-close RED was not an assertion failure'; cat "$log"; exit 1; }`,
        `cat "$log"`,
      ]),
      expectedExitCode: 0,
      timeoutMs: 180000,
    },
    io: taskIo(taskCtx),
    labels: ['behavioral-red', 'evidence', 'red', 'security', 'shell', 'tdd'],
  }),
)

const fullGatesTask = defineTask('run-platform-assets-full-gates-v2', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run production build and complete repository gates',
  shell: {
    command: `cd ${quote(args.projectRoot)} && pnpm run build && pnpm run gates`,
    expectedExitCode: 0,
    timeoutMs: 1800000,
  },
  io: taskIo(taskCtx),
  labels: ['build', 'full-suite', 'gate', 'shell'],
}))

const packagedMacSmokeTask = defineTask('smoke-platform-assets-packaged-macos', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build, temporarily install, and launch the packaged macOS app',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'pnpm run dist:mac:dir',
      `staged=${quote('release/mac-arm64/Nomi.app')}`,
      'test -d "$staged"',
      'test "$(plutil -extract CFBundleIdentifier raw "$staged/Contents/Info.plist")" = com.nomi.app',
      'codesign --verify --deep --strict "$staged"',
      `asar_cli=$(find node_modules/.pnpm -path '*/@electron/asar/bin/asar.js' -print -quit)`,
      'test -n "$asar_cli"',
      'asar_listing=$(node "$asar_cli" list "$staged/Contents/Resources/app.asar")',
      'case "$asar_listing" in *"/dist-electron/main.js"*) true ;; *) echo "Packaged app.asar is missing dist-electron/main.js"; exit 1 ;; esac',
      `install_root=$(mktemp -d '/Applications/Nomi-Asset-Smoke.XXXXXX')`,
      'runtime_root=$(mktemp -d)',
      'installed="$install_root/Nomi.app"',
      'cleanup() { if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then kill -KILL "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi; /usr/bin/trash "$install_root" "$runtime_root" >/dev/null 2>&1 || true; }',
      'launch_nomi() { NOMI_E2E=1 NOMI_E2E_ALLOW_MULTI_INSTANCE=1 NOMI_SETTINGS_DIR="$runtime_root/settings" NOMI_PROJECTS_DIR="$runtime_root/projects" "$installed/Contents/MacOS/Nomi" --disable-gpu --user-data-dir="$runtime_root/user-data" >"$runtime_root/nomi.log" 2>&1 & pid=$!; }',
      'trap cleanup EXIT INT TERM',
      'ditto "$staged" "$installed"',
      'xattr -cr "$installed"',
      'codesign --verify --deep --strict "$installed"',
      'mkdir -p "$runtime_root/settings" "$runtime_root/projects" "$runtime_root/user-data"',
      'launch_nomi',
      'sleep 10',
      'kill -0 "$pid" 2>/dev/null || { cat "$runtime_root/nomi.log"; echo "Packaged Nomi exited before smoke interval"; exit 1; }',
      'test "$(plutil -extract CFBundleIdentifier raw "$installed/Contents/Info.plist")" = com.nomi.app',
      'printf "Packaged app stayed alive for smoke interval (pid=%s)\\n" "$pid"',
      'cleanup',
      'trap - EXIT INT TERM',
      'test ! -e "$install_root" && test ! -e "$runtime_root"',
    ]),
    expectedExitCode: 0,
    timeoutMs: 1800000,
  },
  io: taskIo(taskCtx),
  labels: ['electron', 'installed-app', 'macos', 'packaging', 'smoke'],
}))

const versionTask = defineTask('version-platform-assets-slice-v2', (args, taskCtx) => {
  const versionMilestonePaths = args.milestonePaths ?? milestonePaths
  const versionAllowedDirtyPaths = args.allowedDirtyPaths ?? allowedDirtyPaths
  const versionAllowedDirtyPattern = `^(${versionAllowedDirtyPaths.map(regexEscape).join('|')})$`
  return {
    kind: 'shell',
    title: 'Commit the reviewed reversible asset milestone',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        '{ git diff --cached --quiet || { echo "Refusing to mix pre-staged changes into asset commit"; exit 1; }; }',
        `currentTree=$(shasum -a 256 ${versionMilestonePaths.map(quote).join(' ')})`,
        `test "$currentTree" = ${quote(args.reviewedTreeHashes.trim())}`,
        `currentTests=$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})`,
        `test "$currentTests" = ${quote(args.testHashes.trim())}`,
        `currentBoundary=$(shasum -a 256 ${quote(boundaryPath)})`,
        `test "$currentBoundary" = ${quote(args.boundaryHash.trim())}`,
        `currentCompatibility=$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})`,
        `test "$currentCompatibility" = ${quote(args.compatibilityHashes.trim())}`,
        `currentLedger=$(shasum -a 256 ${quote('.beads/interactions.jsonl')})`,
        `test "$currentLedger" = ${quote(args.ledgerHash.trim())}`,
        `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
        `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
        `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(versionAllowedDirtyPattern)} || true)`,
        '{ test -z "$unexpected" || { printf "Unexpected pre-commit writes:\\n%s\\n" "$unexpected"; exit 1; }; }',
        `for file in ${versionMilestonePaths.map(quote).join(' ')}; do test -s "$file" || { echo "Required milestone tree path missing or empty: $file"; exit 1; }; done`,
        `expected=$({ git diff --name-only -- ${versionMilestonePaths.map(quote).join(' ')}; git ls-files --others --exclude-standard -- ${versionMilestonePaths.map(quote).join(' ')}; } | sort -u)`,
        '{ test -n "$expected" || { echo "No asset changes to commit"; exit 1; }; }',
        `for file in ${requiredChangedPaths.map(quote).join(' ')}; do printf '%s\\n' "$expected" | rg -Fqx "$file" || { echo "Required new milestone path did not change: $file"; exit 1; }; done`,
        `git add ${versionMilestonePaths.map(quote).join(' ')}`,
        'actual=$(git diff --cached --name-only | sort)',
        '{ test "$actual" = "$expected" || { printf "Unexpected staged paths:\\n%s\\n" "$actual"; exit 1; }; }',
        'git diff --cached --check',
        "git commit -m 'feat: add stable asset domain contracts'",
        'sha=$(git rev-parse HEAD)',
        'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
        '{ test "$committed" = "$expected" || { printf "Unexpected committed paths:\\n%s\\n" "$committed"; exit 1; }; }',
        'printf "%s\\n" "$sha"',
      ]),
      expectedExitCode: 0,
    },
    io: taskIo(taskCtx),
    labels: ['commit', 'evidence', 'git', 'shell'],
  }
})

const postCommitGateTask = defineTask('verify-platform-assets-commit-v2', (args, taskCtx) => {
  const committedMilestonePaths = args.milestonePaths ?? milestonePaths
  const committedImplementationPaths = args.implementationPaths ?? implementationPaths
  const committedAllowedDirtyPaths = args.allowedDirtyPaths ?? allowedDirtyPaths
  const committedMilestonePathPattern = `^(${committedMilestonePaths.map(regexEscape).join('|')})$`
  const committedAllowedDirtyPattern = `^(${committedAllowedDirtyPaths.map(regexEscape).join('|')})$`
  return {
    kind: 'shell',
    title: 'Verify the committed asset tree before Beads closure',
    shell: {
      command: checkedShell([
        `cd ${quote(args.projectRoot)}`,
        'sha=$(git rev-parse HEAD)',
        `test "$sha" = ${quote(args.commitSha)}`,
        'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
        `unexpected=$(printf '%s\\n' "$committed" | rg -v ${quote(committedMilestonePathPattern)} || true)`,
        'test -z "$unexpected" || { printf "Unexpected committed paths:\\n%s\\n" "$unexpected"; exit 1; }',
        `for file in ${requiredChangedPaths.map(quote).join(' ')}; do printf '%s\\n' "$committed" | rg -Fqx "$file" || { echo "Required new committed path missing: $file"; exit 1; }; done`,
        `for file in ${committedMilestonePaths.map(quote).join(' ')}; do test -s "$file" || { echo "Required milestone tree path missing or empty: $file"; exit 1; }; done`,
        `git diff --quiet HEAD -- ${committedMilestonePaths.map(quote).join(' ')}`,
        `currentTree=$(shasum -a 256 ${committedMilestonePaths.map(quote).join(' ')})`,
        `test "$currentTree" = ${quote(args.reviewedTreeHashes.trim())}`,
        `currentTests=$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})`,
        `test "$currentTests" = ${quote(args.testHashes.trim())}`,
        `currentBoundary=$(shasum -a 256 ${quote(boundaryPath)})`,
        `test "$currentBoundary" = ${quote(args.boundaryHash.trim())}`,
        `currentCompatibility=$(shasum -a 256 ${mutableCompatibilityTestPaths.map(quote).join(' ')})`,
        `test "$currentCompatibility" = ${quote(args.compatibilityHashes.trim())}`,
        `currentLedger=$(shasum -a 256 ${quote('.beads/interactions.jsonl')})`,
        `test "$currentLedger" = ${quote(args.ledgerHash.trim())}`,
        `pnpm exec vitest run ${[...contractTestPaths, ...compatibilityTestPaths].map(quote).join(' ')}`,
        'pnpm run typecheck',
        `pnpm exec eslint ${[...committedImplementationPaths, ...contractTestPaths, ...mutableCompatibilityTestPaths].map(quote).join(' ')}`,
        `postGateTree=$(shasum -a 256 ${committedMilestonePaths.map(quote).join(' ')})`,
        `test "$postGateTree" = ${quote(args.reviewedTreeHashes.trim())}`,
        `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
        `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
        `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
        `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
        `unexpected=$(printf '%s\\n' "$dirty" | sed '/^$/d' | rg -v ${quote(committedAllowedDirtyPattern)} || true)`,
        'test -z "$unexpected" || { printf "Unexpected post-commit writes:\\n%s\\n" "$unexpected"; exit 1; }',
        'printf "%s\\n" "$sha"',
      ]),
      expectedExitCode: 0,
      timeoutMs: 600000,
    },
    io: taskIo(taskCtx),
    labels: ['committed-tree', 'evidence', 'gate', 'security', 'shell'],
  }
})

const closeBeadTask = defineTask('close-platform-assets-slice-v2', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record reversible asset milestone evidence in Beads',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      `test "$(git rev-parse HEAD)" = ${quote(args.commitSha)}`,
      `test "$(bd show evmedia-r20.8 --json | jq -r '.[0].status')" = open`,
      `test "$(bd show evmedia-r20.4 --json | jq -r '.[0].status')" = in_progress`,
      'sha=$(git rev-parse HEAD)',
      `test "$sha" = ${quote(args.commitSha)}`,
      `bd update ${quote(args.beadId)} --append-notes "Vendor-neutral asset identity/version/provenance and runtime-resolution contracts passed frozen contract/hostile tests, existing PlatformClient/authorization/Higgsfield/local-asset compatibility suites, full repository gates, packaged macOS install smoke, and independent review score ${args.score}. Versioned at verified local commit ${args.commitSha}. evmedia-r20.8 and evmedia-r20.4 remain active for cloud object storage, signed delivery, tenant enforcement, historical migration, rollback, and topology approval." --status closed`,
      `test "$(git rev-parse HEAD)" = ${quote(args.commitSha)}`,
      `test "$(bd show ${quote(args.beadId)} --json | jq -r '.[0].status')" = closed`,
      `test "$(bd show evmedia-r20.8 --json | jq -r '.[0].status')" = open`,
      `test "$(bd show evmedia-r20.4 --json | jq -r '.[0].status')" = in_progress`,
      `bd show ${quote(args.beadId)}`,
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'evidence', 'milestone', 'shell'],
}))

export async function process(inputs, ctx) {
  const projectRoot = inputs.projectRoot
  const beadId = String(inputs.beadId || '')
  if (beadId !== 'evmedia-r20.8.1') throw new Error(`Unexpected asset Beads child: ${beadId}`)

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId })
  if (!shellTaskPassed(spec)) throw new Error('Asset child or prerequisite lifecycle state is invalid')
  const frozenRfcHashes = await ctx.task(hashFrozenRfcTask, { projectRoot })
  if (!shellTaskPassed(frozenRfcHashes)) throw new Error('Unapproved RFC draft baseline changed')
  const frozenLedgerHash = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'Beads milestone ledger',
    paths: ['.beads/interactions.jsonl'],
  })
  if (!shellTaskPassed(frozenLedgerHash)) throw new Error('Beads milestone ledger could not be frozen')
  const freshStart = await ctx.task(freshStartTask, { projectRoot })
  if (!shellTaskPassed(freshStart))
    throw new Error('Asset run did not start from its committed bounded process revision')
  const preflight = await ctx.task(preflightTask, { projectRoot })
  if (!shellTaskPassed(preflight)) throw new Error('Live asset path preflight failed')
  await ctx.task(boundaryTask, { projectRoot, spec: spec.stdout, preflight: preflight.stdout })
  const boundaryScope = await ctx.task(boundaryScopeTask, {
    projectRoot,
    ledgerHash: frozenLedgerHash.stdout,
  })
  if (!shellTaskPassed(boundaryScope)) throw new Error('Boundary agent exceeded its write scope')
  const boundary = await ctx.task(readBoundaryTask, { projectRoot })
  if (!shellTaskPassed(boundary)) throw new Error('Asset boundary could not be read after authoring')
  let frozenBoundaryHash = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset boundary',
    paths: [boundaryPath],
  })
  if (!shellTaskPassed(frozenBoundaryHash)) throw new Error('Asset boundary could not be frozen')
  await ctx.task(authorTestsTask, { projectRoot, spec: spec.stdout, boundary: boundary.stdout })
  const testsScope = await ctx.task(testsScopeTask, {
    projectRoot,
    boundaryHash: frozenBoundaryHash.stdout,
    ledgerHash: frozenLedgerHash.stdout,
  })
  if (!shellTaskPassed(testsScope)) throw new Error('Test author exceeded its write scope or changed frozen inputs')
  let frozenTestHashes = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset contract tests',
    paths: contractTestPaths,
  })
  if (!shellTaskPassed(frozenTestHashes)) throw new Error('Asset contract tests could not be frozen')
  const redEvidence = await ctx.task(redGateTask, { projectRoot })
  if (!shellTaskPassed(redEvidence)) throw new Error('Asset contract tests did not produce valid RED evidence')
  const postRedTests = await ctx.task(verifyPathHashesTask, {
    projectRoot,
    label: 'asset contract tests after RED',
    paths: contractTestPaths,
    expected: frozenTestHashes.stdout,
  })
  if (!shellTaskPassed(postRedTests)) throw new Error('Asset contract tests changed while producing RED evidence')
  const frozenTests = await ctx.task(readTestsTask, { projectRoot })
  if (!shellTaskPassed(frozenTests)) throw new Error('Frozen asset tests could not be read')

  await ctx.task(implementTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
    tests: frozenTests.stdout,
    preflight: preflight.stdout,
  })

  const implementationScope = await ctx.task(implementationScopeTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    ledgerHash: frozenLedgerHash.stdout,
  })
  if (!shellTaskPassed(implementationScope)) throw new Error('Implementation agent exceeded its write scope')
  const frozenImplementationHashes = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset implementation before compatibility updates',
    paths: implementationPaths,
  })
  if (!shellTaskPassed(frozenImplementationHashes)) throw new Error('Asset implementation could not be frozen')
  await ctx.task(compatibilityTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
    implementationHashes: frozenImplementationHashes.stdout,
  })
  const compatibilityScope = await ctx.task(compatibilityScopeTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    implementationHashes: frozenImplementationHashes.stdout,
    ledgerHash: frozenLedgerHash.stdout,
  })
  if (!shellTaskPassed(compatibilityScope)) throw new Error('Compatibility agent exceeded its write scope')
  let frozenCompatibilityHashes = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset PlatformClient compatibility tests',
    paths: mutableCompatibilityTestPaths,
  })
  if (!shellTaskPassed(frozenCompatibilityHashes)) throw new Error('Compatibility tests could not be frozen')

  let frozenVerification = await ctx.task(verifyFrozenTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    rfcHashes: frozenRfcHashes.stdout,
    ledgerHash: frozenLedgerHash.stdout,
    compatibilityHashes: frozenCompatibilityHashes.stdout,
  })
  if (!shellTaskPassed(frozenVerification)) throw new Error('Frozen asset inputs changed during implementation')
  let focusedTreeHashes = await ctx.task(hashCurrentExecutableGateTreeTask, {
    projectRoot,
  })
  if (!shellTaskPassed(focusedTreeHashes)) throw new Error('Asset tree could not be frozen before focused gates')
  let focusedGateTreeHashes = focusedTreeHashes.stdout
  let focusedGate = await ctx.task(focusedGateTask, {
    projectRoot,
    frozenTreeHashes: focusedGateTreeHashes,
  })
  const postFocusedTree = await ctx.task(verifyCurrentExecutableGateTreeTask, {
    projectRoot,
    expected: focusedTreeHashes.stdout,
  })
  if (!shellTaskPassed(postFocusedTree)) throw new Error('Focused asset gate changed generated artifacts')

  for (let attempt = 0; !shellTaskPassed(focusedGate); attempt += 1) {
    const failureArtifacts = await ctx.task(readReviewEvidenceTask, {
      projectRoot,
      redEvidence: JSON.stringify(redEvidence),
      frozenVerificationEvidence: JSON.stringify(frozenVerification),
      focusedGateEvidence: JSON.stringify(focusedGate),
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      reviewedTreeHashes: focusedTreeHashes.stdout,
    })
    if (!shellTaskPassed(failureArtifacts)) throw new Error('Focused-gate failure evidence could not be assembled')
    const failureReview = await ctx.task(reviewTask, {
      spec: spec.stdout,
      artifacts: failureArtifacts.stdout,
    })
    const postFailureReviewTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `asset tree after focused-gate diagnosis ${attempt + 1}`,
      paths: milestonePaths,
      expected: focusedTreeHashes.stdout,
    })
    if (!shellTaskPassed(postFailureReviewTree)) throw new Error('Focused-gate reviewer changed milestone artifacts')
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      allowCompilerArtifacts: true,
    })
    if (!shellTaskPassed(frozenVerification)) throw new Error('Focused-gate reviewer changed frozen inputs or scope')
    if (!reviewHasActionableBlockers(failureReview)) {
      throw new Error('Focused-gate reviewer did not return actionable path:line blockers')
    }
    await ctx.task(remediateTask, {
      projectRoot,
      review: JSON.stringify(failureReview),
      artifacts: failureArtifacts.stdout,
      spec: spec.stdout,
    })
    focusedTreeHashes = await ctx.task(hashPathsTask, {
      projectRoot,
      label: `asset tree after focused-gate remediation ${attempt + 1}`,
      paths: milestonePaths,
    })
    if (!shellTaskPassed(focusedTreeHashes)) throw new Error('Focused-gate remediation tree could not be frozen')
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
    })
    if (!shellTaskPassed(frozenVerification))
      throw new Error('Frozen asset inputs changed during focused-gate remediation')
    focusedGateTreeHashes = focusedTreeHashes.stdout
    focusedGate = await ctx.task(focusedGateTask, {
      projectRoot,
      frozenTreeHashes: focusedGateTreeHashes,
    })
    const postRemediationGateTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `asset tree after focused-gate remediation check ${attempt + 1}`,
      paths: milestonePaths,
      expected: focusedTreeHashes.stdout,
    })
    if (!shellTaskPassed(postRemediationGateTree)) throw new Error('Focused gate changed remediated asset artifacts')
  }
  let review
  let reviewedTreeHashes
  let adapterHarnessRefrozen = false
  let reviewScopeRefrozen = true
  let activeMilestonePaths = reviewRecoveryMilestonePaths
  let activeImplementationPaths = reviewRecoveryImplementationPaths
  let activeReviewCodePaths = reviewRecoveryCodePaths
  let activeAllowedDirtyPaths = reviewRecoveryAllowedDirtyPaths
  let staleEvidenceRetries = 0
  let verifiedNoOpRemediationRetries = 0
  let reviewReconciliationEvidence = JSON.stringify({
    kind: 'controlled-review-scope-recovery',
    reason: `${projectSessionPath} is present in the refrozen boundary and project-close regression`,
  })
  frozenTestHashes = await ctx.task(hashCurrentContractTestsTask, { projectRoot })
  frozenBoundaryHash = await ctx.task(hashReviewRecoveryBoundaryTask, { projectRoot })
  frozenCompatibilityHashes = await ctx.task(hashReviewRecoveryCompatibilityTask, { projectRoot })
  if (
    !shellTaskPassed(frozenTestHashes) ||
    !shellTaskPassed(frozenBoundaryHash) ||
    !shellTaskPassed(frozenCompatibilityHashes)
  ) {
    throw new Error('Current review-recovery inputs could not be frozen')
  }
  frozenVerification = await ctx.task(verifyReviewRecoveryFrozenTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    rfcHashes: frozenRfcHashes.stdout,
    ledgerHash: frozenLedgerHash.stdout,
    compatibilityHashes: frozenCompatibilityHashes.stdout,
    verificationNonce: 'initial-review-scope-recovery-20260719',
    allowedDirtyPaths: activeAllowedDirtyPaths,
  })
  if (!shellTaskPassed(frozenVerification)) {
    throw new Error('Current review-recovery provenance verification failed')
  }
  const reviewRecoveryTree = await ctx.task(hashReviewRecoveryMilestoneTreeTask, { projectRoot })
  if (!shellTaskPassed(reviewRecoveryTree)) {
    throw new Error('Current review-recovery milestone tree could not be frozen')
  }
  focusedGate = await ctx.task(reviewRecoveryFocusedGateTask, {
    projectRoot,
    frozenTreeHashes: reviewRecoveryTree.stdout,
    milestonePaths: activeMilestonePaths,
    implementationPaths: activeImplementationPaths,
    allowedDirtyPaths: activeAllowedDirtyPaths,
  })
  const postReviewRecoveryGateTree = await ctx.task(verifyReviewRecoveryMilestoneTreeTask, {
    projectRoot,
    expected: reviewRecoveryTree.stdout,
  })
  if (!shellTaskPassed(postReviewRecoveryGateTree)) {
    throw new Error('Review-recovery focused gate changed milestone artifacts')
  }
  if (!shellTaskPassed(focusedGate)) {
    throw new Error('Review-recovery focused gate did not pass')
  }
  focusedGateTreeHashes = reviewRecoveryTree.stdout
  const currentContractTestHashes = await ctx.task(hashCurrentContractTestsTask, { projectRoot })
  if (!shellTaskPassed(currentContractTestHashes))
    throw new Error('Current asset contract tests could not be frozen before review')
  if (currentContractTestHashes.stdout.trim() !== frozenTestHashes.stdout.trim()) {
    const refreezeVerification = await ctx.task(verifyAdapterHarnessRefreezeTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
    })
    if (!shellTaskPassed(refreezeVerification))
      throw new Error('Pre-review adapter harness refreeze failed provenance checks')
    frozenTestHashes = currentContractTestHashes
    adapterHarnessRefrozen = true
  }
  for (let attempt = 0; ; attempt += 1) {
    const candidateTreeHashes = await ctx.task(hashCurrentReviewTreeTask, {
      projectRoot,
      reviewNonce: `attempt-${attempt + 1}`,
      focusedGateEvidence: JSON.stringify(focusedGate),
      paths: activeMilestonePaths,
    })
    if (!shellTaskPassed(candidateTreeHashes)) throw new Error('Reviewed asset tree could not be frozen')
    const artifacts = await ctx.task(readBoundedReviewEvidenceTask, {
      projectRoot,
      reviewNonce: `attempt-${attempt + 1}\n${candidateTreeHashes.stdout}`,
      redEvidence: JSON.stringify(redEvidence),
      frozenVerificationEvidence: JSON.stringify(frozenVerification),
      focusedGateEvidence: JSON.stringify(focusedGate),
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      focusedGateTreeHashes,
      reviewedTreeHashes: candidateTreeHashes.stdout,
      milestonePaths: activeMilestonePaths,
      reviewCodePaths: activeReviewCodePaths,
      reconciliationEvidence: reviewReconciliationEvidence,
    })
    if (!reviewEvidenceReady(artifacts))
      throw new Error('Asset review evidence was empty, incomplete, or could not be assembled')
    review = await ctx.task(currentEvidenceReviewTask, { spec: spec.stdout, artifacts: artifacts.stdout })
    const postReviewTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `reviewed asset tree attempt ${attempt + 1}`,
      paths: activeMilestonePaths,
      expected: candidateTreeHashes.stdout,
    })
    if (!shellTaskPassed(postReviewTree)) throw new Error('Independent reviewer changed milestone artifacts')
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      allowedDirtyPaths: activeAllowedDirtyPaths,
    })
    if (!shellTaskPassed(frozenVerification)) throw new Error('Independent reviewer changed frozen inputs or scope')
    if (reviewPassed(review) && shellTaskPassed(focusedGate)) {
      reviewedTreeHashes = candidateTreeHashes.stdout
      break
    }
    if (!reviewHasActionableBlockers(review)) {
      throw new Error('Independent asset review was contradictory or lacked actionable path:line blockers')
    }
    if (reviewContradictsCurrentEvidence(review, focusedGate, frozenTestHashes)) {
      staleEvidenceRetries += 1
      if (staleEvidenceRetries > 1)
        throw new Error('Independent asset review contradicted bounded current evidence twice')
      continue
    }
    if (!adapterHarnessRefrozen && reviewRequiresAdapterHarnessRefreeze(review)) {
      await ctx.task(refreezeAdapterHarnessTask, {
        projectRoot,
        review: JSON.stringify(review),
        testHashes: frozenTestHashes.stdout,
      })
      const refreezeVerification = await ctx.task(verifyAdapterHarnessRefreezeTask, {
        projectRoot,
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
      })
      if (!shellTaskPassed(refreezeVerification))
        throw new Error('Controlled adapter harness refreeze changed protected inputs or failed provenance checks')
      frozenTestHashes = await ctx.task(hashPathsTask, {
        projectRoot,
        label: 'asset contract tests after controlled adapter harness refreeze',
        paths: contractTestPaths,
      })
      if (!shellTaskPassed(frozenTestHashes)) throw new Error('Corrected adapter harness could not be refrozen')
      adapterHarnessRefrozen = true
      const refrozenTreeHashes = await ctx.task(hashPathsTask, {
        projectRoot,
        label: `asset tree after controlled adapter harness refreeze ${attempt + 1}`,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(refrozenTreeHashes)) throw new Error('Refrozen adapter harness tree could not be frozen')
      focusedGateTreeHashes = refrozenTreeHashes.stdout
      focusedGate = await ctx.task(focusedGateTask, {
        projectRoot,
        frozenTreeHashes: focusedGateTreeHashes,
        milestonePaths: activeMilestonePaths,
        implementationPaths: activeImplementationPaths,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      const postRefreezeGateTree = await ctx.task(verifyPathHashesTask, {
        projectRoot,
        label: `asset tree after controlled adapter harness gate ${attempt + 1}`,
        paths: activeMilestonePaths,
        expected: refrozenTreeHashes.stdout,
      })
      if (!shellTaskPassed(postRefreezeGateTree))
        throw new Error('Focused gate changed the controlled adapter harness tree')
      continue
    }
    const remediation = await ctx.task(currentEvidenceRemediateTask, {
      projectRoot,
      review: JSON.stringify(review),
      artifacts: artifacts.stdout,
      spec: spec.stdout,
    })
    const remediatedTreeHashes = await ctx.task(hashCurrentReviewRemediatedTreeTask, {
      projectRoot,
      attempt: attempt + 1,
      reviewInputTree: candidateTreeHashes.stdout,
      reviewResult: JSON.stringify(review),
      remediationResult: JSON.stringify(remediation),
      paths: activeMilestonePaths,
    })
    if (!shellTaskPassed(remediatedTreeHashes)) throw new Error('Remediated asset tree could not be frozen')
    frozenVerification = await ctx.task(verifyCurrentReviewRemediationFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      remediatedTreeHashes: remediatedTreeHashes.stdout,
      allowedDirtyPaths: activeAllowedDirtyPaths,
    })
    if (!shellTaskPassed(frozenVerification)) throw new Error('Frozen asset inputs changed during remediation')
    focusedGate = await ctx.task(currentReviewRemediationFocusedGateTask, {
      projectRoot,
      attempt: attempt + 1,
      frozenTreeHashes: remediatedTreeHashes.stdout,
      remediatedTreeHashes: remediatedTreeHashes.stdout,
      milestonePaths: activeMilestonePaths,
      implementationPaths: activeImplementationPaths,
      allowedDirtyPaths: activeAllowedDirtyPaths,
    })
    focusedGateTreeHashes = remediatedTreeHashes.stdout
    const postRemediationGateTree = await ctx.task(verifyCurrentReviewRemediationTreeTask, {
      projectRoot,
      attempt: attempt + 1,
      expected: remediatedTreeHashes.stdout,
      remediatedTreeHashes: remediatedTreeHashes.stdout,
      paths: activeMilestonePaths,
    })
    if (!shellTaskPassed(postRemediationGateTree)) throw new Error('Focused gate changed remediated asset artifacts')
    if (!shellTaskPassed(focusedGate)) {
      const gateFailure = {
        passed: false,
        score: 0,
        blockers: [`focused-gate:1 - ${`${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`.trim()}`],
        risks: [],
        summary: 'Fresh focused gates failed after current-review remediation.',
      }
      await ctx.task(postReviewGateRemediateTask, {
        projectRoot,
        review: JSON.stringify(gateFailure),
        artifacts: `${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`,
        spec: spec.stdout,
      })
      const gateRemediatedTree = await ctx.task(hashPostReviewGateRemediatedTreeTask, {
        projectRoot,
        attempt: attempt + 1,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(gateRemediatedTree)) throw new Error('Post-review gate-remediated tree could not be frozen')
      frozenVerification = await ctx.task(verifyFrozenTask, {
        projectRoot,
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
        verificationNonce: `post-review-gate-${attempt + 1}`,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      if (!shellTaskPassed(frozenVerification))
        throw new Error('Frozen asset inputs changed during post-review gate remediation')
      focusedGate = await ctx.task(postReviewFocusedGateTask, {
        projectRoot,
        attempt: attempt + 1,
        frozenTreeHashes: gateRemediatedTree.stdout,
        gateRemediatedTreeHashes: gateRemediatedTree.stdout,
        milestonePaths: activeMilestonePaths,
        implementationPaths: activeImplementationPaths,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      focusedGateTreeHashes = gateRemediatedTree.stdout
      const postGateRemediationTree = await ctx.task(verifyPathHashesTask, {
        projectRoot,
        label: `post-review gate-remediated tree after focused gate ${attempt + 1}`,
        paths: activeMilestonePaths,
        expected: gateRemediatedTree.stdout,
      })
      if (!shellTaskPassed(postGateRemediationTree))
        throw new Error('Focused gate changed post-review remediated asset artifacts')
      let gateRemediationRound = 1
      while (!shellTaskPassed(focusedGate)) {
        gateRemediationRound += 1
        const repeatedGateFailure = {
          passed: false,
          score: 0,
          blockers: [`focused-gate:1 - ${`${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`.trim()}`],
          risks: [],
          summary: `Fresh focused gates still failed after post-review remediation round ${gateRemediationRound - 1}.`,
        }
        await ctx.task(postReviewGateRemediateTask, {
          projectRoot,
          review: JSON.stringify(repeatedGateFailure),
          artifacts: `${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`,
          spec: spec.stdout,
          remediationRound: gateRemediationRound,
        })
        const repeatedGateRemediatedTree = await ctx.task(hashPostReviewGateRemediatedTreeTask, {
          projectRoot,
          attempt: `${attempt + 1}.${gateRemediationRound}`,
          paths: activeMilestonePaths,
        })
        if (!shellTaskPassed(repeatedGateRemediatedTree)) {
          throw new Error('Repeated post-review gate-remediated tree could not be frozen')
        }
        frozenVerification = await ctx.task(verifyFrozenTask, {
          projectRoot,
          testHashes: frozenTestHashes.stdout,
          boundaryHash: frozenBoundaryHash.stdout,
          rfcHashes: frozenRfcHashes.stdout,
          ledgerHash: frozenLedgerHash.stdout,
          compatibilityHashes: frozenCompatibilityHashes.stdout,
          verificationNonce: `post-review-gate-${attempt + 1}.${gateRemediationRound}`,
          allowedDirtyPaths: activeAllowedDirtyPaths,
        })
        if (!shellTaskPassed(frozenVerification)) {
          throw new Error('Frozen asset inputs changed during repeated post-review gate remediation')
        }
        focusedGate = await ctx.task(postReviewFocusedGateTask, {
          projectRoot,
          attempt: `${attempt + 1}.${gateRemediationRound}`,
          frozenTreeHashes: repeatedGateRemediatedTree.stdout,
          gateRemediatedTreeHashes: repeatedGateRemediatedTree.stdout,
          milestonePaths: activeMilestonePaths,
          implementationPaths: activeImplementationPaths,
          allowedDirtyPaths: activeAllowedDirtyPaths,
        })
        focusedGateTreeHashes = repeatedGateRemediatedTree.stdout
        const postRepeatedGateRemediationTree = await ctx.task(verifyPathHashesTask, {
          projectRoot,
          label: `post-review gate-remediated tree after focused gate ${attempt + 1}.${gateRemediationRound}`,
          paths: activeMilestonePaths,
          expected: repeatedGateRemediatedTree.stdout,
        })
        if (!shellTaskPassed(postRepeatedGateRemediationTree)) {
          throw new Error('Focused gate changed repeatedly remediated asset artifacts')
        }
      }
    }
  }

  if (!reviewPassed(review) || !shellTaskPassed(focusedGate)) {
    return { success: false, beadId, review, reason: 'Independent asset review did not reach passing score 90' }
  }

  let fullGateRemediationRound = 0
  const runActiveFocusedGate = (attempt, treeHashes) =>
    ctx.task(reviewScopeRefrozen ? currentReviewRemediationFocusedGateTask : postReviewFocusedGateTask, {
      projectRoot,
      attempt,
      frozenTreeHashes: treeHashes,
      ...(reviewScopeRefrozen
        ? {
            remediatedTreeHashes: treeHashes,
            milestonePaths: activeMilestonePaths,
            implementationPaths: activeImplementationPaths,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          }
        : { gateRemediatedTreeHashes: treeHashes }),
    })
  for (;;) {
    const fullGateAttempt = fullGateRemediationRound + 1
    const preFullGateTree = await ctx.task(hashFinalCurrentReviewTreeTask, {
      projectRoot,
      reviewNonce: `pre-full-repository-gates-${fullGateAttempt}`,
      paths: activeMilestonePaths,
    })
    if (!shellTaskPassed(preFullGateTree)) throw new Error('Asset tree could not be frozen before full gates')
    const fullGates = await ctx.task(fullGatesTask, { projectRoot, fullGateAttempt })
    const postFullGateTree = await ctx.task(verifyFinalReviewTreeTask, {
      projectRoot,
      label: `asset tree after full repository gates ${fullGateAttempt}`,
      paths: activeMilestonePaths,
      expected: preFullGateTree.stdout,
    })
    if (!shellTaskPassed(postFullGateTree)) throw new Error('Full repository gates changed generated artifacts')
    if (shellTaskPassed(fullGates)) {
      if (reviewScopeRefrozen) {
        const finalReviewVersion = 'v10'
        let finalReviewRound = 0
        let finalSecurityTestsRefrozen = false
        let finalReviewRedEvidence = redEvidence
        let finalProjectRootImplementationHashes = ''

        for (;;) {
          finalReviewRound += 1
          const finalAttempt = `${fullGateAttempt}.${finalReviewRound}`
          const finalCandidateTree = await ctx.task(hashFinalCurrentReviewTreeTask, {
            projectRoot,
            reviewNonce: `final-full-gate-${finalReviewVersion}-${finalAttempt}`,
            focusedGateEvidence: JSON.stringify(focusedGate),
            paths: activeMilestonePaths,
          })
          if (!shellTaskPassed(finalCandidateTree)) {
            throw new Error('Final recovery-scope review tree could not be frozen')
          }
          const finalFocusedGate = await ctx.task(finalCurrentReviewFocusedGateTask, {
            projectRoot,
            attempt: `final-full-gate-${finalReviewVersion}-${finalAttempt}`,
            frozenTreeHashes: finalCandidateTree.stdout,
            remediatedTreeHashes: finalCandidateTree.stdout,
            milestonePaths: activeMilestonePaths,
            implementationPaths: activeImplementationPaths,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          })
          const postFinalFocusedGateTree = await ctx.task(verifyFinalReviewTreeTask, {
            projectRoot,
            label: `final recovery-scope focused-gate tree ${finalReviewVersion}.${finalAttempt}`,
            paths: activeMilestonePaths,
            expected: finalCandidateTree.stdout,
          })
          if (!shellTaskPassed(postFinalFocusedGateTree)) {
            throw new Error('Final focused gate changed recovery-scope artifacts')
          }
          if (!shellTaskPassed(finalFocusedGate)) {
            throw new Error('Final recovery-scope focused gate did not pass')
          }
          focusedGate = finalFocusedGate
          focusedGateTreeHashes = finalCandidateTree.stdout
          const finalReviewArtifacts = await ctx.task(readFinalBoundedReviewEvidenceTask, {
            projectRoot,
            reviewNonce: `final-full-gate-${finalReviewVersion}-${finalAttempt}`,
            evidenceVersion: finalReviewVersion,
            redEvidence: JSON.stringify(finalReviewRedEvidence),
            frozenVerificationEvidence: JSON.stringify(frozenVerification),
            focusedGateEvidence: JSON.stringify(focusedGate),
            testHashes: frozenTestHashes.stdout,
            boundaryHash: frozenBoundaryHash.stdout,
            rfcHashes: frozenRfcHashes.stdout,
            ledgerHash: frozenLedgerHash.stdout,
            compatibilityHashes: frozenCompatibilityHashes.stdout,
            focusedGateTreeHashes,
            reviewedTreeHashes: finalCandidateTree.stdout,
            reconciliationEvidence: reviewReconciliationEvidence,
            milestonePaths: activeMilestonePaths,
            reviewCodePaths: activeReviewCodePaths,
            fullGateEvidence: JSON.stringify(fullGates),
          })
          if (!reviewEvidenceReady(finalReviewArtifacts)) {
            throw new Error('Final recovery-scope review evidence was empty, incomplete, or over budget')
          }
          const finalReview = await ctx.task(finalEvidenceReviewTask, {
            spec: spec.stdout,
            artifacts: finalReviewArtifacts.stdout,
          })
          const postFinalReviewTree = await ctx.task(verifyFinalReviewTreeTask, {
            projectRoot,
            label: `final recovery-scope reviewed tree ${finalReviewVersion}.${finalAttempt}`,
            paths: activeMilestonePaths,
            expected: finalCandidateTree.stdout,
          })
          if (!shellTaskPassed(postFinalReviewTree)) {
            throw new Error('Final independent reviewer changed recovery-scope artifacts')
          }
          frozenVerification = await ctx.task(verifyFinalReviewFrozenTask, {
            projectRoot,
            testHashes: frozenTestHashes.stdout,
            boundaryHash: frozenBoundaryHash.stdout,
            rfcHashes: frozenRfcHashes.stdout,
            ledgerHash: frozenLedgerHash.stdout,
            compatibilityHashes: frozenCompatibilityHashes.stdout,
            verificationNonce: `final-full-gate-review-${finalReviewVersion}-${finalAttempt}`,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          })

          if (!shellTaskPassed(frozenVerification)) {
            if (!reviewRequiresScopeRefreeze(finalReview)) {
              throw new Error('Final independent reviewer changed frozen recovery-scope inputs')
            }
            const implementationBeforeScopeReconciliation = await ctx.task(hashPathsTask, {
              projectRoot,
              label: `final scope-reconciliation implementation ${finalReviewVersion}.${finalAttempt}`,
              paths: reviewRecoveryImplementationPaths,
            })
            if (!shellTaskPassed(implementationBeforeScopeReconciliation)) {
              throw new Error('Final scope-reconciliation implementation could not be frozen')
            }
            const finalScopeVerification = await ctx.task(verifyReviewScopeRefreezeTask, {
              projectRoot,
              testHashes: frozenTestHashes.stdout,
              implementationHashes: implementationBeforeScopeReconciliation.stdout,
              boundaryHash: frozenBoundaryHash.stdout,
              compatibilityHashes: frozenCompatibilityHashes.stdout,
              ledgerHash: frozenLedgerHash.stdout,
            })
            if (!shellTaskPassed(finalScopeVerification)) {
              throw new Error('Final controlled scope refreeze failed provenance checks')
            }
            frozenBoundaryHash = await ctx.task(hashPathsTask, {
              projectRoot,
              label: `final reconciled asset boundary ${finalReviewVersion}.${finalAttempt}`,
              paths: [boundaryPath],
            })
            frozenCompatibilityHashes = await ctx.task(hashPathsTask, {
              projectRoot,
              label: `final reconciled compatibility tests ${finalReviewVersion}.${finalAttempt}`,
              paths: mutableCompatibilityTestPaths,
            })
            if (!shellTaskPassed(frozenBoundaryHash) || !shellTaskPassed(frozenCompatibilityHashes)) {
              throw new Error('Final controlled scope artifacts could not be refrozen')
            }
            reviewReconciliationEvidence = JSON.stringify({
              kind: 'verified-final-scope-refreeze',
              review: finalReview,
              verification: finalScopeVerification,
            })
            continue
          }

          if (reviewPassed(finalReview)) {
            review = finalReview
            reviewedTreeHashes = finalCandidateTree.stdout
            break
          }
          if (!reviewHasActionableBlockers(finalReview)) {
            throw new Error('Final recovery-scope review lacked actionable path:line blockers')
          }

          if (!finalSecurityTestsRefrozen) {
            const implementationBeforeSecurityTests = await ctx.task(hashPathsTask, {
              projectRoot,
              label: `final security implementation before RED ${finalReviewVersion}.${finalAttempt}`,
              paths: reviewRecoveryImplementationPaths,
            })
            if (!shellTaskPassed(implementationBeforeSecurityTests)) {
              throw new Error('Final security implementation could not be frozen before RED')
            }
            await ctx.task(finalSecurityRegressionTask, {
              projectRoot,
              review: JSON.stringify(finalReview),
              testHashes: frozenTestHashes.stdout,
            })
            const finalSecurityRegressionVerification = await ctx.task(verifyFinalSecurityRegressionTask, {
              projectRoot,
              testHashes: frozenTestHashes.stdout,
              implementationHashes: implementationBeforeSecurityTests.stdout,
              boundaryHash: frozenBoundaryHash.stdout,
              compatibilityHashes: frozenCompatibilityHashes.stdout,
              ledgerHash: frozenLedgerHash.stdout,
            })
            if (!shellTaskPassed(finalSecurityRegressionVerification)) {
              throw new Error('Final security regression refreeze changed protected inputs or write scope')
            }
            const draftProjectRootRed = await ctx.task(draftProjectRootIsolationRedTask, { projectRoot })
            if (!shellTaskPassed(draftProjectRootRed)) {
              throw new Error('Draft project-root isolation regression did not produce valid behavioral RED evidence')
            }
            const draftProjectRootTests = await ctx.task(hashFinalProjectRootDraftTestsTask, { projectRoot })
            if (!shellTaskPassed(draftProjectRootTests)) {
              throw new Error('Draft project-root contract tests could not be frozen')
            }
            await ctx.task(correctFinalProjectRootErrorContractTask, {
              projectRoot,
              review: JSON.stringify(finalReview),
              testHashes: draftProjectRootTests.stdout,
            })
            const finalProjectRootErrorContractVerification = await ctx.task(verifyFinalProjectRootErrorContractTask, {
              projectRoot,
              testHashes: draftProjectRootTests.stdout,
              implementationHashes: implementationBeforeSecurityTests.stdout,
              boundaryHash: frozenBoundaryHash.stdout,
              rfcHashes: frozenRfcHashes.stdout,
              ledgerHash: frozenLedgerHash.stdout,
              compatibilityHashes: frozenCompatibilityHashes.stdout,
            })
            if (!shellTaskPassed(finalProjectRootErrorContractVerification)) {
              throw new Error('Final project-root error-contract correction changed protected inputs or write scope')
            }
            const finalProjectRootRed = await ctx.task(finalProjectRootIsolationRedTask, { projectRoot })
            if (!shellTaskPassed(finalProjectRootRed)) {
              throw new Error(
                'Corrected project-root isolation regression did not produce valid behavioral RED evidence',
              )
            }
            frozenTestHashes = await ctx.task(hashFinalProjectRootContractTestsTask, { projectRoot })
            if (!shellTaskPassed(frozenTestHashes)) {
              throw new Error('Final security contract tests could not be refrozen')
            }
            const finalProjectRootImplementationBaseline = await ctx.task(
              verifyFinalProjectRootImplementationBaselineTask,
              {
                projectRoot,
                expected: implementationBeforeSecurityTests.stdout,
              },
            )
            if (!shellTaskPassed(finalProjectRootImplementationBaseline)) {
              throw new Error('Implementation changed before final project-root remediation')
            }
            finalProjectRootImplementationHashes = finalProjectRootImplementationBaseline.stdout
            finalReviewRedEvidence = {
              exitCode: 0,
              success: true,
              stdout: `${redEvidence.stdout ?? ''}\n${finalProjectRootRed.stdout ?? ''}`,
              stderr: `${redEvidence.stderr ?? ''}\n${finalProjectRootRed.stderr ?? ''}`,
            }
            finalSecurityTestsRefrozen = true
          }

          if (!finalProjectRootImplementationHashes) {
            throw new Error('Final project-root implementation baseline is unavailable')
          }
          const preFinalRemediationTree = await ctx.task(hashFinalProjectRootRemediationInputTask, {
            projectRoot,
            paths: activeMilestonePaths,
          })
          if (!shellTaskPassed(preFinalRemediationTree)) {
            throw new Error('Final review remediation input tree could not be frozen')
          }
          const finalRemediation = await ctx.task(finalProjectRootRemediationTask, {
            projectRoot,
            review: JSON.stringify(finalReview),
            redEvidence: JSON.stringify(finalReviewRedEvidence),
            testHashes: frozenTestHashes.stdout,
            implementationHashes: finalProjectRootImplementationHashes,
          })
          if (!remediationMadeProgress(finalRemediation)) {
            throw new Error('Final independent-review remediation reported no file and blocker progress')
          }
          const finalRemediatedTree = await ctx.task(verifyFinalProjectRootRemediationTask, {
            projectRoot,
            testHashes: frozenTestHashes.stdout,
            implementationHashes: finalProjectRootImplementationHashes,
            boundaryHash: frozenBoundaryHash.stdout,
            rfcHashes: frozenRfcHashes.stdout,
            ledgerHash: frozenLedgerHash.stdout,
            compatibilityHashes: frozenCompatibilityHashes.stdout,
            paths: activeMilestonePaths,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          })
          if (!shellTaskPassed(finalRemediatedTree)) {
            throw new Error('Final remediated asset tree could not be frozen')
          }
          if (finalRemediatedTree.stdout.trim() === preFinalRemediationTree.stdout.trim()) {
            throw new Error('Final independent-review remediation left the reviewed tree unchanged')
          }
          frozenVerification = await ctx.task(verifyFinalReviewFrozenTask, {
            projectRoot,
            testHashes: frozenTestHashes.stdout,
            boundaryHash: frozenBoundaryHash.stdout,
            rfcHashes: frozenRfcHashes.stdout,
            ledgerHash: frozenLedgerHash.stdout,
            compatibilityHashes: frozenCompatibilityHashes.stdout,
            verificationNonce: `final-remediation-${finalReviewVersion}-${finalAttempt}`,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          })
          if (!shellTaskPassed(frozenVerification)) {
            throw new Error('Frozen inputs changed during final independent-review remediation')
          }
          focusedGate = await ctx.task(finalCurrentReviewFocusedGateTask, {
            projectRoot,
            attempt: `final-remediation-${finalReviewVersion}-${finalAttempt}`,
            frozenTreeHashes: finalRemediatedTree.stdout,
            remediatedTreeHashes: finalRemediatedTree.stdout,
            milestonePaths: activeMilestonePaths,
            implementationPaths: activeImplementationPaths,
            allowedDirtyPaths: activeAllowedDirtyPaths,
          })
          const postFinalRemediationGateTree = await ctx.task(verifyFinalReviewTreeTask, {
            projectRoot,
            label: `final remediated focused-gate tree ${finalReviewVersion}.${finalAttempt}`,
            paths: activeMilestonePaths,
            expected: finalRemediatedTree.stdout,
          })
          if (!shellTaskPassed(postFinalRemediationGateTree)) {
            throw new Error('Final focused gate changed remediated recovery-scope artifacts')
          }
          if (!shellTaskPassed(focusedGate)) {
            throw new Error('Final remediated recovery-scope focused gate did not pass')
          }
          reviewReconciliationEvidence = JSON.stringify({
            kind: 'final-security-remediation',
            review: finalReview,
            remediation: finalRemediation,
          })
        }
      }
      break
    }

    fullGateRemediationRound += 1
    const fullGateFailure = {
      passed: false,
      score: 0,
      blockers: [
        `electron/main.ts:1 - Full repository gate failed; verify the exact output and repair only implementation-path blockers: ${`${fullGates.stdout ?? ''}\n${fullGates.stderr ?? ''}`.trim()}`,
      ],
      risks: [],
      summary: `Full repository gates failed on attempt ${fullGateAttempt}.`,
    }
    const fullGateArtifacts = `${fullGates.stdout ?? ''}\n${fullGates.stderr ?? ''}`
    await ctx.task(fullGateRemediateTask, {
      projectRoot,
      review: JSON.stringify(fullGateFailure),
      artifacts: fullGateArtifacts,
      spec: spec.stdout,
      remediationRound: fullGateRemediationRound,
      testHashes: frozenTestHashes.stdout,
      currentTreeHashes: preFullGateTree.stdout,
    })

    let remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
      projectRoot,
      round: `${fullGateRemediationRound}.initial`,
      paths: activeMilestonePaths,
    })
    if (!shellTaskPassed(remediatedTree)) throw new Error('Full-gate remediation tree could not be frozen')
    frozenVerification = await ctx.task(verifyFullGateRemediationFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      verificationNonce: `full-gate-${fullGateRemediationRound}`,
      allowedDirtyPaths: activeAllowedDirtyPaths,
    })
    if (!shellTaskPassed(frozenVerification))
      throw new Error('Frozen asset inputs changed during full-gate remediation')
    focusedGateTreeHashes = remediatedTree.stdout
    focusedGate = await runActiveFocusedGate(`full-gate-${fullGateRemediationRound}`, focusedGateTreeHashes)
    if (isEmptyUnexpectedMilestoneWrites(focusedGate)) {
      remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
        projectRoot,
        round: `${fullGateRemediationRound}.transport-retry`,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(remediatedTree)) throw new Error('Transport-retry tree could not be frozen')
      focusedGateTreeHashes = remediatedTree.stdout
      focusedGate = await runActiveFocusedGate(
        `full-gate-${fullGateRemediationRound}-transport-retry`,
        focusedGateTreeHashes,
      )
    }
    let postRemediationTree = await ctx.task(verifyFullGateRemediationTreeTask, {
      projectRoot,
      label: `asset tree after full-gate focused gate ${fullGateRemediationRound}`,
      paths: activeMilestonePaths,
      expected: remediatedTree.stdout,
    })
    if (!shellTaskPassed(postRemediationTree)) throw new Error('Focused gate changed full-gate remediated artifacts')

    let focusedRemediationRound = 0
    while (!shellTaskPassed(focusedGate)) {
      if (!reviewScopeRefrozen && unexpectedMilestoneWritesInclude(focusedGate, projectSessionPath)) {
        reviewScopeRefrozen = true
        activeMilestonePaths = reviewRecoveryMilestonePaths
        activeImplementationPaths = reviewRecoveryImplementationPaths
        activeReviewCodePaths = reviewRecoveryCodePaths
        activeAllowedDirtyPaths = reviewRecoveryAllowedDirtyPaths
        reviewReconciliationEvidence = JSON.stringify({
          kind: 'controlled-review-scope-recovery',
          reason: `${projectSessionPath} is already part of the independently reviewed implementation`,
        })
        remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
          projectRoot,
          round: `${fullGateRemediationRound}.scope-recovery`,
          paths: activeMilestonePaths,
        })
        if (!shellTaskPassed(remediatedTree)) {
          throw new Error('Controlled review-scope recovery tree could not be frozen')
        }
        frozenVerification = await ctx.task(verifyFullGateRemediationFrozenTask, {
          projectRoot,
          testHashes: frozenTestHashes.stdout,
          boundaryHash: frozenBoundaryHash.stdout,
          rfcHashes: frozenRfcHashes.stdout,
          ledgerHash: frozenLedgerHash.stdout,
          compatibilityHashes: frozenCompatibilityHashes.stdout,
          verificationNonce: `full-gate-scope-recovery-${fullGateRemediationRound}`,
          allowedDirtyPaths: activeAllowedDirtyPaths,
        })
        if (!shellTaskPassed(frozenVerification)) {
          throw new Error('Frozen inputs changed during controlled review-scope recovery')
        }
        focusedGateTreeHashes = remediatedTree.stdout
        focusedGate = await runActiveFocusedGate(
          `full-gate-${fullGateRemediationRound}-scope-recovery`,
          focusedGateTreeHashes,
        )
        postRemediationTree = await ctx.task(verifyFullGateRemediationTreeTask, {
          projectRoot,
          label: `asset tree after controlled review-scope recovery ${fullGateRemediationRound}`,
          paths: activeMilestonePaths,
          expected: remediatedTree.stdout,
        })
        if (!shellTaskPassed(postRemediationTree)) {
          throw new Error('Focused gate changed controlled review-scope recovery artifacts')
        }
        continue
      }
      focusedRemediationRound += 1
      const focusedFailure = {
        passed: false,
        score: 0,
        blockers: [
          `src/platform/assets/contracts.ts:1 - Focused gate failed after full-gate remediation; verify the exact output and repair only implementation-path blockers: ${`${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`.trim()}`,
        ],
        risks: [],
        summary: `Focused gates failed after full-gate remediation round ${fullGateRemediationRound}.${focusedRemediationRound}.`,
      }
      await ctx.task(postReviewGateRemediateTask, {
        projectRoot,
        review: JSON.stringify(focusedFailure),
        artifacts: `${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`,
        spec: spec.stdout,
        remediationRound: `full-gate-${fullGateRemediationRound}.${focusedRemediationRound}`,
      })
      remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
        projectRoot,
        round: `${fullGateRemediationRound}.focused-${focusedRemediationRound}`,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(remediatedTree)) throw new Error('Full-gate focused remediation tree could not be frozen')
      frozenVerification = await ctx.task(verifyFullGateRemediationFrozenTask, {
        projectRoot,
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
        verificationNonce: `full-gate-focused-${fullGateRemediationRound}.${focusedRemediationRound}`,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      if (!shellTaskPassed(frozenVerification))
        throw new Error('Frozen asset inputs changed during full-gate focused remediation')
      focusedGateTreeHashes = remediatedTree.stdout
      focusedGate = await runActiveFocusedGate(
        `full-gate-${fullGateRemediationRound}.${focusedRemediationRound}`,
        focusedGateTreeHashes,
      )
      postRemediationTree = await ctx.task(verifyFullGateRemediationTreeTask, {
        projectRoot,
        label: `asset tree after full-gate repeated focused gate ${fullGateRemediationRound}.${focusedRemediationRound}`,
        paths: activeMilestonePaths,
        expected: remediatedTree.stdout,
      })
      if (!shellTaskPassed(postRemediationTree))
        throw new Error('Repeated focused gate changed full-gate remediated artifacts')
    }

    let restartFullGateRemediation = false
    for (let reviewRound = 1; ; reviewRound += 1) {
      let reviewFullGateEvidence = null
      if (reviewScopeRefrozen) {
        const preReviewFullGateTree = await ctx.task(hashPathsTask, {
          projectRoot,
          label: `asset tree before post-remediation full gates ${fullGateRemediationRound}.${reviewRound}`,
          paths: activeMilestonePaths,
        })
        if (!shellTaskPassed(preReviewFullGateTree)) {
          throw new Error('Post-remediation asset tree could not be frozen before full gates')
        }
        reviewFullGateEvidence = await ctx.task(fullGatesTask, {
          projectRoot,
          fullGateAttempt: `review-${fullGateRemediationRound}.${reviewRound}`,
        })
        const postReviewFullGateTree = await ctx.task(verifyPathHashesTask, {
          projectRoot,
          label: `asset tree after post-remediation full gates ${fullGateRemediationRound}.${reviewRound}`,
          paths: activeMilestonePaths,
          expected: preReviewFullGateTree.stdout,
        })
        if (!shellTaskPassed(postReviewFullGateTree)) {
          throw new Error('Post-remediation full gates changed asset artifacts')
        }
        if (!shellTaskPassed(reviewFullGateEvidence)) {
          restartFullGateRemediation = true
          break
        }
      }
      const candidateTreeHashes = await ctx.task(hashCurrentReviewTreeTask, {
        projectRoot,
        reviewNonce: `full-gate-${fullGateRemediationRound}.${reviewRound}`,
        focusedGateEvidence: JSON.stringify(focusedGate),
        ...(reviewScopeRefrozen ? { paths: activeMilestonePaths } : {}),
      })
      if (!shellTaskPassed(candidateTreeHashes)) throw new Error('Full-gate remediated review tree could not be frozen')
      const artifacts = await ctx.task(readBoundedReviewEvidenceTask, {
        projectRoot,
        reviewNonce: `full-gate-${fullGateRemediationRound}.${reviewRound}\n${candidateTreeHashes.stdout}`,
        redEvidence: JSON.stringify(redEvidence),
        frozenVerificationEvidence: JSON.stringify(frozenVerification),
        focusedGateEvidence: JSON.stringify(focusedGate),
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
        focusedGateTreeHashes,
        reviewedTreeHashes: candidateTreeHashes.stdout,
        reconciliationEvidence: reviewReconciliationEvidence,
        ...(reviewScopeRefrozen
          ? {
              milestonePaths: activeMilestonePaths,
              reviewCodePaths: activeReviewCodePaths,
              fullGateEvidence: JSON.stringify(reviewFullGateEvidence),
            }
          : {}),
      })
      if (!reviewEvidenceReady(artifacts)) {
        restartFullGateRemediation = true
        break
      }
      review = await ctx.task(currentEvidenceReviewTask, { spec: spec.stdout, artifacts: artifacts.stdout })
      const postReviewTree = await ctx.task(verifyPathHashesTask, {
        projectRoot,
        label: `full-gate remediated reviewed tree ${fullGateRemediationRound}.${reviewRound}`,
        paths: activeMilestonePaths,
        expected: candidateTreeHashes.stdout,
      })
      if (!shellTaskPassed(postReviewTree))
        throw new Error('Independent reviewer changed full-gate remediated artifacts')
      frozenVerification = await ctx.task(verifyFrozenTask, {
        projectRoot,
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
        verificationNonce: `full-gate-review-${fullGateRemediationRound}.${reviewRound}`,
        ...(reviewScopeRefrozen ? { allowedDirtyPaths: activeAllowedDirtyPaths } : {}),
      })
      if (!shellTaskPassed(frozenVerification)) throw new Error('Independent reviewer changed full-gate frozen inputs')
      if (reviewPassed(review)) {
        reviewedTreeHashes = candidateTreeHashes.stdout
        break
      }
      if (!reviewHasActionableBlockers(review)) {
        throw new Error('Full-gate remediated review lacked actionable path:line blockers')
      }
      if (reviewRequiresScopeRefreeze(review) && !reviewScopeRefrozen) {
        const preScopeRefreezeImplementationHashes = await ctx.task(hashPathsTask, {
          projectRoot,
          label: 'review-recovery implementation before controlled scope refreeze',
          paths: reviewRecoveryImplementationPaths,
        })
        if (!shellTaskPassed(preScopeRefreezeImplementationHashes)) {
          throw new Error('Review-recovery implementation could not be frozen before scope correction')
        }
        await ctx.task(refreezeReviewScopeTask, {
          projectRoot,
          review: JSON.stringify(review),
          boundary: boundary.stdout,
          compatibilityTest: '',
        })
        const scopeRefreezeVerification = await ctx.task(verifyReviewScopeRefreezeTask, {
          projectRoot,
          testHashes: frozenTestHashes.stdout,
          implementationHashes: preScopeRefreezeImplementationHashes.stdout,
          boundaryHash: frozenBoundaryHash.stdout,
          compatibilityHashes: frozenCompatibilityHashes.stdout,
          ledgerHash: frozenLedgerHash.stdout,
        })
        if (!shellTaskPassed(scopeRefreezeVerification)) {
          throw new Error('Controlled review-scope refreeze changed protected inputs or failed provenance checks')
        }
        const projectCloseRed = await ctx.task(projectCloseAuthorizationRedTask, { projectRoot })
        if (!shellTaskPassed(projectCloseRed)) {
          throw new Error('Project-close authorization regression did not produce valid RED evidence')
        }
        const projectCloseBehaviorRed = await ctx.task(projectCloseAuthorizationBehaviorRedTask, { projectRoot })
        if (!shellTaskPassed(projectCloseBehaviorRed)) {
          throw new Error('Project-close authorization regression did not produce behavioral assertion RED evidence')
        }
        frozenBoundaryHash = await ctx.task(hashPathsTask, {
          projectRoot,
          label: 'asset boundary after controlled review-scope refreeze',
          paths: [boundaryPath],
        })
        if (!shellTaskPassed(frozenBoundaryHash)) throw new Error('Corrected asset boundary could not be refrozen')
        frozenCompatibilityHashes = await ctx.task(hashPathsTask, {
          projectRoot,
          label: 'PlatformClient compatibility tests after project-close RED',
          paths: mutableCompatibilityTestPaths,
        })
        if (!shellTaskPassed(frozenCompatibilityHashes)) {
          throw new Error('Corrected compatibility tests could not be refrozen')
        }
        reviewScopeRefrozen = true
        activeMilestonePaths = reviewRecoveryMilestonePaths
        activeImplementationPaths = reviewRecoveryImplementationPaths
        activeReviewCodePaths = reviewRecoveryCodePaths
        activeAllowedDirtyPaths = reviewRecoveryAllowedDirtyPaths
        frozenVerification = await ctx.task(verifyFrozenTask, {
          projectRoot,
          testHashes: frozenTestHashes.stdout,
          boundaryHash: frozenBoundaryHash.stdout,
          rfcHashes: frozenRfcHashes.stdout,
          ledgerHash: frozenLedgerHash.stdout,
          compatibilityHashes: frozenCompatibilityHashes.stdout,
          allowedDirtyPaths: activeAllowedDirtyPaths,
          verificationNonce: `review-scope-refreeze-${fullGateRemediationRound}.${reviewRound}`,
        })
        if (!shellTaskPassed(frozenVerification)) {
          throw new Error('Frozen inputs changed during controlled review-scope refreeze')
        }
      }
      const preRemediationTree = await ctx.task(hashPathsTask, {
        projectRoot,
        label: `asset tree before review remediation ${fullGateRemediationRound}.${reviewRound}`,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(preRemediationTree)) throw new Error('Pre-remediation asset tree could not be frozen')
      const remediation = await ctx.task(currentEvidenceRemediateTask, {
        projectRoot,
        review: JSON.stringify(review),
        artifacts: artifacts.stdout,
        spec: spec.stdout,
        remediationRound: `full-gate-review-${fullGateRemediationRound}.${reviewRound}`,
        implementationPaths: activeImplementationPaths,
      })
      const madeProgress = remediationMadeProgress(remediation)
      const verifiedNoOp = remediationVerifiedNoOp(remediation, review)
      if (!madeProgress && !verifiedNoOp) {
        throw new Error('Independent-review remediation reported no verified file or blocker progress')
      }
      remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
        projectRoot,
        round: `${fullGateRemediationRound}.review-${reviewRound}`,
        paths: activeMilestonePaths,
      })
      if (!shellTaskPassed(remediatedTree)) throw new Error('Full-gate review remediation tree could not be frozen')
      if (remediatedTree.stdout.trim() === preRemediationTree.stdout.trim()) {
        if (!verifiedNoOp) throw new Error('Independent-review remediation left the reviewed asset tree unchanged')
        verifiedNoOpRemediationRetries += 1
        if (verifiedNoOpRemediationRetries > 1) {
          throw new Error('Independent review repeated blockers after verified no-op reconciliation')
        }
        reviewReconciliationEvidence = JSON.stringify({ review, remediation })
        continue
      }
      reviewReconciliationEvidence = ''
      frozenVerification = await ctx.task(verifyFrozenTask, {
        projectRoot,
        testHashes: frozenTestHashes.stdout,
        boundaryHash: frozenBoundaryHash.stdout,
        rfcHashes: frozenRfcHashes.stdout,
        ledgerHash: frozenLedgerHash.stdout,
        compatibilityHashes: frozenCompatibilityHashes.stdout,
        verificationNonce: `full-gate-review-remediation-${fullGateRemediationRound}.${reviewRound}`,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      if (!shellTaskPassed(frozenVerification))
        throw new Error('Frozen inputs changed during full-gate review remediation')
      focusedGateTreeHashes = remediatedTree.stdout
      focusedGate = await ctx.task(currentReviewRemediationFocusedGateTask, {
        projectRoot,
        attempt: `full-gate-review-${fullGateRemediationRound}.${reviewRound}`,
        frozenTreeHashes: focusedGateTreeHashes,
        remediatedTreeHashes: focusedGateTreeHashes,
        milestonePaths: activeMilestonePaths,
        implementationPaths: activeImplementationPaths,
        allowedDirtyPaths: activeAllowedDirtyPaths,
      })
      let postReviewRemediationTree = await ctx.task(verifyPathHashesTask, {
        projectRoot,
        label: `asset tree after full-gate review remediation gate ${fullGateRemediationRound}.${reviewRound}`,
        paths: activeMilestonePaths,
        expected: remediatedTree.stdout,
      })
      if (!shellTaskPassed(postReviewRemediationTree))
        throw new Error('Focused gate changed full-gate review-remediated artifacts')

      let reviewGateRemediationRound = 0
      while (!shellTaskPassed(focusedGate)) {
        reviewGateRemediationRound += 1
        const focusedFailure = {
          passed: false,
          score: 0,
          blockers: [
            `electron/assets/projectAssetStore.ts:1 - Focused gate failed after independent-review remediation; repair only the reported implementation blocker: ${`${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`.trim()}`,
          ],
          risks: [],
          summary: `Focused gate failed after full-gate review remediation ${fullGateRemediationRound}.${reviewRound}.${reviewGateRemediationRound}.`,
        }
        const gateRemediation = await ctx.task(postReviewGateRemediateTask, {
          projectRoot,
          review: JSON.stringify(focusedFailure),
          artifacts: `${focusedGate.stdout ?? ''}\n${focusedGate.stderr ?? ''}`,
          spec: spec.stdout,
          remediationRound: `full-gate-review-${fullGateRemediationRound}.${reviewRound}.${reviewGateRemediationRound}`,
          implementationPaths: activeImplementationPaths,
        })
        if (!remediationMadeProgress(gateRemediation)) {
          throw new Error('Review-gate remediation reported no verified file or blocker progress')
        }
        remediatedTree = await ctx.task(hashFullGateRemediatedTreeTask, {
          projectRoot,
          round: `${fullGateRemediationRound}.review-${reviewRound}.focused-${reviewGateRemediationRound}`,
          paths: activeMilestonePaths,
        })
        if (!shellTaskPassed(remediatedTree)) throw new Error('Review-gate remediation tree could not be frozen')
        frozenVerification = await ctx.task(verifyFrozenTask, {
          projectRoot,
          testHashes: frozenTestHashes.stdout,
          boundaryHash: frozenBoundaryHash.stdout,
          rfcHashes: frozenRfcHashes.stdout,
          ledgerHash: frozenLedgerHash.stdout,
          compatibilityHashes: frozenCompatibilityHashes.stdout,
          verificationNonce: `full-gate-review-focused-${fullGateRemediationRound}.${reviewRound}.${reviewGateRemediationRound}`,
          allowedDirtyPaths: activeAllowedDirtyPaths,
        })
        if (!shellTaskPassed(frozenVerification))
          throw new Error('Frozen inputs changed during review-gate remediation')
        focusedGateTreeHashes = remediatedTree.stdout
        focusedGate = await ctx.task(currentReviewRemediationFocusedGateTask, {
          projectRoot,
          attempt: `full-gate-review-${fullGateRemediationRound}.${reviewRound}.${reviewGateRemediationRound}`,
          frozenTreeHashes: focusedGateTreeHashes,
          remediatedTreeHashes: focusedGateTreeHashes,
          milestonePaths: activeMilestonePaths,
          implementationPaths: activeImplementationPaths,
          allowedDirtyPaths: activeAllowedDirtyPaths,
        })
        postReviewRemediationTree = await ctx.task(verifyPathHashesTask, {
          projectRoot,
          label: `asset tree after review-gate remediation ${fullGateRemediationRound}.${reviewRound}.${reviewGateRemediationRound}`,
          paths: activeMilestonePaths,
          expected: remediatedTree.stdout,
        })
        if (!shellTaskPassed(postReviewRemediationTree))
          throw new Error('Focused gate changed review-gate remediated artifacts')
      }
    }
    if (restartFullGateRemediation) continue
  }
  const prePackageTree = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset tree before packaged macOS smoke',
    paths: activeMilestonePaths,
  })
  if (!shellTaskPassed(prePackageTree)) throw new Error('Asset tree could not be frozen before packaged smoke')
  const packagedMacSmoke = await ctx.task(packagedMacSmokeTask, { projectRoot })
  if (!shellTaskPassed(packagedMacSmoke))
    throw new Error('Packaged macOS install smoke failed; asset milestone cannot be versioned')
  const postPackageTree = await ctx.task(verifyPathHashesTask, {
    projectRoot,
    label: 'asset tree after packaged macOS smoke',
    paths: activeMilestonePaths,
    expected: prePackageTree.stdout,
  })
  if (!shellTaskPassed(postPackageTree)) throw new Error('Packaged macOS smoke changed generated artifacts')
  const version = await ctx.task(versionTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    ledgerHash: frozenLedgerHash.stdout,
    compatibilityHashes: frozenCompatibilityHashes.stdout,
    reviewedTreeHashes,
    milestonePaths: activeMilestonePaths,
    allowedDirtyPaths: activeAllowedDirtyPaths,
  })
  if (!shellTaskPassed(version)) throw new Error('Asset milestone commit failed')
  const commitSha = version.stdout.trim().split('\n').at(-1)
  if (!/^[0-9a-f]{40}$/.test(commitSha || '')) throw new Error('Asset milestone did not return an exact commit SHA')
  const committedGate = await ctx.task(postCommitGateTask, {
    projectRoot,
    commitSha,
    testHashes: frozenTestHashes.stdout,
    boundaryHash: frozenBoundaryHash.stdout,
    ledgerHash: frozenLedgerHash.stdout,
    compatibilityHashes: frozenCompatibilityHashes.stdout,
    reviewedTreeHashes,
    milestonePaths: activeMilestonePaths,
    implementationPaths: activeImplementationPaths,
    allowedDirtyPaths: activeAllowedDirtyPaths,
  })
  if (!shellTaskPassed(committedGate))
    throw new Error('Committed asset tree verification failed; Beads closure is forbidden')
  const closedBead = await ctx.task(closeBeadTask, { projectRoot, beadId, score: review.score, commitSha })
  if (!shellTaskPassed(closedBead)) throw new Error('Asset child closure failed')

  return {
    success: true,
    beadId,
    review,
    commit: commitSha,
    parentStillPending: ['evmedia-r20.8', 'evmedia-r20.4'],
  }
}
