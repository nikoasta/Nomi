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
const implementationPaths = [
  'src/platform/assets/contracts.ts',
  'src/platform/assets/runtime.ts',
  'electron/assets/assetIdentity.ts',
  'electron/assets/projectAssetStore.ts',
  'src/platform/client.ts',
  'src/platform/browserPlatformClient.ts',
  'src/platform/electronPlatformClient.ts',
  'src/workbench/api/assetUploadApi.ts',
  'src/workbench/assets/useAllProjectAssets.ts',
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
  boundaryPath,
  ...contractTestPaths,
  ...implementationPaths,
  ...mutableCompatibilityTestPaths,
]
const requiredChangedPaths = [
  boundaryPath,
  ...contractTestPaths,
  'src/platform/assets/contracts.ts',
  'src/platform/assets/runtime.ts',
  'electron/assets/assetIdentity.ts',
]
const allowedDirtyPaths = ['.beads/interactions.jsonl', ...milestonePaths, ...frozenRfcPaths]
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
const milestonePathPattern = `^(${milestonePaths.map(regexEscape).join('|')})$`
const boundaryAllowedPattern = `^(${boundaryAllowedPaths.map(regexEscape).join('|')})$`
const preRedAllowedPattern = `^(${preRedAllowedPaths.map(regexEscape).join('|')})$`
const implementationAllowedPattern = `^(${implementationAllowedPaths.map(regexEscape).join('|')})$`

function taskIo(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  }
}

function shellTaskPassed(result) {
  return result?.exitCode === 0
}

function reviewPassed(review) {
  return review?.passed === true
    && Number.isFinite(review?.score)
    && review.score >= 90
    && review.score <= 100
    && Array.isArray(review?.blockers)
    && review.blockers.length === 0
}

function reviewHasActionableBlockers(review) {
  return review?.passed === false
    && Array.isArray(review?.blockers)
    && review.blockers.length > 0
    && review.blockers.every((blocker) => /^.+:\d+\s+-\s+.+$/.test(blocker))
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(`^(.beads/interactions\\.jsonl|${frozenRfcPaths.map(regexEscape).join('|')})$`)} || true)`,
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
      ].map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; sed -n '1,380p' "$file"; done`,
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(boundaryAllowedPattern)} || true)`,
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(preRedAllowedPattern)} || true)`,
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

const hashPathsTask = defineTask('hash-platform-assets-paths', (args, taskCtx) => ({
  kind: 'shell',
  title: `Freeze ${args.label}`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${args.paths.map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'hash', 'shell'],
}))

