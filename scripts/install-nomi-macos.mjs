#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", stdio: "inherit", ...options });
}

function plistValue(appPath, key) {
  return execFileSync("plutil", ["-extract", key, "raw", path.join(appPath, "Contents", "Info.plist")], {
    encoding: "utf8",
  }).trim();
}

const source = path.resolve(process.argv[2] || "release/mac-arm64/Nomi.app");
const installed = "/Applications/Nomi.app";
if (!fs.statSync(source, { throwIfNoEntry: false })?.isDirectory()) {
  throw new Error(`Packaged app is missing: ${source}`);
}

run("codesign", ["--verify", "--deep", "--strict", source]);
const expectedVersion = plistValue(source, "CFBundleShortVersionString");
const expectedBundleId = plistValue(source, "CFBundleIdentifier");
if (expectedBundleId !== "com.nomi.app") throw new Error(`Unexpected bundle identifier: ${expectedBundleId}`);

try {
  run("osascript", ["-e", 'tell application "Nomi" to quit'], { stdio: "ignore" });
} catch {
  // The app may not be running.
}

const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nomi-install-"));
const backup = path.join(backupRoot, "Nomi.app");
const hadInstalledApp = fs.statSync(installed, { throwIfNoEntry: false })?.isDirectory() ?? false;

try {
  if (hadInstalledApp) fs.renameSync(installed, backup);
  run("ditto", [source, installed]);
  run("codesign", ["--verify", "--deep", "--strict", installed]);
  if (plistValue(installed, "CFBundleShortVersionString") !== expectedVersion) {
    throw new Error("Installed version does not match the packaged version");
  }
  if (plistValue(installed, "CFBundleIdentifier") !== expectedBundleId) {
    throw new Error("Installed bundle identifier does not match the packaged app");
  }
} catch (error) {
  fs.rmSync(installed, { recursive: true, force: true });
  if (fs.statSync(backup, { throwIfNoEntry: false })) fs.renameSync(backup, installed);
  throw error;
} finally {
  fs.rmSync(backupRoot, { recursive: true, force: true });
}

run("open", ["-a", installed]);
console.log(`Installed Nomi ${expectedVersion} at ${installed}`);
