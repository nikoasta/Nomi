/**
 * @process nomi-upstream-sync
 * @description Integrate public Nomi updates into the Everville desktop/web product branch and release both surfaces.
 * @inputs { projectRoot: string, beadId: string, branch: string, upstream: string }
 * @outputs { success: boolean, beadId: string, commit: string, deploymentUrl: string }
 * @process methodologies/spec-kit-brownfield.js
 * @process methodologies/superpowers/verification-before-completion.js
 * @skill methodologies/cc10x/skills/systematic-debugging/SKILL.md
 * @agent methodologies/rpikit/agents/code-reviewer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk'

function quote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

function taskIo(taskCtx) {
  return {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  }
}

function shellPassed(result) {
  return result?.exitCode === 0
}

function lastOutputToken(result) {
  const output = typeof result?.stdout === 'string' ? result.stdout.trim() : ''
  return output ? output.split(/\s+/).at(-1) || '' : ''
}

const readSpecTask = defineTask('read-nomi-upstream-sync-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read the Beads acceptance contract verbatim',
  shell: {
    command: `cd ${quote(args.projectRoot)} && bd show ${quote(args.beadId)} --json`,
    expectedExitCode: 0,
    timeoutMs: 30000,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'spec', 'shell'],
}))

const preflightTask = defineTask('preflight-nomi-upstream-sync', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Fetch upstream and validate the integration starting point',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'test -z "$(git status --porcelain)"',
      `test "$(git branch --show-current)" = ${quote(args.branch)}`,
      'git fetch origin --prune',
      `git rev-parse --verify ${quote(args.upstream)}`,
      `git rev-list --left-right --count ${quote(`${args.upstream}...${args.branch}`)}`,
      `git merge-base ${quote(args.upstream)} ${quote(args.branch)}`,
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 180000,
  },
  io: taskIo(taskCtx),
  labels: ['git', 'preflight', 'shell', 'upstream'],
}))

const integrateTask = defineTask('integrate-nomi-upstream-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate upstream while preserving Everville product contracts',
  agent: {
    name: 'brownfield-integration-engineer',
    prompt: [
      'SPEC (verbatim, do not paraphrase):',
      '---',
      args.spec,
      '---',
      'PREFLIGHT (verbatim):',
      '---',
      args.preflight,
      '---',
      `Work in ${args.projectRoot} on ${args.branch}.`,
      `Integrate ${args.upstream} using a merge commit and a recoverable backup ref.`,
      'Resolve every conflict by preserving upstream behavior plus Everville i18n, portal/auth, shared desktop/web projects, model integrations, and package identity.',
      'Update the existing upstream integration script and architecture runbook so future updates use the same no-force merge workflow.',
      'Do not alter git configuration, expose secrets, rewrite provider IDs, or use destructive git commands.',
      'Run focused checks for changed integration surfaces and return the exact changed files and evidence.',
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['integrated', 'filesChanged', 'focusedChecks', 'summary'],
      properties: {
        integrated: { type: 'boolean' },
        filesChanged: { type: 'array', items: { type: 'string' } },
        focusedChecks: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'brownfield', 'integration', 'upstream'],
}))

const fullGateTask = defineTask('verify-nomi-upstream-sync', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run Nomi process verification and complete code gates',
  shell: {
    command: `cd ${quote(args.projectRoot)} && scripts/orchestration/run_process_verification.sh && pnpm run gates && git diff --check`,
    expectedExitCode: 0,
    timeoutMs: 1800000,
  },
  io: taskIo(taskCtx),
  labels: ['build', 'gates', 'i18n', 'shell', 'tests'],
}))

const packageTask = defineTask('package-nomi-upstream-sync-macos', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Build and install the synchronized macOS app',
  shell: {
    command: `cd ${quote(args.projectRoot)} && pnpm run dist:mac:dir && pnpm run install:mac:local && pnpm run verify:installed`,
    expectedExitCode: 0,
    timeoutMs: 1800000,
  },
  io: taskIo(taskCtx),
  labels: ['desktop', 'electron', 'macos', 'package', 'shell'],
}))

const reviewTask = defineTask('review-nomi-upstream-sync', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review the integrated tree against the frozen acceptance contract',
  agent: {
    name: 'release-integration-reviewer',
    prompt: [
      'SPEC (verbatim):',
      '---',
      args.spec,
      '---',
      'ARTIFACTS (verbatim):',
      '---',
      args.artifacts,
      '---',
      'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      'Inspect the current git diff and merge ancestry. Report only concrete blockers with file and line references.',
    ].join('\n'),
    outputSchema: {
      type: 'object',
      required: ['passed', 'blockers', 'summary'],
      properties: {
        passed: { type: 'boolean' },
        blockers: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
      },
    },
  },
  io: taskIo(taskCtx),
  labels: ['agent', 'release', 'review'],
}))

const versionTask = defineTask('version-nomi-upstream-sync', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit and push the verified integration without rewriting history',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'git add scripts/integrate-upstream-update.mjs scripts/install-nomi-macos.mjs scripts/verify-installed-nomi.mjs scripts/check-file-sizes.mjs src/workbench/generationCanvas/nodes/scene3d/Scene3DFullscreen.tsx docs/architecture/upstream-update-integration.md package.json .a5c/processes/nomi-upstream-sync.js .a5c/processes/nomi-upstream-sync.inputs.json',
      'git diff --cached --check',
      `if ! git diff --cached --quiet; then git commit -m ${quote('Finish synchronized Nomi release workflow')}; fi`,
      'test -z "$(git status --porcelain)"',
      `git push nikoasta ${quote(args.branch)}`,
      'git rev-parse HEAD',
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 300000,
  },
  io: taskIo(taskCtx),
  labels: ['commit', 'git', 'push', 'shell'],
}))

const deployTask = defineTask('deploy-nomi-upstream-sync-web', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Deploy and smoke the synchronized web portal',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      'deployment_url="$(npx vercel@latest deploy --prod --yes | tail -1)"',
      'test -n "$deployment_url"',
      'curl --fail --silent --show-error --location --max-time 30 https://cut.eva.mba/ >/dev/null',
      "auth_location=\"$(curl --silent --show-error --dump-header - --output /dev/null --max-time 30 'https://cut.eva.mba/api/portal/auth/confirm?token_hash=invalid-upstream-sync-smoke&type=magiclink&redirectTo=nomi%3A%2F%2Fportal-auth' | tr -d '\\r' | awk 'tolower($1)==\"location:\" {print $2}')\"",
      'case "$auth_location" in nomi://portal-auth*) true ;; *) echo "Unexpected desktop auth redirect: $auth_location"; exit 1 ;; esac',
      'printf "%s\\n" "$deployment_url"',
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 900000,
  },
  io: taskIo(taskCtx),
  labels: ['deploy', 'shell', 'smoke', 'vercel', 'web'],
}))

const closeTask = defineTask('close-nomi-upstream-sync', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Record evidence and close the Beads integration task',
  shell: {
    command: [
      `cd ${quote(args.projectRoot)}`,
      `bd note ${quote(args.beadId)} ${quote(`Integrated ${args.upstream}; full gates, macOS package/install, push, production deploy, and live auth redirect smoke passed.`)}`,
      `bd close ${quote(args.beadId)} --reason ${quote('Upstream integration and repeatable update system verified on desktop and web.')}`,
    ].join(' && '),
    expectedExitCode: 0,
    timeoutMs: 120000,
  },
  io: taskIo(taskCtx),
  labels: ['beads', 'closeout', 'shell'],
}))

export async function process(inputs, ctx) {
  const projectRoot = String(inputs.projectRoot || '')
  const beadId = String(inputs.beadId || '')
  const branch = String(inputs.branch || 'update-integration')
  const upstream = String(inputs.upstream || 'origin/main')

  const spec = await ctx.task(readSpecTask, { projectRoot, beadId })
  if (!shellPassed(spec)) throw new Error('Could not read the upstream integration acceptance contract')

  const preflight = await ctx.task(preflightTask, { projectRoot, branch, upstream })
  if (!shellPassed(preflight)) throw new Error('Upstream integration preflight failed')

  const integration = await ctx.task(integrateTask, {
    projectRoot,
    branch,
    upstream,
    spec: spec.stdout,
    preflight: preflight.stdout,
  })
  if (integration?.integrated !== true) throw new Error('Upstream integration was not completed')

  const gates = await ctx.task(fullGateTask, { projectRoot })
  if (!shellPassed(gates)) throw new Error('Full repository gates failed')

  const packaged = await ctx.task(packageTask, { projectRoot })
  if (!shellPassed(packaged)) throw new Error('macOS package/install verification failed')

  const versioned = await ctx.task(versionTask, { projectRoot, branch })
  if (!shellPassed(versioned)) throw new Error('Commit or push failed')

  const deployed = await ctx.task(deployTask, { projectRoot })
  if (!shellPassed(deployed)) throw new Error('Production deploy or live smoke failed')

  const review = await ctx.task(reviewTask, {
    projectRoot,
    spec: spec.stdout,
    artifacts: [JSON.stringify(integration), gates.stdout, packaged.stdout, versioned.stdout, deployed.stdout].join('\n'),
  })
  if (review?.passed !== true || review.blockers?.length) throw new Error('Release integration review found blockers')

  const closed = await ctx.task(closeTask, { projectRoot, beadId, upstream })
  if (!shellPassed(closed)) throw new Error('Beads closeout failed')

  return {
    success: true,
    beadId,
    commit: lastOutputToken(versioned),
    deploymentUrl: lastOutputToken(deployed),
  }
}
