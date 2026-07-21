#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`Installed Nomi verification failed: ${message}`);
  process.exit(1);
}

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`${command} ${args.join(" ")} failed: ${detail}`);
  }
}

const appPath = path.resolve(process.argv[2] || "/Applications/Nomi.app");
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const infoPlist = path.join(appPath, "Contents", "Info.plist");
const appAsar = path.join(appPath, "Contents", "Resources", "app.asar");

if (!fs.statSync(appPath, { throwIfNoEntry: false })?.isDirectory()) fail(`${appPath} is missing`);
if (!fs.statSync(infoPlist, { throwIfNoEntry: false })?.isFile()) fail("Info.plist is missing");
if (!fs.statSync(appAsar, { throwIfNoEntry: false })?.isFile()) fail("app.asar is missing");
if (fs.statSync(appAsar).size === 0) fail("app.asar is empty");

run("codesign", ["--verify", "--deep", "--strict", appPath]);
const version = run("plutil", ["-extract", "CFBundleShortVersionString", "raw", infoPlist]);
const bundleId = run("plutil", ["-extract", "CFBundleIdentifier", "raw", infoPlist]);
const urlTypes = JSON.parse(run("plutil", ["-extract", "CFBundleURLTypes", "json", "-o", "-", infoPlist]));
const schemes = urlTypes.flatMap((entry) => Array.isArray(entry.CFBundleURLSchemes) ? entry.CFBundleURLSchemes : []);

if (version !== packageJson.version) fail(`installed version ${version} does not match package ${packageJson.version}`);
if (bundleId !== "com.nomi.app") fail(`unexpected bundle identifier ${bundleId}`);
if (!schemes.includes("nomi")) fail("nomi:// portal-auth URL scheme is not registered");

console.log(`Installed Nomi OK: ${version} · ${bundleId} · nomi:// · ${Math.round(fs.statSync(appAsar).size / 1024 / 1024)} MB app.asar`);
