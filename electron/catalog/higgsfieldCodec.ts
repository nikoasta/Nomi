import type { JsonRecord } from "../jsonUtils";
import type {
  HiggsfieldOperationId,
  JsonSchema,
  ProviderCapabilityManifest,
  ProviderOperationManifest,
} from "./higgsfieldProviderManifest";

export type ProviderErrorCode =
  | "unsupported"
  | "policy_denied"
  | "invalid_input"
  | "not_installed"
  | "not_authenticated"
  | "cancelled"
  | "timed_out"
  | "output_limit_exceeded"
  | "provider_rejected"
  | "ambiguous_submission"
  | "unavailable"
  | "internal";
export type ProviderInvokeRequest = {
  requestId: string;
  manifestVersion: string;
  operationId: HiggsfieldOperationId;
  input: unknown;
  idempotencyKey?: string;
  policyContext: { projectId?: string; claimIds: readonly string[]; spendGrantId?: string };
};
export type ProviderInvokeOptions = { signal?: AbortSignal };
export type ProviderResultMeta = {
  providerId: "higgsfield-cli";
  manifestVersion: string;
  operationId: HiggsfieldOperationId;
  requestId: string;
  idempotencyKeyHash?: string;
  remoteJobId?: string;
  remoteState: "not_started" | "accepted" | "terminal" | "unknown";
  cancellation: "not_requested" | "before_start" | "local_wait_stopped";
};
export type ProviderResult<T> =
  | { ok: true; value: T; meta: ProviderResultMeta }
  | {
      ok: false;
      error: { code: ProviderErrorCode; message: string; retryable: boolean };
      meta: ProviderResultMeta;
    };
export type GenerationProviderExtension = {
  describe(): Promise<ProviderResult<ProviderCapabilityManifest>>;
  invoke(request: ProviderInvokeRequest, options?: ProviderInvokeOptions): Promise<ProviderResult<unknown>>;
};

export type OutputLimits = {
  stdoutBytes: number;
  stderrBytes: number;
  combinedBytes: number;
  jsonDepth: number;
  arrayItems: number;
  stringBytes: number;
  artifactCount: number;
};

export type SafeProcessEnvironment = Readonly<Record<string, string>>;

export type BoundedCliResult =
  | { kind: "success"; exitCode: number; stdout: string; stderr: string }
  | { kind: "failure"; exitCode?: number; stdout?: string; stderr?: string; error?: unknown }
  | { kind: "not_installed" }
  | { kind: "not_authenticated" }
  | { kind: "timed_out" }
  | { kind: "output_limit_exceeded"; limit?: string }
  | {
      kind: "cancelled";
      remoteJobId?: string;
      remoteState?: "not_started" | "accepted" | "unknown";
      cancellation?: "before_start" | "local_wait_stopped";
    }
  | { kind: "ambiguous_submission"; remoteJobId?: string; remoteState?: "accepted" | "unknown" }
  | { kind: "unavailable" };

export type HiggsfieldCliExecutor = {
  execute(input: {
    argv: readonly string[];
    timeoutMs: number;
    signal?: AbortSignal;
    limits: OutputLimits;
    env: SafeProcessEnvironment;
  }): Promise<BoundedCliResult>;
};

export const HIGGSFIELD_OUTPUT_LIMITS: OutputLimits = Object.freeze({
  stdoutBytes: 1_048_576,
  stderrBytes: 262_144,
  combinedBytes: 1_310_720,
  jsonDepth: 32,
  arrayItems: 10_000,
  stringBytes: 65_536,
  artifactCount: 100,
});

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
  const failReason = exitCode === 0 ? "" : describeHiggsfieldFailure(exitCode, stdout, stderr);
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
    return "Higgsfield rejected one or more generation parameters.";
  }
  if (/credit|balance|quota|payment/i.test(text)) {
    return "Higgsfield rejected the job because credits or quota are unavailable.";
  }
  return code === 0 ? "Higgsfield CLI returned an unusable response." : "Higgsfield CLI rejected the operation.";
}

