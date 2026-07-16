#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_FILE = path.join(ROOT, "scripts", "i18n-ui-baseline.json");

const SCAN_ROOTS = ["src/workbench", "src/ui", "src/media"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx"]);
const ALLOWED_DICTIONARIES = new Set([
  "src/i18n/translations.ts",
  "src/ui/onboarding/onboardingI18n.ts",
  "src/workbench/generationCanvas/canvasI18n.ts",
  "src/workbench/generationCanvas/nodes/scene3d/scene3dI18n.ts",
]);

const CHECKS = [
  {
    name: "visible JSX text",
    pattern: />[^<]*\p{Script=Han}[^<]*</u,
  },
  {
    name: "localized JSX attribute",
    pattern: /(?:aria-label|title|placeholder)=["'][^"']*\p{Script=Han}/u,
  },
  {
    name: "inline error, prompt, or toast",
    pattern:
      /(?:\btoast(?:\.\w+)?|\bshow\w*Toast|\bconfirm|\bprompt|\balert|\bsetLastError|\bsetError|new Error)\s*\([^\n]*\p{Script=Han}/u,
  },
];

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function shouldScan(absolute) {
  const rel = toPosix(path.relative(ROOT, absolute));
  if (!SCAN_EXTENSIONS.has(path.extname(rel))) return false;
  if (rel.includes(".test.")) return false;
  if (ALLOWED_DICTIONARIES.has(rel)) return false;
  return !rel.startsWith("src/i18n/");
}

function isCommentOnly(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("{/*")
  );
}

const files = SCAN_ROOTS.flatMap((rel) => walk(path.join(ROOT, rel))).filter(shouldScan);
const findings = [];

function findingKey(finding) {
  return `${finding.file}\0${finding.check}\0${finding.text}`;
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return new Set();
  const parsed = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("i18n UI baseline must be an array");
  return new Set(parsed.map((entry) => `${entry.file}\0${entry.check}\0${entry.text}`));
}

const baseline = readBaseline();

for (const absolute of files) {
  const rel = toPosix(path.relative(ROOT, absolute));
  const lines = fs.readFileSync(absolute, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (isCommentOnly(line)) return;
    for (const check of CHECKS) {
      if (check.pattern.test(line)) {
        findings.push({
          file: rel,
          line: index + 1,
          check: check.name,
          text: line.trim(),
        });
      }
    }
  });
}

const newFindings = findings.filter((finding) => !baseline.has(findingKey(finding)));

if (newFindings.length > 0) {
  console.error("\nI18n UI guard failed: move hardcoded Chinese interface text into dictionaries.\n");
  for (const finding of newFindings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.check})`);
    console.error(`  ${finding.text}`);
  }
  if (baseline.size > 0) {
    console.error(`\nIgnored ${findings.length - newFindings.length} baseline findings from scripts/i18n-ui-baseline.json.`);
  }
  console.error(
    "\nAllowed homes for Chinese source text: src/i18n/translations.ts and the local *I18n.ts dictionaries.\n",
  );
  process.exit(1);
}

console.log(
  `✓ i18n UI guard passed: scanned ${files.length} files, ${findings.length} baseline findings, no new hardcoded Chinese JSX labels/errors found.`,
);
