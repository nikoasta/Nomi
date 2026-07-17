/**
 * @process everville-platform-authorization
 * @description Reversible, vendor-neutral organization authorization contracts for Nomi PlatformClient.
 * @inputs { projectRoot: string, beadId: string }
 * @outputs { success: boolean, beadId: string, review: object, commit?: string, reason?: string }
 * @process methodologies/tdd.js
 * @process specializations/qa-testing-automation/quality-gates.js
 * @process methodologies/superpowers/verification-before-completion.js
 * @skill methodologies/cc10x/skills/test-driven-development/SKILL.md
 * @agent methodologies/rpikit/agents/security-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk'

const boundaryPath = 'docs/architecture/platform-authorization-boundary.md'
const contractTestPaths = [
  'src/platform/authorization/contracts.test.ts',
  'src/platform/authorization/policy.test.ts',
  'src/platform/platformAuthorization.adapters.test.ts',
  'src/platform/platformAuthorization.boundary.test.ts',
]
const implementationPaths = [
  'src/platform/authorization/contracts.ts',
  'src/platform/authorization/policy.ts',
  'src/platform/client.ts',
  'src/platform/browserPlatformClient.ts',
  'src/platform/electronPlatformClient.ts',
]
const existingPlatformTests = [
  'src/platform/platformClient.contract.test.ts',
  'src/platform/platformClient.boundary.test.ts',
  'src/platform/platformClient.composition.test.ts',
  'src/platform/platformClient.facades.test.ts',
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

const preRedAllowedDirtyPaths = [
  '.beads/interactions.jsonl',
  boundaryPath,
  ...contractTestPaths,
  ...frozenRfcPaths,
]

const milestonePaths = [boundaryPath, ...contractTestPaths, ...implementationPaths]
const milestoneAllowedDirtyPaths = ['.beads/interactions.jsonl', ...milestonePaths, ...frozenRfcPaths]
const processDefinitionPaths = [
  '.a5c/processes/everville-platform-authorization.js',
  '.a5c/inputs/everville-platform-authorization.json',
]

function quote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function regexEscape(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const preRedAllowedPathPattern = `^(${preRedAllowedDirtyPaths.map(regexEscape).join('|')})$`
const milestoneAllowedPathPattern = `^(${milestoneAllowedDirtyPaths.map(regexEscape).join('|')})$`

function taskIo(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  }
}

const readSpecTask = defineTask('read-authorization-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read ${args.beadId} and parent specifications verbatim`,
  shell: {
    command: `cd ${quote(args.projectRoot)} && bd show ${quote(args.beadId)} && printf '\\n--- AUTHORIZATION PARENT ---\\n' && bd show evmedia-r20.9 && printf '\\n--- PLATFORM CLIENT PARENT ---\\n' && bd show evmedia-r20.2 && printf '\\n--- RFC STATE ---\\n' && bd show evmedia-r20.4`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'runtime-read', 'spec'],
}))

const preflightTask = defineTask('authorization-preflight', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace PlatformClient authorization boundary and planned path collisions',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      "printf '%s\\n' '--- EXACT PATH COLLISION CHECK ---'",
      `for file in ${[boundaryPath, ...contractTestPaths, ...implementationPaths].map(quote).join(' ')}; do if [ -e "$file" ]; then echo "EXISTS $file"; else echo "NEW $file"; fi; done`,
      "printf '%s\\n' '--- PLATFORM CLIENT LIVE BOUNDARY ---'",
      `for file in ${implementationPaths.slice(2).map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; sed -n '1,360p' "$file"; done`,
      "printf '%s\\n' '--- EXISTING PLATFORM TEST CONTRACTS ---'",
      `for file in ${existingPlatformTests.map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; sed -n '1,360p' "$file"; done`,
      "printf '%s\\n' '--- CURRENT AUTH AND POLICY REFERENCES ---'",
      "rg -n -i 'authenticat|authoriz|membership|organization|permission|role|tenant|policy' src electron --glob '*.{ts,tsx}' || true",
      "printf '%s\\n' '--- CURRENT PROVIDER AND MIGRATION COUPLING ---'",
      "rg -n '(@supabase|@vercel|firebase|clerk|auth0|SUPABASE|VERCEL|FIREBASE|CLERK|AUTH0)' package.json pnpm-lock.yaml src electron || true",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['brownfield', 'orphan-preflight', 'reuse-audit', 'runtime-call-path', 'shell'],
}))

const hashFrozenRfcTask = defineTask('freeze-authorization-rfc-hashes', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze the six unapproved RFC draft hashes',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `current=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$current" = ${quote(protectedRfcHashBaseline)}`,
      'printf "%s\\n" "$current"',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'rfc', 'shell'],
}))

const freshStartTask = defineTask('verify-authorization-fresh-start', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prove no authorization implementation or tests exist before RED',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet',
      `for file in ${processDefinitionPaths.map(quote).join(' ')}; do git ls-files --error-unmatch "$file" >/dev/null; done`,
      `git diff --quiet -- ${processDefinitionPaths.map(quote).join(' ')}`,
      `git diff --quiet -- ${implementationPaths.slice(2).map(quote).join(' ')}`,
      `for file in ${[boundaryPath, ...contractTestPaths, ...implementationPaths.slice(0, 2)].map(quote).join(' ')}; do test ! -e "$file" || { echo "Fresh-start artifact already exists: $file"; exit 1; }; done`,
      `current=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$current" = ${quote(protectedRfcHashBaseline)}`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['fresh-start', 'frozen-input', 'red-green-refactor', 'shell'],
}))

const preRedScopeTask = defineTask('verify-authorization-pre-red-scope', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prove agents changed only boundary and test paths before RED',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Agent staged changes before RED"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(preRedAllowedPathPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected pre-RED writes:\\n%s\\n" "$unexpected"; exit 1; }',
      `git diff --quiet -- ${implementationPaths.slice(2).map(quote).join(' ')}`,
      `for file in ${implementationPaths.slice(0, 2).map(quote).join(' ')}; do test ! -e "$file" || { echo "Implementation appeared before RED: $file"; exit 1; }; done`,
      `current=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$current" = ${quote(protectedRfcHashBaseline)}`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['agent-write-scope', 'frozen-input', 'red-green-refactor', 'shell'],
}))

const boundaryAnalysisTask = defineTask('analyze-authorization-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document the reversible authorization boundary',
  agent: {
    name: 'authorization-boundary-architect',
    prompt: {
      role: 'principal TypeScript platform architect and application-security engineer',
      task: `Trace the current PlatformClient runtime boundary and write only ${boundaryPath}.`,
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        preflightVerbatim: args.preflight,
      },
      instructions: [
        'Treat the Beads child specification as authoritative and all cloud topology/provider choices as unapproved.',
        'Read the live PlatformClient evidence provided in PREFLIGHT. Cite current files and line numbers; do not infer nonexistent server behavior.',
        'Define exact vendor-neutral TypeScript contracts for principal/session, active organization membership, organization/project resource scope, permissions, policy request, and stable authorization decision reason codes.',
        'Define a deterministic deny-by-default algorithm for anonymous, inactive, malformed, cross-organization, cross-project, and missing-permission cases. Cover project, asset, generation-job, review, and approval resource families.',
        'Keep organization administration permission distinct from ordinary member permissions. Do not invent billing, publishing, invitations, RLS, or cloud session refresh behavior.',
        'Define how PlatformClient exposes identity/session and authorization checks without tokens, cookies, credentials, provider errors, or privileged service concepts in browser-facing values.',
        'Define explicit local Electron continuity as a synthetic active local-only principal plus local-only organization membership and resource scope. It must never claim cloud, federated, or persisted organization identity. Define browser behavior as typed unauthenticated/unsupported until an approved remote adapter exists.',
        'Specify exact public module paths and exported names so tests can be authored without reading implementation.',
        'Document invariants, live call path, compatibility constraints, non-goals, and later parent work. Do not edit source, tests, Beads, or any of the six RFC drafts.',
      ],
      outputFormat: 'JSON with filesModified, runtimeCallPaths, contracts, invariants, nonGoals, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'runtimeCallPaths', 'contracts', 'invariants', 'nonGoals', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        runtimeCallPaths: { type: 'array', items: { type: 'string' } },
        contracts: { type: 'array', items: { type: 'string' } },
        invariants: { type: 'array', items: { type: 'string' } },
        nonGoals: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'architecture', 'brownfield', 'security'],
}))

const readBoundaryTask = defineTask('read-authorization-boundary', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read the confirmed authorization boundary verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && cat ${quote(boundaryPath)}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['runtime-boundary', 'runtime-read', 'spec'],
}))

const authorTestsTask = defineTask('author-authorization-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author authorization contracts and hostile-input tests before implementation',
  agent: {
    name: 'authorization-contract-test-author',
    prompt: {
      role: 'senior TypeScript contract and application-security test engineer',
      task: `Author exactly ${contractTestPaths.join(', ')} from the frozen specification below.`,
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
      },
      instructions: [
        'Do not read files under src/, electron/, or other implementation directories. Author tests strictly from SPEC and BOUNDARY.',
        'Import only the exact public modules and symbols named by BOUNDARY. The implementation modules intentionally do not exist yet.',
        'Use dynamic imports inside tests and convert a missing module or export into a normal failed assertion. The initial RED run must report failed tests and AssertionError output, never a suite-load, syntax, configuration, or no-tests failure.',
        'Freeze compile/runtime behavior for token-free principal/session values, active membership, resource families, permissions, decisions, and stable deny reason codes.',
        'Exercise every deny-by-default branch: anonymous, malformed identifiers or resource scope, inactive membership, organization mismatch, project mismatch, and missing permission.',
        'Exercise allowed same-organization and same-project cases for projects, assets, generation jobs, reviews, and approvals, including privileged organization administration separation.',
        'Add hostile-input assertions that unknown objects, prototype-shaped input, credential-like extra fields, thrown diagnostics, and attacker-controlled strings cannot become authorization grants or leak through typed results.',
        'Add adapter conformance for a synthetic active local-only Electron principal/membership that can authorize only local-scoped resources, plus typed browser unauthenticated or unsupported behavior. Preserve existing PlatformClient capabilities and methods.',
        'Add boundary checks forbidding cloud/auth vendor imports, production environment keys, migration files, token/cookie/password/secret fields in public authorization modules, and edits to frozen RFC paths.',
        'Use Vitest, deterministic pure fakes, no snapshots, no network, no timers, and no implementation edits.',
      ],
      outputFormat: 'JSON with filesModified, testCases, securityCases, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'testCases', 'securityCases', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        testCases: { type: 'array', items: { type: 'string' } },
        securityCases: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'contract-tests', 'security', 'test-first'],
}))

const redGateTask = defineTask('verify-authorization-tests-red', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Prove authorization tests fail before implementation',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `for file in ${contractTestPaths.map(quote).join(' ')}; do test -s "$file"; done`,
      `set +e; output=$(pnpm exec vitest run ${contractTestPaths.map(quote).join(' ')} 2>&1); code=$?; set -e; printf '%s\\n' "$output"`,
      'test "$code" -ne 0',
      `printf '%s\\n' "$output" | rg -q ${quote('Tests[[:space:]]+[1-9][0-9]* failed')}`,
      `printf '%s\\n' "$output" | rg -q ${quote('AssertionError|expected .* to')}`,
      `if printf '%s\\n' "$output" | rg -q ${quote('No test files found|Unhandled Error|SyntaxError|Failed to parse|failed to load config|Failed to resolve import')}; then echo 'RED was not an assertion-level contract failure'; exit 1; fi`,
      "echo 'RED assertion state confirmed before authorization implementation'",
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['red-green-refactor', 'shell', 'test-first'],
}))

const hashTestsTask = defineTask('freeze-authorization-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Freeze authorization contract-test checksums',
  shell: {
    command: `cd ${quote(args.projectRoot)} && shasum -a 256 ${contractTestPaths.map(quote).join(' ')}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'shell'],
}))

const readFrozenTestsTask = defineTask('read-frozen-authorization-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read frozen authorization tests and boundary verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && for file in ${[...contractTestPaths, boundaryPath].map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['frozen-input', 'runtime-read', 'tests'],
}))

const implementTask = defineTask('implement-platform-authorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement vendor-neutral PlatformClient authorization contracts',
  agent: {
    name: 'platform-authorization-implementer',
    prompt: {
      role: 'staff TypeScript platform and application-security engineer',
      task: 'Implement the frozen organization authorization boundary and integrate it into PlatformClient.',
      context: {
        projectRoot: args.projectRoot,
        specVerbatim: args.spec,
        boundaryVerbatim: args.boundary,
        frozenTestsVerbatim: args.tests,
      },
      instructions: [
        'Before editing, read every existing target file. The exact-path preflight has already reported collisions; preserve existing code where paths exist.',
        `Write only these exact implementation paths: ${implementationPaths.join(', ')}. Do not create helper files.`,
        'Do not edit frozen tests, the boundary document, Beads files, RFC drafts, migrations, package manifests, or lockfiles.',
        'Implement a pure deterministic deny-by-default policy with exhaustive typed results and stable public reason codes. Never authorize by string truthiness, unknown role names, optional chaining fallthrough, or fail-open exception handling.',
        'Do not place tokens, cookies, passwords, secret keys, provider diagnostics, raw errors, or privileged service roles in public contracts or returned values.',
        'Integrate identity/session and authorization services into PlatformClient without changing existing conversation/asset behavior or capability results.',
        'Electron local continuity must use the synthetic active local-only principal and membership defined by BOUNDARY, authorize only local-scoped resources, and never claim cloud, federated, or persisted organization identity. Browser behavior must remain import-safe without window or nomiDesktop and must not fabricate a signed-in user.',
        'Do not add cloud/auth SDKs, environment-variable dependencies, migrations, RLS, network calls, persistence, UI, or topology assumptions.',
        'Run focused tests while working. Never weaken or rewrite frozen tests to fit the implementation.',
      ],
      outputFormat: 'JSON with filesModified, policyInvariants, compatibilityEvidence, testResults, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'policyInvariants', 'compatibilityEvidence', 'testResults', 'summary'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        policyInvariants: { type: 'array', items: { type: 'string' } },
        compatibilityEvidence: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'authorization', 'implementation', 'security'],
}))

const verifyFrozenTask = defineTask('verify-authorization-frozen-inputs', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify tests and unapproved RFC drafts remain frozen',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `currentTests=$(shasum -a 256 ${contractTestPaths.map(quote).join(' ')})`,
      `test "$currentTests" = ${quote(args.testHashes.trim())}`,
      `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$currentRfcs" = ${quote(args.rfcHashes.trim())}`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['evidence', 'frozen-input', 'rfc', 'shell'],
}))

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

const focusedGateTask = defineTask('run-authorization-focused-gates', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run authorization security and compatibility gates',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `pnpm exec vitest run ${[...contractTestPaths, ...existingPlatformTests].map(quote).join(' ')}`,
      'pnpm run typecheck',
      `pnpm exec eslint ${[...implementationPaths, ...contractTestPaths].map(quote).join(' ')}`,
      'git diff --cached --quiet || { echo "Unexpected staged changes before review"; exit 1; }',
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(milestoneAllowedPathPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected milestone writes:\\n%s\\n" "$unexpected"; exit 1; }',
      'git diff --quiet -- package.json pnpm-lock.yaml',
      `if rg -n -i "(@supabase|@vercel|firebase|clerk|auth0|cognito|okta|workos|keycloak|ory|supabase|vercel|firebase|clerk|auth0|cognito|okta|workos|keycloak|ory)" ${implementationPaths.map(quote).join(' ')}; then echo 'Unapproved cloud/auth vendor coupling found'; exit 1; fi`,
      `if rg -n -i "(access[_-]?token|refresh[_-]?token|id[_-]?token|session[_-]?token|bearer[_-]?token|api[_-]?key|password|cookie|credential|client[_-]?secret|service[_-]?role|private[_-]?key|jwt|secret)" ${implementationPaths.map(quote).join(' ')}; then echo 'Credential-bearing public authorization contract found'; exit 1; fi`,
      `if rg -n -i "(create[[:space:]]+policy|enable[[:space:]]+row[[:space:]]+level[[:space:]]+security|row[_-]?level[_-]?security|migration|rls[[:space:]]+policy)" ${implementationPaths.map(quote).join(' ')}; then echo 'Inline migration or RLS implementation found'; exit 1; fi`,
      `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
      `for file in ${implementationPaths.map(quote).join(' ')}; do lines=$(wc -l < "$file"); test "$lines" -le 800 || { echo "$file exceeds 800 lines"; exit 1; }; done`,
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['authorization', 'contract-tests', 'gate', 'security', 'shell', 'typecheck'],
}))

const readReviewEvidenceTask = defineTask('read-authorization-review-evidence', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read authorization artifacts and diff verbatim',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      "printf '\\n--- RED EVIDENCE ---\\n'",
      `printf '%s\\n' ${quote(args.redEvidence)}`,
      "printf '\\n--- FROZEN TEST HASHES ---\\n'",
      `printf '%s\\n' ${quote(args.testHashes)}`,
      "printf '\\n--- TRUSTED RFC HASH BASELINE ---\\n'",
      `printf '%s\\n' ${quote(protectedRfcHashBaseline)}`,
      "printf '\\n--- FROZEN INPUT VERIFICATION ---\\n'",
      `printf '%s\\n' ${quote(args.frozenEvidence)}`,
      "printf '\\n--- FOCUSED GATE EVIDENCE ---\\n'",
      `printf '%s\\n' ${quote(args.focusedGateEvidence)}`,
      `for file in ${[boundaryPath, ...contractTestPaths, ...implementationPaths].map(quote).join(' ')}; do printf '\\n--- %s ---\\n' "$file"; cat "$file"; done`,
      "printf '\\n--- AUTHORIZATION DIFF ---\\n'",
      `git diff -- ${[boundaryPath, ...contractTestPaths, ...implementationPaths].map(quote).join(' ')}`,
      "printf '\\n--- CACHED DIFF (MUST BE EMPTY) ---\\n'",
      'git diff --cached',
      "printf '\\n--- STATUS ---\\n'",
      'git status --short',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['artifacts', 'review', 'runtime-read', 'shell'],
}))

const reviewTask = defineTask('review-platform-authorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Independently security-review authorization against the frozen spec',
  agent: {
    name: 'independent-authorization-security-reviewer',
    prompt: {
      role: 'independent principal application-security reviewer and TypeScript maintainer',
      task: 'Review the authorization milestone requirement by requirement. Do not edit files.',
      context: {
        artifactsVerbatim: args.artifacts,
        specVerbatim: args.spec,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Fail if ARTIFACTS does not contain the assertion-level RED marker, exact frozen test hashes, the trusted RFC hash baseline, successful frozen-input verification, and a focused gate with exitCode 0.',
        'Fail on fail-open logic, role or permission confusion, cross-organization/project access, anonymous grants, inactive membership grants, malformed-input grants, unstable denial semantics, credential-bearing contracts, raw diagnostic leakage, browser fabricated identity, or Electron claims of cloud authentication.',
        'Fail on existing PlatformClient behavior drift, tests changed after RED, vendor coupling, hidden migration/RLS/topology choices, RFC edits, files over 800 lines, or acceptance claims unsupported by tests.',
        'Distinguish child blockers from parent work intentionally still pending: real sign-in, membership persistence, invitations, database/RLS, server enforcement, audit logs, and cloud adapters.',
        'Return exact file and line references for every blocker and score 0-100.',
      ],
      outputFormat: 'JSON with passed, score, blockers, risks, summary',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score', 'blockers', 'risks', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        blockers: {
          type: 'array',
          items: { type: 'string', pattern: '^.+:[0-9]+\\s+-\\s+.+$' },
        },
        risks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'independent-review', 'quality-gate', 'security'],
}))

const remediateTask = defineTask('remediate-platform-authorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate independent authorization-review blockers',
  agent: {
    name: 'platform-authorization-remediator',
    prompt: {
      role: 'staff TypeScript application-security maintainer',
      task: 'Fix every verified review blocker without changing scope or frozen evidence.',
      context: {
        projectRoot: args.projectRoot,
        reviewVerbatim: args.review,
        artifactsVerbatim: args.artifacts,
        specVerbatim: args.spec,
      },
      instructions: [
        'Compare SPEC to ARTIFACTS directly before editing and verify each reported blocker against current code.',
        'Do not edit frozen tests, the boundary document, Beads, RFC drafts, package files, migrations, or lockfiles.',
        `Change only these exact implementation paths: ${implementationPaths.join(', ')}. Do not create helper files.`,
        'Preserve deny-by-default behavior, existing PlatformClient compatibility, browser safety, and explicit local-only Electron semantics.',
        'Do not add cloud/auth vendor coupling or broaden the milestone.',
        'Run focused tests and report each verified blocker, fix, file changed, and test result.',
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

const fullGatesTask = defineTask('run-authorization-full-gates', (args, taskCtx) => ({
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

const versionTask = defineTask('version-platform-authorization', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit the reviewed reversible authorization milestone',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'git diff --cached --quiet || { echo "Refusing to mix pre-staged changes into authorization commit"; exit 1; }',
      `git add ${milestonePaths.map(quote).join(' ')}`,
      `expected=$(printf '%s\\n' ${milestonePaths.map(quote).join(' ')} | sort)`,
      'actual=$(git diff --cached --name-only | sort)',
      'test "$actual" = "$expected" || { printf "Unexpected staged paths:\\n%s\\n" "$actual"; exit 1; }',
      'git diff --cached --check',
      "if git diff --cached --quiet; then echo 'No authorization changes to commit'; exit 1; fi",
      "git commit -m 'feat: add organization authorization contracts'",
      'sha=$(git rev-parse HEAD)',
      'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
      'test "$committed" = "$expected" || { printf "Unexpected committed paths:\\n%s\\n" "$committed"; exit 1; }',
      'printf "%s\\n" "$sha"',
    ].join(' && '),
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['commit', 'evidence', 'git', 'shell'],
}))

const postCommitGateTask = defineTask('verify-platform-authorization-commit', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify the committed authorization tree before Beads closure',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `expected=$(printf '%s\\n' ${milestonePaths.map(quote).join(' ')} | sort)`,
      'sha=$(git rev-parse HEAD)',
      'committed=$(git show --format= --name-only "$sha" | sed "/^$/d" | sort)',
      'test "$committed" = "$expected"',
      `git diff --quiet HEAD -- ${milestonePaths.map(quote).join(' ')}`,
      `pnpm exec vitest run ${[...contractTestPaths, ...existingPlatformTests].map(quote).join(' ')}`,
      'pnpm run typecheck',
      `pnpm exec eslint ${[...implementationPaths, ...contractTestPaths].map(quote).join(' ')}`,
      `currentRfcs=$(shasum -a 256 ${frozenRfcPaths.map(quote).join(' ')})`,
      `test "$currentRfcs" = ${quote(protectedRfcHashBaseline)}`,
      `dirty=$({ git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)`,
      `unexpected=$(printf '%s\\n' "$dirty" | rg -v ${quote(milestoneAllowedPathPattern)} || true)`,
      'test -z "$unexpected" || { printf "Unexpected post-commit writes:\\n%s\\n" "$unexpected"; exit 1; }',
      'printf "%s\\n" "$sha"',
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 600000,
  },
  io: taskIo(taskCtx),
  labels: ['committed-tree', 'evidence', 'gate', 'security', 'shell'],
}))

const closeBeadTask = defineTask('close-platform-authorization-slice', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record reversible authorization milestone evidence in Beads',
  shell: {
    command: `cd ${quote(args.projectRoot)} && sha=$(git rev-parse HEAD) && bd update ${quote(args.beadId)} --append-notes "Vendor-neutral authorization contracts passed frozen contract/security tests, existing PlatformClient compatibility tests, full repository gates, and independent review score ${args.score}. Versioned at local commit $sha. evmedia-r20.9 and evmedia-r20.4 remain open for real authentication, membership persistence, server enforcement, RLS, and cloud adapter approval." --status closed && bd show ${quote(args.beadId)}`,
    expectedExitCode: 0,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'evidence', 'milestone', 'shell'],
}))

export async function process(inputs, ctx) {
  const projectRoot = inputs.projectRoot
  const beadId = inputs.beadId || 'evmedia-r20.9.1'

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId })
  const frozenRfcHashes = await ctx.task(hashFrozenRfcTask, { projectRoot })
  await ctx.task(freshStartTask, { projectRoot })
  const preflight = await ctx.task(preflightTask, { projectRoot })
  await ctx.task(boundaryAnalysisTask, {
    projectRoot,
    spec: spec.stdout,
    preflight: preflight.stdout,
  })
  await ctx.task(preRedScopeTask, { projectRoot })
  const boundary = await ctx.task(readBoundaryTask, { projectRoot })
  await ctx.task(authorTestsTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
  })
  await ctx.task(preRedScopeTask, { projectRoot })
  const redEvidence = await ctx.task(redGateTask, { projectRoot })
  const frozenTestHashes = await ctx.task(hashTestsTask, { projectRoot })
  const frozenTests = await ctx.task(readFrozenTestsTask, { projectRoot })
  await ctx.task(implementTask, {
    projectRoot,
    spec: spec.stdout,
    boundary: boundary.stdout,
    tests: frozenTests.stdout,
  })

  let frozenVerification = await ctx.task(verifyFrozenTask, {
    projectRoot,
    testHashes: frozenTestHashes.stdout,
    rfcHashes: frozenRfcHashes.stdout,
  })
  let focusedGate = await ctx.task(focusedGateTask, { projectRoot })
  if (!shellTaskPassed(focusedGate)) {
    throw new Error('Focused authorization gate failed; independent review is not permitted')
  }

  let review = null
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const artifacts = await ctx.task(readReviewEvidenceTask, {
      projectRoot,
      redEvidence: JSON.stringify(redEvidence),
      testHashes: frozenTestHashes.stdout,
      frozenEvidence: JSON.stringify(frozenVerification),
      focusedGateEvidence: JSON.stringify(focusedGate),
    })
    review = await ctx.task(reviewTask, {
      spec: spec.stdout,
      artifacts: artifacts.stdout,
    })
    if (reviewPassed(review)) break
    if (!reviewHasActionableBlockers(review)) {
      throw new Error('Independent authorization review was contradictory or lacked file:line blockers')
    }
    if (attempt === 3) break
    await ctx.task(remediateTask, {
      projectRoot,
      review: JSON.stringify(review),
      artifacts: artifacts.stdout,
      spec: spec.stdout,
    })
    frozenVerification = await ctx.task(verifyFrozenTask, {
      projectRoot,
      testHashes: frozenTestHashes.stdout,
      rfcHashes: frozenRfcHashes.stdout,
    })
    focusedGate = await ctx.task(focusedGateTask, { projectRoot })
    if (!shellTaskPassed(focusedGate)) {
      throw new Error('Focused authorization gate failed after remediation; review is not permitted')
    }
  }

  if (!reviewPassed(review)) {
    return {
      success: false,
      beadId,
      review,
      reason: 'Independent authorization review did not reach passing score 90 after four attempts',
    }
  }

  const fullGates = await ctx.task(fullGatesTask, { projectRoot })
  if (!shellTaskPassed(fullGates)) {
    throw new Error('Full repository gates failed; authorization milestone cannot be versioned')
  }
  const version = await ctx.task(versionTask, { projectRoot })
  const committedGate = await ctx.task(postCommitGateTask, { projectRoot })
  if (!shellTaskPassed(committedGate)) {
    throw new Error('Committed authorization tree verification failed; Beads closure is forbidden')
  }
  await ctx.task(closeBeadTask, { projectRoot, beadId, score: review.score })

  return {
    success: true,
    beadId,
    review,
    commit: version.stdout.trim().split('\n').at(-1),
    parentStillPending: ['evmedia-r20.9', 'evmedia-r20.4'],
  }
}