const verifyPathHashesTask = defineTask('verify-platform-assets-path-hashes', (args, taskCtx) => ({
  kind: 'shell',
  title: `Verify ${args.label} did not change`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && current=$(shasum -a 256 ${args.paths.map(quote).join(' ')}) && test "$current" = ${quote(args.expected.trim())} && printf '%s\\n' "$current"`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'hash', 'scope', 'shell'],
}))

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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(implementationAllowedPattern)} || true)`,
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(allowedDirtyPattern)} || true)`,
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

const verifyFrozenTask = defineTask('verify-platform-assets-frozen-inputs', (args, taskCtx) => ({
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(allowedDirtyPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected milestone writes:\\n%s\\n" "$unexpected"; exit 1; }',
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['frozen-input', 'scope', 'security', 'shell'],
}))

const focusedGateTask = defineTask('run-platform-assets-focused-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run asset-domain security and compatibility gates',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      `pnpm exec vitest run ${[...contractTestPaths, ...compatibilityTestPaths].map(quote).join(' ')}`,
      'pnpm run typecheck',
      `pnpm exec eslint ${[...implementationPaths, ...contractTestPaths, ...mutableCompatibilityTestPaths].map(quote).join(' ')}`,
      'if ! git diff --cached --quiet; then echo "Unexpected staged changes before review"; exit 1; fi',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(allowedDirtyPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected milestone writes:\\n%s\\n" "$unexpected"; exit 1; }',
      'git diff --quiet -- package.json pnpm-lock.yaml',
      `if rg -n -i "(@supabase|@vercel|firebase|clerk|auth0|cognito|okta|workos|keycloak|cloudflare|s3|gcs|azure[[:space:]_-]*blob)" ${implementationPaths.map(quote).join(' ')}; then echo 'Unapproved cloud/storage vendor coupling found'; exit 1; fi`,
      `if rg -n -i "(^|[^[:alnum:]_])(access[_-]?token|refresh[_-]?token|bearer[_-]?token|api[_-]?key|password|credential|client[_-]?secret|service[_-]?role|private[_-]?key)[^[:alnum:]_?]*[?]?[[:space:]]*:" ${['src/platform/assets/contracts.ts', 'src/platform/client.ts'].map(quote).join(' ')}; then echo 'Credential-bearing public asset contract found'; exit 1; fi`,
      `if rg -n -i "(^|[^[:alnum:]_])(secret|authorization|headers?|cookie|access[_-]?token|refresh[_-]?token|bearer[_-]?token|api[_-]?key|password|credential|client[_-]?secret|service[_-]?role|private[_-]?key|raw(Prompt|Response|Payload)|providerResponse)[^[:alnum:]_?]*[?]?[[:space:]]*:" ${['src/platform/assets/contracts.ts', 'electron/assets/assetIdentity.ts'].map(quote).join(' ')}; then echo 'Secret or raw-provider field found in persisted asset identity shape'; exit 1; fi`,
      `if rg -n "from[[:space:]]+[^[:alnum:]](node:|electron)|import\\([^)]*(node:|electron)|require\\([^)]*(node:|electron)|\\b(window|document|process|Buffer)\\b" ${['src/platform/assets/contracts.ts', 'src/platform/assets/runtime.ts'].map(quote).join(' ')}; then echo 'Runtime-specific import or global in pure asset contracts'; exit 1; fi`,
      `if rg -n -i "(^|[^[:alnum:]_])(url|uri|locator|path|absolutePath|relativePath|bucket(Key)?|object(Key)?|signedUrl|providerUrl|raw(Prompt|Response|Payload)|credentials?)[^[:alnum:]_?]*[?]?[[:space:]]*:|nomi-local://|file://|blob:|https?://" ${quote('src/platform/assets/contracts.ts')}; then echo 'Persisted domain contract contains locator, storage, credential, or raw-provider fields'; exit 1; fi`,
      `if rg -n "from[[:space:]]+[^[:alnum:]].*(generation|provider|electron|desktop)|import\\([^[:alnum:]].*(generation|provider|electron|desktop)" ${quote('src/platform/assets/contracts.ts')}; then echo 'Pure asset contract imports a provider or runtime layer'; exit 1; fi`,
      `if rg -n -i "create[[:space:]]+policy|row[[:space:]]+level[[:space:]]+security|alter[[:space:]]+table|supabase/migrations|drizzle|prisma" ${implementationPaths.map(quote).join(' ')}; then echo 'Migration or RLS implementation is outside this child'; exit 1; fi`,
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
}))

const readReviewEvidenceTask = defineTask('read-platform-assets-review-evidence', (args, taskCtx) => ({
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

const reviewTask = defineTask('review-platform-assets-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independently review asset-domain security and intent fidelity',
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

const remediateTask = defineTask('remediate-platform-assets-slice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate verified asset-review blockers',
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
        `Edit only these implementation paths: ${implementationPaths.join(', ')}. Do not create helper files.`,
        `Do not edit ${boundaryPath}, tests, Beads, RFC drafts, package files, migrations, or lockfiles.`,
        'Preserve stable identity, truthful provenance, locator separation, browser safety, Electron continuity, and legacy facade behavior.',
        'Do not add cloud/storage vendor coupling or broaden this child.',
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
}))

const fullGatesTask = defineTask('run-platform-assets-full-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run complete repository gates',
  shell: {
    command: `cd ${quote(args.projectRoot)} && pnpm run gates`,
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

const versionTask = defineTask('version-platform-assets-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit the reviewed reversible asset milestone',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Refusing to mix pre-staged changes into asset commit"; exit 1; }',
      `currentTree=$(shasum -a 256 ${milestonePaths.map(quote).join(' ')})`,
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
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(allowedDirtyPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected pre-commit writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `for file in ${milestonePaths.map(quote).join(' ')}; do test -s "$file" || { echo "Required milestone tree path missing or empty: $file"; exit 1; }; done`,
      `expected=$({ git diff --name-only -- ${milestonePaths.map(quote).join(' ')}; git ls-files --others --exclude-standard -- ${milestonePaths.map(quote).join(' ')}; } | sort -u)`,
      'test -n "$expected" || { echo "No asset changes to commit"; exit 1; }',
      `for file in ${requiredChangedPaths.map(quote).join(' ')}; do printf '%s\\n' "$expected" | rg -Fqx "$file" || { echo "Required new milestone path did not change: $file"; exit 1; }; done`,
      `git add ${milestonePaths.map(quote).join(' ')}`,
      'actual=$(git diff --cached --name-only | sort)',
      'test "$actual" = "$expected" || { printf "Unexpected staged paths:\\n%s\\n" "$actual"; exit 1; }',
      'git diff --cached --check',
      "git commit -m 'feat: add stable asset domain contracts'",
      'sha=$(git rev-parse HEAD)',
      'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
      'test "$committed" = "$expected" || { printf "Unexpected committed paths:\\n%s\\n" "$committed"; exit 1; }',
      'printf "%s\\n" "$sha"',
    ]),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['commit', 'evidence', 'git', 'shell'],
}))

const postCommitGateTask = defineTask('verify-platform-assets-commit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify the committed asset tree before Beads closure',
  shell: {
    command: checkedShell([
      `cd ${quote(args.projectRoot)}`,
      'sha=$(git rev-parse HEAD)',
      `test "$sha" = ${quote(args.commitSha)}`,
      'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
      `unexpected=$(printf '%s\\n' "$committed" | rg -v ${quote(milestonePathPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected committed paths:\\n%s\\n" "$unexpected"; exit 1; }',
      `for file in ${requiredChangedPaths.map(quote).join(' ')}; do printf '%s\\n' "$committed" | rg -Fqx "$file" || { echo "Required new committed path missing: $file"; exit 1; }; done`,
      `for file in ${milestonePaths.map(quote).join(' ')}; do test -s "$file" || { echo "Required milestone tree path missing or empty: $file"; exit 1; }; done`,
      `git diff --quiet HEAD -- ${milestonePaths.map(quote).join(' ')}`,
      `currentTree=$(shasum -a 256 ${milestonePaths.map(quote).join(' ')})`,
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
      `pnpm exec eslint ${[...implementationPaths, ...contractTestPaths, ...mutableCompatibilityTestPaths].map(quote).join(' ')}`,
      `postGateTree=$(shasum -a 256 ${milestonePaths.map(quote).join(' ')})`,
      `test "$postGateTree" = ${quote(args.reviewedTreeHashes.trim())}`,
      `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
      `git diff --quiet HEAD -- ${protectedCompatibilityTestPaths.map(quote).join(' ')}`,
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(allowedDirtyPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected post-commit writes:\\n%s\\n" "$unexpected"; exit 1; }',
      'printf "%s\\n" "$sha"',
    ]),
    expectedExitCode: 0,
    timeoutMs: 600000,
  },
  io: taskIo(taskCtx),
  labels: ['committed-tree', 'evidence', 'gate', 'security', 'shell'],
}))

const closeBeadTask = defineTask('close-platform-assets-slice', (args, taskCtx) => ({
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
  if (!shellTaskPassed(freshStart)) throw new Error('Asset run did not start from its committed bounded process revision')
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
  const frozenBoundaryHash = await ctx.task(hashPathsTask, { projectRoot, label: 'asset boundary', paths: [boundaryPath] })
  if (!shellTaskPassed(frozenBoundaryHash)) throw new Error('Asset boundary could not be frozen')
  await ctx.task(authorTestsTask, { projectRoot, spec: spec.stdout, boundary: boundary.stdout })
  const testsScope = await ctx.task(testsScopeTask, {
    projectRoot,
    boundaryHash: frozenBoundaryHash.stdout,
    ledgerHash: frozenLedgerHash.stdout,
  })
  if (!shellTaskPassed(testsScope)) throw new Error('Test author exceeded its write scope or changed frozen inputs')
  const frozenTestHashes = await ctx.task(hashPathsTask, { projectRoot, label: 'asset contract tests', paths: contractTestPaths })
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
  const frozenCompatibilityHashes = await ctx.task(hashPathsTask, {
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
  let focusedTreeHashes = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset tree before first executable focused gate',
    paths: milestonePaths,
  })
  if (!shellTaskPassed(focusedTreeHashes)) throw new Error('Asset tree could not be frozen before focused gates')
  let focusedGate = await ctx.task(focusedGateTask, { projectRoot })
  const postFocusedTree = await ctx.task(verifyPathHashesTask, {
    projectRoot,
    label: 'asset tree after first executable focused gate',
    paths: milestonePaths,
    expected: focusedTreeHashes.stdout,
  })
  if (!shellTaskPassed(postFocusedTree)) throw new Error('Focused asset gate changed generated artifacts')

  for (let attempt = 0; !shellTaskPassed(focusedGate) && attempt < 4; attempt += 1) {
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
    if (!shellTaskPassed(frozenVerification)) throw new Error('Frozen asset inputs changed during focused-gate remediation')
    focusedGate = await ctx.task(focusedGateTask, { projectRoot })
    const postRemediationGateTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `asset tree after focused-gate remediation check ${attempt + 1}`,
      paths: milestonePaths,
      expected: focusedTreeHashes.stdout,
    })
    if (!shellTaskPassed(postRemediationGateTree)) throw new Error('Focused gate changed remediated asset artifacts')
  }
  if (!shellTaskPassed(focusedGate)) throw new Error('Focused asset gate failed after four remediation attempts')

  let review = null
  let reviewedTreeHashes = null
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidateTreeHashes = await ctx.task(hashPathsTask, {
      projectRoot,
      label: `reviewed asset tree attempt ${attempt + 1}`,
      paths: milestonePaths,
    })
    if (!shellTaskPassed(candidateTreeHashes)) throw new Error('Reviewed asset tree could not be frozen')
    const artifacts = await ctx.task(readReviewEvidenceTask, {
      projectRoot,
      redEvidence: JSON.stringify(redEvidence),
      frozenVerificationEvidence: JSON.stringify(frozenVerification),
      focusedGateEvidence: JSON.stringify(focusedGate),
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
      reviewedTreeHashes: candidateTreeHashes.stdout,
    })
    if (!shellTaskPassed(artifacts)) throw new Error('Asset review evidence could not be assembled')
    review = await ctx.task(reviewTask, { spec: spec.stdout, artifacts: artifacts.stdout })
    const postReviewTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `reviewed asset tree attempt ${attempt + 1}`,
      paths: milestonePaths,
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
    })
    if (!shellTaskPassed(frozenVerification)) throw new Error('Independent reviewer changed frozen inputs or scope')
    if (reviewPassed(review) && shellTaskPassed(focusedGate)) {
      reviewedTreeHashes = candidateTreeHashes.stdout
      break
    }
    if (!reviewHasActionableBlockers(review)) {
      throw new Error('Independent asset review was contradictory or lacked actionable path:line blockers')
    }
    if (attempt === 3) break
    await ctx.task(remediateTask, {
      projectRoot,
      review: JSON.stringify(review),
      artifacts: artifacts.stdout,
      spec: spec.stdout,
    })
    const remediatedTreeHashes = await ctx.task(hashPathsTask, {
      projectRoot,
      label: `remediated asset tree attempt ${attempt + 1}`,
      paths: milestonePaths,
    })
    if (!shellTaskPassed(remediatedTreeHashes)) throw new Error('Remediated asset tree could not be frozen')
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      boundaryHash: frozenBoundaryHash.stdout,
      rfcHashes: frozenRfcHashes.stdout,
      ledgerHash: frozenLedgerHash.stdout,
      compatibilityHashes: frozenCompatibilityHashes.stdout,
    })
    if (!shellTaskPassed(frozenVerification)) throw new Error('Frozen asset inputs changed during remediation')
    focusedGate = await ctx.task(focusedGateTask, { projectRoot })
    const postRemediationGateTree = await ctx.task(verifyPathHashesTask, {
      projectRoot,
      label: `remediated asset tree after focused gate ${attempt + 1}`,
      paths: milestonePaths,
      expected: remediatedTreeHashes.stdout,
    })
    if (!shellTaskPassed(postRemediationGateTree)) throw new Error('Focused gate changed remediated asset artifacts')
  }

  if (!reviewPassed(review) || !shellTaskPassed(focusedGate)) {
    return { success: false, beadId, review, reason: 'Independent asset review did not reach passing score 90 after four attempts' }
  }

  const preFullGateTree = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset tree before full repository gates',
    paths: milestonePaths,
  })
  if (!shellTaskPassed(preFullGateTree)) throw new Error('Asset tree could not be frozen before full gates')
  const fullGates = await ctx.task(fullGatesTask, { projectRoot })
  if (!shellTaskPassed(fullGates)) throw new Error('Full repository gates failed; asset milestone cannot be versioned')
  const postFullGateTree = await ctx.task(verifyPathHashesTask, {
    projectRoot,
    label: 'asset tree after full repository gates',
    paths: milestonePaths,
    expected: preFullGateTree.stdout,
  })
  if (!shellTaskPassed(postFullGateTree)) throw new Error('Full repository gates changed generated artifacts')
  const prePackageTree = await ctx.task(hashPathsTask, {
    projectRoot,
    label: 'asset tree before packaged macOS smoke',
    paths: milestonePaths,
  })
  if (!shellTaskPassed(prePackageTree)) throw new Error('Asset tree could not be frozen before packaged smoke')
  const packagedMacSmoke = await ctx.task(packagedMacSmokeTask, { projectRoot })
  if (!shellTaskPassed(packagedMacSmoke)) throw new Error('Packaged macOS install smoke failed; asset milestone cannot be versioned')
  const postPackageTree = await ctx.task(verifyPathHashesTask, {
    projectRoot,
    label: 'asset tree after packaged macOS smoke',
    paths: milestonePaths,
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
  })
  if (!shellTaskPassed(committedGate)) throw new Error('Committed asset tree verification failed; Beads closure is forbidden')
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
