#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";

const flags = new Set();
const values = new Map();
for (const arg of process.argv.slice(2)) {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  if (match) values.set(match[1], match[2]);
  else if (arg.startsWith("--")) flags.add(arg.slice(2));
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return "";
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  return result.status ?? 1;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function currentBranch() {
  return git(["branch", "--show-current"]) || "HEAD";
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const upstream = values.get("upstream") || "origin/main";
const branch = values.get("branch") || "update-integration";
const remote = upstream.includes("/") ? upstream.slice(0, upstream.indexOf("/")) : "origin";
const apply = flags.has("apply");
const continueMerge = flags.has("continue");
const verify = flags.has("verify");

if (apply && continueMerge) fail("Use either --apply or --continue, not both.");

if (run("git", ["fetch", remote, "--prune"]) !== 0) {
  fail(`Unable to fetch ${remote}.`);
}

git(["rev-parse", "--verify", upstream]);
git(["rev-parse", "--verify", branch]);

const current = currentBranch();
const upstreamHead = git(["rev-parse", "--short=12", upstream]);
const branchHead = git(["rev-parse", "--short=12", branch]);
const mergeBase = git(["merge-base", upstream, branch]);
const [behind, ahead] = git(["rev-list", "--left-right", "--count", `${upstream}...${branch}`])
  .split(/\s+/)
  .map(Number);
const dirty = git(["status", "--porcelain"]).length > 0;
const mergeInProgress = Boolean(tryGit(["rev-parse", "--verify", "MERGE_HEAD"]));

console.log(`Upstream:    ${upstream} (${upstreamHead})`);
console.log(`Branch:      ${branch} (${branchHead})`);
console.log(`Merge base:  ${mergeBase.slice(0, 12)}`);
console.log(`Divergence:  ${behind} upstream / ${ahead} corporate commits`);
console.log(`Worktree:    ${dirty ? "dirty" : "clean"}${mergeInProgress ? " · merge in progress" : ""}`);

if (!apply && !continueMerge) {
  console.log(behind === 0 ? "\nAlready current with upstream." : "\nPlan ready. No files changed.");
  if (behind > 0) {
    console.log(`Run: pnpm upstream:merge${verify ? " -- --verify" : ""}`);
  }
  process.exit(0);
}

if (current !== branch) {
  fail(`Refusing to update ${branch} while ${current} is checked out. Switch to ${branch} first.`);
}

if (continueMerge) {
  if (!mergeInProgress) fail("No upstream merge is in progress.");
  const unresolved = git(["diff", "--name-only", "--diff-filter=U"]);
  if (unresolved) {
    fail(`Resolve and stage these conflicts before continuing:\n${unresolved}`);
  }
  if (run("git", ["commit", "--no-edit"]) !== 0) process.exit(1);
  if (verify && run("pnpm", ["run", "gates"]) !== 0) process.exit(1);
  console.log("Upstream merge completed.");
  process.exit(0);
}

if (mergeInProgress) {
  fail("A merge is already in progress. Resolve it, stage the files, then run pnpm upstream:continue.");
}
if (dirty) {
  fail("Refusing to merge with a dirty worktree. Commit or stash unrelated work first.");
}
if (behind === 0) {
  console.log("Already current with upstream. Nothing to merge.");
  process.exit(0);
}

const backup = values.get("backup") || `backup/${branch.replaceAll("/", "-")}-before-${upstreamHead}-${timestamp()}`;
if (tryGit(["show-ref", "--verify", `refs/heads/${backup}`])) {
  fail(`Backup branch already exists: ${backup}`);
}
git(["branch", backup, branch]);
console.log(`Backup:      ${backup}`);

const mergeStatus = run("git", ["merge", "--no-ff", "--no-edit", upstream]);
if (mergeStatus !== 0) {
  const unresolved = tryGit(["diff", "--name-only", "--diff-filter=U"]);
  console.error("\nUpstream merge paused for conflict resolution.");
  if (unresolved) console.error(`Unresolved files:\n${unresolved}`);
  console.error("Keep upstream structure, preserve Everville contracts, regenerate generated files, then run:");
  console.error("  git add <resolved-files>");
  console.error("  pnpm upstream:continue -- --verify");
  console.error(`Recovery ref: ${backup}`);
  process.exit(mergeStatus);
}

if (verify && run("pnpm", ["run", "gates"]) !== 0) process.exit(1);
console.log(`Upstream merge complete. Recovery ref: ${backup}`);