const UNSAFE_OUTPUT_STRING_RE = /(?:\bBearer\s+|\bCookie\s*:|\bsession=|\b(?:api[_-]?key|authorization|password|credential|access[_-]?token)\b|\bError:\s|[A-Z]:\\Users\\|\/(?:Users|home|private\/tmp|tmp)\/|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:^|\n)\s*at\s+|hf_(?:live|test)_[A-Za-z0-9_-]{8,})/i;
const WINDOWS_ABSOLUTE_PATH_RE = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/[^/])/;
const RELATIVE_LOCAL_PATH_RE = /^(?:(?:\.{1,2}|~)[\\/]|[^\s?#]+[\\/][^\s?#]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|m4v|glb|gltf|obj|fbx|usdz|wav|mp3|m4a|ogg|flac|json|zip)$)|(?:^|[\\/])\.\.(?:[\\/]|$)/i;
const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/;
const TERMINAL_STATUSES = new Set(["completed", "success", "succeeded", "done", "finished", "failed", "fail", "error", "cancelled", "canceled"]);
const LIST_OUTPUT_OPERATIONS = new Set<HiggsfieldOperationId>([
  "higgsfield.account.transactions",
  "higgsfield.workspace.list",
  "higgsfield.model.list",
  "higgsfield.workflow.list",
  "higgsfield.generate.list",
  "higgsfield.soul-id.list",
  "higgsfield.marketing-studio.ad-formats.list",
  "higgsfield.marketing-studio.avatars.list",
  "higgsfield.marketing-studio.products.list",
  "higgsfield.marketing-studio.webproducts.list",
  "higgsfield.website.list",
]);

export function validateSchema(value: unknown, schema: JsonSchema): boolean {
  const record = schema as JsonRecord;
  const declaredType = record.type;
  if (Array.isArray(declaredType)) {
    return declaredType.some((type) => type === "null" ? value === null : validateSchema(value, { ...record, type }));
  }
  if (Array.isArray(record.enum) && !record.enum.some((candidate) => Object.is(candidate, value))) return false;
  if (declaredType === "object") {
    const object = asRecord(value);
    if (!object) return false;
    const properties = asRecord(record.properties) ?? {};
    if (record.additionalProperties === false && Object.keys(object).some((key) => !(key in properties))) return false;
    if (typeof record.minProperties === "number" && Object.keys(object).length < record.minProperties) return false;
    if (typeof record.maxProperties === "number" && Object.keys(object).length > record.maxProperties) return false;
    const required = Array.isArray(record.required) ? record.required : [];
    if (required.some((key) => typeof key !== "string" || !(key in object))) return false;
    return Object.entries(object).every(([key, child]) => !(key in properties) || validateSchema(child, properties[key] as JsonSchema));
  }
  if (declaredType === "array") {
    if (!Array.isArray(value)) return false;
    if (typeof record.minItems === "number" && value.length < record.minItems) return false;
    if (typeof record.maxItems === "number" && value.length > record.maxItems) return false;
    return value.every((item) => validateSchema(item, (record.items ?? {}) as JsonSchema));
  }
  if (declaredType === "string") {
    if (typeof value !== "string") return false;
    if (typeof record.minLength === "number" && value.length < record.minLength) return false;
    if (typeof record.maxLength === "number" && value.length > record.maxLength) return false;
    if (typeof record.pattern === "string" && !new RegExp(record.pattern).test(value)) return false;
    return true;
  }
  if (declaredType === "integer") {
    if (!Number.isInteger(value)) return false;
    if (typeof record.minimum === "number" && (value as number) < record.minimum) return false;
    if (typeof record.maximum === "number" && (value as number) > record.maximum) return false;
    return true;
  }
  if (declaredType === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    if (typeof record.minimum === "number" && value < record.minimum) return false;
    if (typeof record.maximum === "number" && value > record.maximum) return false;
    return true;
  }
  if (declaredType === "boolean") return typeof value === "boolean";
  if (declaredType === "null") return value === null;
  return true;
}

function baseMeta(request: ProviderInvokeRequest, hash?: string): ProviderResultMeta {
  return {
    providerId: "higgsfield-cli",
    manifestVersion: request.manifestVersion,
    operationId: request.operationId,
    requestId: request.requestId,
    ...(hash ? { idempotencyKeyHash: hash } : {}),
    remoteState: "not_started",
    cancellation: "not_requested",
  };
}

export function failure(
  request: ProviderInvokeRequest,
  code: ProviderErrorCode,
  message: string,
  meta: Partial<ProviderResultMeta> = {},
  hash?: string,
  retryable = false,
): ProviderResult<never> {
  return {
    ok: false,
    error: { code, message, retryable },
    meta: { ...baseMeta(request, hash), ...meta },
  };
}

function parseBoundedJson(text: string): unknown | undefined {
  if (Buffer.byteLength(text, "utf8") > HIGGSFIELD_OUTPUT_LIMITS.stdoutBytes) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstObject = trimmed.indexOf("{");
    const lastObject = trimmed.lastIndexOf("}");
    const firstArray = trimmed.indexOf("[");
    const lastArray = trimmed.lastIndexOf("]");
    const start = firstArray >= 0 && (firstObject < 0 || firstArray < firstObject) ? firstArray : firstObject;
    const end = start === firstArray ? lastArray : lastObject;
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return undefined;
    }
  }
}

