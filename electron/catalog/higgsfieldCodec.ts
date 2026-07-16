import type { JsonRecord } from "../jsonUtils";

export type HiggsfieldNormalizedOutput = {
  submitId: string;
  genStatus: string;
  failReason: string;
  queueInfo: unknown;
  remoteUrls: string[];
};

const URL_RE = /https?:\/\/[^\s"'<>),\]]+/gi;
const MEDIA_EXT_RE = /\.(png|jpe?g|webp|gif|mp4|mov|webm|m4v|glb|gltf|obj|fbx|usdz|wav|mp3|m4a|ogg|flac)(\?|#|$)/i;
const REPORT_URL_RE = /\/apps\/virality-predictor\?/i;

const STATUS_KEYS = ["status", "state", "gen_status", "task_status", "job_status"];
const ID_KEYS = ["id", "job_id", "jobId", "uuid", "task_id", "taskId", "resultJobId"];
const ERROR_KEYS = ["error", "message", "fail_reason", "failure_reason", "reason"];

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function parseJsonMaybe(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // CLI output can include progress lines before/after JSON. Keep this narrow:
    // first complete array/object span, then fall back to URL regex extraction.
  }
  const firstArray = trimmed.indexOf("[");
  const lastArray = trimmed.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) {
    try {
      return JSON.parse(trimmed.slice(firstArray, lastArray + 1));
    } catch {
      /* continue */
    }
  }
  const firstObj = trimmed.indexOf("{");
  const lastObj = trimmed.lastIndexOf("}");
  if (firstObj >= 0 && lastObj > firstObj) {
    try {
      return JSON.parse(trimmed.slice(firstObj, lastObj + 1));
    } catch {
      /* continue */
    }
  }
  return null;
}

function firstStringFromKeys(value: unknown, keys: string[]): string {
  const record = asRecord(value);
  if (!record) return "";
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  }
  return "";
}

function walk(value: unknown, visit: (value: unknown, key: string) => void, key = ""): void {
  visit(value, key);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit, key);
    return;
  }
  const record = asRecord(value);
  if (!record) return;
  for (const [childKey, childValue] of Object.entries(record)) {
    walk(childValue, visit, childKey);
  }
}

function collectUrls(parsed: unknown, text: string): string[] {
  const urls: string[] = [];
  walk(parsed, (value, key) => {
    if (typeof value !== "string") return;
    const s = value.trim();
    if (!/^https?:\/\//i.test(s)) return;
    const keyLower = key.toLowerCase();
    if (MEDIA_EXT_RE.test(s) || REPORT_URL_RE.test(s) || /url|asset|output|download/.test(keyLower)) {
      urls.push(s);
    }
  });
  for (const match of text.matchAll(URL_RE)) {
    const url = match[0].replace(/[.,;:]+$/g, "");
    if (MEDIA_EXT_RE.test(url) || REPORT_URL_RE.test(url)) urls.push(url);
  }
  return Array.from(new Set(urls));
}

function collectFirst(value: unknown, keys: string[]): string {
  let found = "";
  walk(value, (candidate) => {
    if (found) return;
    found = firstStringFromKeys(candidate, keys);
  });
  return found;
}

function normalizeStatus(raw: string, hasUrl: boolean, exitCode: number): string {
  const s = raw.trim().toLowerCase();
  if (hasUrl && (!s || ["done", "finished", "complete"].includes(s))) return "completed";
  if (["success", "succeeded", "completed", "complete", "done", "finished"].includes(s)) return "completed";
  if (["failed", "fail", "error", "cancelled", "canceled"].includes(s)) return "failed";
  if (["running", "processing", "generating", "queued", "pending", "created"].includes(s)) return s;
  if (hasUrl) return "completed";
  return exitCode === 0 ? s : "failed";
}

export function normalizeHiggsfieldOutput(stdout: string, stderr: string, exitCode = 0): HiggsfieldNormalizedOutput {
  const combined = [stdout, stderr].filter(Boolean).join("\n");
  const parsed = parseJsonMaybe(stdout) ?? parseJsonMaybe(combined);
  const remoteUrls = collectUrls(parsed, combined);
  const submitId = collectFirst(parsed, ID_KEYS) || "";
  const rawStatus = collectFirst(parsed, STATUS_KEYS);
  const failReason = collectFirst(parsed, ERROR_KEYS) || (exitCode === 0 ? "" : combined.trim().slice(-800));
  return {
    submitId,
    genStatus: normalizeStatus(rawStatus, remoteUrls.length > 0, exitCode),
    failReason,
    queueInfo: asRecord(parsed)?.queue_info ?? null,
    remoteUrls,
  };
}

export function describeHiggsfieldFailure(code: number, stdout: string, stderr: string): string {
  const text = [stderr, stdout].filter(Boolean).join("\n").trim();
  if (/session expired|not authenticated|auth|login/i.test(text)) {
    return "Higgsfield CLI needs sign-in. Open Model setup and sign in to Higgsfield again.";
  }
  if (/unknown params?|invalid values?|missing required params?/i.test(text)) {
    return text.slice(-1000);
  }
  if (/credit|balance|quota|payment/i.test(text)) {
    return text.slice(-1000) || "Higgsfield rejected the job because credits or quota are unavailable.";
  }
  return text.slice(-1000) || `Higgsfield CLI failed with exit code ${code}.`;
}

