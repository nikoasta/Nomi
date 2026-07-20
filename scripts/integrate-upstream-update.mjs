#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = new Map(
  process.argv.slice(2).flatMap((arg) => {
    if (arg === "--apply") return [["apply", "true"]];
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [[match[1], match[2]]] : [];
  }),
);

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options }).trim();
}

function runGit(args) {
  const result = spawnSync("git", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function currentBranch() {
  return git(["branch", "--show-current"]) || "HEAD";
}

function isDirty() {
  return git(["status", "--porcelain"]).length > 0;
}

const upstream = args.get("upstream") || "origin/main";
const source = args.get("source") || currentBranch();
const target =
  args.get("target") ||
  `update-integration-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;
const apply = args.get("apply") === "true";

runGit(["fetch", "origin", "--prune"]);
runGit(["config", "rerere.enabled", "true"]);

const upstreamHead = git(["rev-parse", "--short", upstream]);
const sourceHead = git(["rev-parse", "--short", source]);
const commits = git(["rev-list", "--reverse", `${upstream}..${source}`])
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const todoPath = path.join(os.tmpdir(), "nomi-update-integration-commits.txt");
fs.writeFileSync(todoPath, `${commits.join("\n")}${commits.length ? "\n" : ""}`);

console.log(`Upstream: ${upstream} (${upstreamHead})`);
console.log(`Source:   ${source} (${sourceHead})`);
console.log(`Target:   ${target}`);
console.log(`Commits to replay: ${commits.length}`);
console.log(`Commit list: ${todoPath}`);

if (!apply) {
  console.log("");
  console.log("Dry run only. To apply:");
  console.log(
    `  node scripts/integrate-upstream-update.mjs --source=${source} --target=${target} --upstream=${upstream} --apply`,
  );
  process.exit(0);
}

if (isDirty()) {
  console.error("Refusing to apply with a dirty worktree. Commit, stash, or clean unrelated changes first.");
  process.exit(1);
}

if (commits.length === 0) {
  console.log("Nothing to replay.");
  process.exit(0);
}

runGit(["switch", "-c", target, upstream]);

for (const commit of commits) {
  const result = spawnSync("git", ["cherry-pick", "--empty=drop", commit], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error("");
    console.error(`Stopped while replaying ${commit}. Resolve conflicts, then run:`);
    console.error("  git cherry-pick --continue");
    console.error("After that, continue with the remaining commits from:");
    console.error(`  ${todoPath}`);
    process.exit(result.status ?? 1);
  }
}

console.log("Upstream integration replay complete.");