function withinJsonLimits(value: unknown, depth = 0, state = { arrayItems: 0, stringBytes: 0 }): boolean {
  if (depth > HIGGSFIELD_OUTPUT_LIMITS.jsonDepth) return false;
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value, "utf8");
    state.stringBytes += bytes;
    return bytes <= HIGGSFIELD_OUTPUT_LIMITS.stringBytes && state.stringBytes <= HIGGSFIELD_OUTPUT_LIMITS.stdoutBytes;
  }
  if (Array.isArray(value)) {
    state.arrayItems += value.length;
    return state.arrayItems <= HIGGSFIELD_OUTPUT_LIMITS.arrayItems && value.every((item) => withinJsonLimits(item, depth + 1, state));
  }
  const record = asRecord(value);
  if (!record) return true;
  return Object.entries(record).every(
    ([key, child]) => withinJsonLimits(key, depth + 1, state) && withinJsonLimits(child, depth + 1, state),
  );
}

function safeOutputString(value: string): string | undefined {
  if (UNSAFE_OUTPUT_STRING_RE.test(value)) return undefined;
  const trimmed = value.trim();
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) return undefined;
    try {
      const url = new URL(trimmed);
      url.username = "";
      url.password = "";
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      return undefined;
    }
  }
  if (
    /^(?:file|nomi-local):/i.test(trimmed)
    || trimmed.startsWith("/")
    || WINDOWS_ABSOLUTE_PATH_RE.test(trimmed)
    || RELATIVE_LOCAL_PATH_RE.test(trimmed)
  ) {
    return undefined;
  }
  return value;
}

function validPublicRemoteJobId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID_RE.test(value) && safeOutputString(value) === value;
}

function projectOutputToSchema(value: unknown, schema: JsonSchema, depth = 0): unknown | undefined {
  if (depth > HIGGSFIELD_OUTPUT_LIMITS.jsonDepth) return undefined;
  const record = schema as JsonRecord;
  const declaredType = record.type;
  if (Array.isArray(declaredType)) {
    for (const type of declaredType) {
      const projected = projectOutputToSchema(value, { ...record, type }, depth);
      if (projected !== undefined && validateSchema(projected, { ...record, type })) return projected;
    }
    return undefined;
  }
  if (declaredType === "object") {
    const source = asRecord(value);
    if (!source) return undefined;
    const properties = asRecord(record.properties) ?? {};
    const projected: JsonRecord = {};
    for (const [key, childSchema] of Object.entries(properties)) {
      if (!(key in source)) continue;
      const child = projectOutputToSchema(source[key], childSchema as JsonSchema, depth + 1);
      if (child !== undefined) projected[key] = child;
    }
    return projected;
  }
  if (declaredType === "array") {
    if (!Array.isArray(value)) return undefined;
    const projected: unknown[] = [];
    for (const child of value.slice(0, HIGGSFIELD_OUTPUT_LIMITS.arrayItems)) {
      const item = projectOutputToSchema(child, (record.items ?? {}) as JsonSchema, depth + 1);
      if (item !== undefined) projected.push(item);
    }
    return projected;
  }
  if (declaredType === "string") return typeof value === "string" ? safeOutputString(value) : undefined;
  if (declaredType === "integer") return Number.isInteger(value) ? value : undefined;
  if (declaredType === "number") return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  if (declaredType === "boolean") return typeof value === "boolean" ? value : undefined;
  if (declaredType === "null") return value === null ? null : undefined;
  return undefined;
}

function containsUnsafeOutputValue(value: unknown): boolean {
  if (typeof value === "string") return safeOutputString(value) === undefined;
  if (Array.isArray(value)) return value.some(containsUnsafeOutputValue);
  const record = asRecord(value);
  return record ? Object.values(record).some(containsUnsafeOutputValue) : false;
}

function normalizeOutputRoot(value: unknown, operation: ProviderOperationManifest): unknown {
  if (operation.id === "higgsfield.system.version" && typeof value === "string") {
    const match = /\b(?:higgsfield\s+)?([0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?)/i.exec(value);
    return match ? { version: match[1] } : {};
  }
  if (!Array.isArray(value)) return value;
  if (LIST_OUTPUT_OPERATIONS.has(operation.id)) return { items: value };
  if (
    operation.id === "higgsfield.generate.create"
    || operation.id === "higgsfield.generate.workflow"
    || operation.id === "higgsfield.generate.get"
    || operation.id === "higgsfield.generate.wait"
  ) {
    return [...value].reverse().find((item) => asRecord(item)) ?? {};
  }
  return { items: value };
}

function findString(value: unknown, keys: readonly string[]): string | undefined {
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findString(child, keys);
      if (found) return found;
    }
    return undefined;
  }
  const record = asRecord(value);
  if (!record) return undefined;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.length > 0 && candidate.length <= 512) return candidate;
  }
  for (const child of Object.values(record)) {
    const found = findString(child, keys);
    if (found) return found;
  }
  return undefined;
}

function remoteStateFor(value: unknown, operation: ProviderOperationManifest): ProviderResultMeta["remoteState"] {
  const status = findString(value, ["status", "state", "gen_status"]);
  if (status && TERMINAL_STATUSES.has(status.toLowerCase())) return "terminal";
  if (operation.execution === "job" || operation.execution === "stream") return "accepted";
  return "terminal";
}

export function resultFromExecutor(
  request: ProviderInvokeRequest,
  operation: ProviderOperationManifest,
  result: BoundedCliResult,
  hash?: string,
): ProviderResult<unknown> {
  if (result.kind === "not_installed") {
    return failure(request, "not_installed", "Higgsfield CLI is not installed.", {}, hash);
  }
  if (result.kind === "not_authenticated") {
    return failure(request, "not_authenticated", "Higgsfield CLI is not signed in.", {}, hash);
  }
  if (result.kind === "timed_out") {
    if (operation.policy.sideEffect !== "none") {
      return failure(
        request,
        "ambiguous_submission",
        "The Higgsfield submission outcome is unknown and was not retried.",
        { remoteState: "unknown" },
        hash,
      );
    }
    return failure(request, "timed_out", "Higgsfield CLI did not finish before the local timeout.", { remoteState: operation.execution === "immediate" ? "unknown" : "accepted" }, hash);
  }
  if (result.kind === "output_limit_exceeded") {
    return failure(request, "output_limit_exceeded", "Higgsfield CLI output exceeded a safety limit.", { remoteState: "unknown" }, hash);
  }
  if (result.kind === "cancelled") {
    const cancelledBeforeStart = result.cancellation === "before_start" || result.remoteState === "not_started";
    const remoteJobId = validPublicRemoteJobId(result.remoteJobId) ? result.remoteJobId : undefined;
    const remoteState = result.remoteState === "accepted" || result.remoteState === "unknown"
      ? result.remoteState
      : "unknown";
    return failure(
      request,
      "cancelled",
      cancelledBeforeStart
        ? "The Higgsfield operation was cancelled before it started."
        : "Local waiting for Higgsfield was cancelled.",
      {
        ...(remoteJobId ? { remoteJobId } : {}),
        remoteState: cancelledBeforeStart ? "not_started" : remoteState,
        cancellation: cancelledBeforeStart ? "before_start" : "local_wait_stopped",
      },
      hash,
    );
  }
  if (result.kind === "ambiguous_submission") {
    const remoteJobId = validPublicRemoteJobId(result.remoteJobId) ? result.remoteJobId : undefined;
    const remoteState = result.remoteState === "accepted" ? "accepted" : "unknown";
    return failure(
      request,
      "ambiguous_submission",
      "The Higgsfield submission outcome is unknown and was not retried.",
      {
        ...(remoteJobId ? { remoteJobId } : {}),
        remoteState,
      },
      hash,
    );
  }
  if (result.kind === "unavailable") {
    if (operation.policy.sideEffect !== "none") {
      return failure(
        request,
        "ambiguous_submission",
        "The Higgsfield submission outcome is unknown and was not retried.",
        { remoteState: "unknown" },
        hash,
      );
    }
    return failure(request, "unavailable", "Higgsfield CLI is temporarily unavailable.", { remoteState: "unknown" }, hash, true);
  }
  if (result.kind === "failure") {
    if (operation.policy.sideEffect !== "none") {
      const parsed = typeof result.stdout === "string" ? parseBoundedJson(result.stdout) : undefined;
      const candidateJobId = parsed !== undefined && withinJsonLimits(parsed) && !containsUnsafeOutputValue(parsed)
        ? findString(parsed, ["id", "job_id", "jobId", "task_id", "taskId"])
        : undefined;
      return failure(
        request,
        "ambiguous_submission",
        "The Higgsfield submission outcome is unknown and was not retried.",
        {
          ...(validPublicRemoteJobId(candidateJobId) ? { remoteJobId: candidateJobId } : {}),
          remoteState: validPublicRemoteJobId(candidateJobId) ? "accepted" : "unknown",
        },
        hash,
      );
    }
    return failure(request, "provider_rejected", "Higgsfield rejected the operation.", { remoteState: "unknown" }, hash);
  }

  const parsed = operation.id === "higgsfield.system.version" && !result.stdout.trim().startsWith("{")
    ? result.stdout.trim()
    : parseBoundedJson(result.stdout);
  if (parsed === undefined || !withinJsonLimits(parsed)) {
    return failure(request, "output_limit_exceeded", "Higgsfield CLI returned invalid or oversized JSON.", { remoteState: "unknown" }, hash);
  }
  const normalized = normalizeOutputRoot(parsed, operation);
  const value = projectOutputToSchema(normalized, operation.outputSchema);
  if (value === undefined || containsUnsafeOutputValue(value)) {
    return failure(request, "provider_rejected", "Higgsfield returned an unsafe operation result.", { remoteState: "unknown" }, hash);
  }
  if (!validateSchema(value, operation.outputSchema)) {
    return failure(request, "provider_rejected", "Higgsfield returned an invalid operation result.", { remoteState: "unknown" }, hash);
  }
  const remoteJobId = findString(value, ["id", "job_id", "jobId", "task_id", "taskId"]);
  return {
    ok: true,
    value,
    meta: {
      ...baseMeta(request, hash),
      ...(validPublicRemoteJobId(remoteJobId) ? { remoteJobId } : {}),
      remoteState: remoteStateFor(value, operation),
    },
  };
}
