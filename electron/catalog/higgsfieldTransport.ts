import type { BillingModelKind, HttpOperation, ProfileKind } from "./types";
import type { JsonRecord } from "../jsonUtils";
import {
  higgsfieldAssetFlagForCatalogParameter,
  higgsfieldFlagForCatalogParameter,
  isTrustedHiggsfieldCatalogSnapshot,
  type CatalogSchemaSnapshot,
  type HiggsfieldCatalogSnapshots,
} from "./higgsfieldProviderAdapter";

export const HIGGSFIELD_PROCESS_METHOD = "PROCESS";
export const HIGGSFIELD_WORKFLOW_MODEL_PREFIX = "workflow:";

const catalogSnapshots: {
  models: Record<string, CatalogSchemaSnapshot>;
  workflows: Record<string, CatalogSchemaSnapshot>;
} = { models: {}, workflows: {} };

const BUILTIN_COMPATIBILITY_SNAPSHOTS: Readonly<Record<string, CatalogSchemaSnapshot>> = {
  seed_audio: {
    type: "object",
    additionalProperties: false,
    properties: {
      prompt: { type: "string", maxLength: 65_536, cliFlag: "--prompt" },
    },
  },
  seedance_2_0: {
    type: "object",
    additionalProperties: false,
    properties: {
      prompt: { type: "string", maxLength: 65_536, cliFlag: "--prompt" },
      duration: { type: "integer", cliFlag: "--duration" },
      start_image: { type: "string", maxLength: 65_536, cliFlag: "--start-image" },
    },
  },
  "workflow:reframe": {
    type: "object",
    additionalProperties: false,
    properties: {
      prompt: { type: "string", maxLength: 65_536, cliFlag: "--prompt" },
      video_references: { type: "array", maxItems: 100, items: { type: "string", maxLength: 65_536 }, cliFlag: "--video" },
      aspect_ratio: { type: "string", maxLength: 64, cliFlag: "--aspect-ratio" },
    },
  },
};

export const HIGGSFIELD_STATUS_MAPPING: Record<string, string[]> = {
  succeeded: ["completed", "success", "succeeded", "done", "finished"],
  failed: ["failed", "fail", "error", "cancelled", "canceled"],
  running: ["running", "processing", "generating"],
  queued: ["queued", "pending", "created"],
};

export const HIGGSFIELD_RESPONSE_MAPPING = {
  task_id: "submit_id",
  status: "gen_status",
  image_url: "video_url",
  video_url: "video_url",
  audio_url: "video_url",
  model_url: "video_url",
};

export const HIGGSFIELD_MEDIA_FILE_PARAMS: NonNullable<NonNullable<HttpOperation["process"]>["fileParams"]> = [
  { param: "image", expose: "image", mode: "single" },
  { param: "image_url", expose: "image_url", mode: "single" },
  { param: "image_references", expose: "image_references", mode: "array" },
  { param: "input_audio", expose: "input_audio", mode: "single" },
  { param: "input_images", expose: "input_images", mode: "array" },
  { param: "input_video", expose: "input_video", mode: "single" },
  { param: "start_image", expose: "start_image", mode: "single" },
  { param: "end_image", expose: "end_image", mode: "single" },
  { param: "model_url", expose: "model_url", mode: "single" },
  { param: "ref_image", expose: "ref_image", mode: "single" },
  { param: "texture_image_url", expose: "texture_image_url", mode: "single" },
  { param: "urls", expose: "urls", mode: "array" },
  { param: "video", expose: "video", mode: "single" },
  { param: "video_references", expose: "video_references", mode: "array" },
  { param: "audio", expose: "audio", mode: "single" },
  { param: "audio_references", expose: "audio_references", mode: "array" },
  { param: "medias", expose: "medias", mode: "array" },
];

export const HIGGSFIELD_GENERATE_OP: HttpOperation = {
  method: HIGGSFIELD_PROCESS_METHOD,
  path: "higgsfield:generate",
  process: {
    bin: "higgsfield",
    parser: "higgsfield-cli",
    build: "higgsfield-generate",
    fileParams: HIGGSFIELD_MEDIA_FILE_PARAMS,
    args: [],
  },
  response_mapping: HIGGSFIELD_RESPONSE_MAPPING,
  provider_meta_mapping: { task_id: "submit_id" },
};

const KIND_TO_TASKS: Record<string, ProfileKind[]> = {
  image: ["text_to_image", "image_edit"],
  video: ["text_to_video", "image_to_video"],
  audio: ["text_to_audio", "image_to_audio", "transcribe"],
  model3d: ["text_to_3d", "image_to_3d"],
  text: ["chat", "image_to_prompt", "transcribe"],
};

export function supportedHiggsfieldKind(kind: BillingModelKind): boolean {
  return kind === "image" || kind === "video" || kind === "audio" || kind === "model3d" || kind === "text";
}

export function higgsfieldTaskKindsFor(kind: BillingModelKind): ProfileKind[] {
  return KIND_TO_TASKS[kind] || [];
}

function enumOptions(values: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .map((value) => ({ value, label: value }));
}

function controlTypeFromParam(param: JsonRecord): string {
  const name = String(param.name || "");
  const type = String(param.type || "").toLowerCase();
  if (name === "image_references" || name === "start_image" || name === "end_image" || name === "texture_image_url") return "image-url";
  if (Array.isArray(param.enum) && param.enum.length) return "select";
  if (/bool/.test(type)) return "boolean";
  if (/int|number|float/.test(type)) return "number";
  return "text";
}

export function modelParamsToControls(params: unknown): JsonRecord[] {
  if (!Array.isArray(params)) return [];
  return params.flatMap((param): JsonRecord[] => {
    if (!param || typeof param !== "object") return [];
    const p = param as JsonRecord;
    const key = String(p.name || "").trim();
    if (!key || key === "prompt" || key === "folder_id") return [];
    if (key === "video_references" || key === "audio_references" || key === "medias") return [];
    const type = controlTypeFromParam(p);
    const options = enumOptions(p.enum);
    return [{
      key,
      label: key.replace(/_/g, " "),
      type,
      ...(options.length ? { options } : {}),
      ...(typeof p.default === "string" || typeof p.default === "number" || typeof p.default === "boolean" ? { default: p.default } : {}),
    }];
  });
}

export function defaultHiggsfieldControls(kind: BillingModelKind, modelKey: string): JsonRecord[] {
  if (kind === "image") {
    return [
      { key: "aspect_ratio", label: "aspect ratio", type: "select", default: "1:1", options: ["1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"].map((value) => ({ value, label: value })) },
      { key: "resolution", label: "resolution", type: "select", default: "2k", options: ["1k", "2k", "4k"].map((value) => ({ value, label: value })) },
      { key: "image_references", label: "reference image", type: "image-url" },
    ];
  }
  if (kind === "video") {
    return [
      { key: "start_image", label: "start image", type: "image-url" },
      { key: "end_image", label: "end image", type: "image-url" },
      { key: "duration", label: "duration", type: "select", default: "5", options: ["4", "5", "8", "10", "12", "15"].map((value) => ({ value, label: `${value}s` })) },
      { key: "aspect_ratio", label: "aspect ratio", type: "select", default: "16:9", options: ["auto", "16:9", "9:16", "1:1", "4:3", "3:4"].map((value) => ({ value, label: value })) },
      { key: "resolution", label: "resolution", type: "select", default: "720p", options: ["480p", "720p", "1080p", "4k"].map((value) => ({ value, label: value })) },
    ];
  }
  if (kind === "model3d") {
    const imageRequired = modelKey !== "tripo_3d";
    return [
      ...(imageRequired ? [{ key: "image_references", label: "reference image", type: "image-url" }] : []),
      { key: "should_texture", label: "texture", type: "boolean", default: true },
    ];
  }
  if (kind === "audio") {
    return [
      { key: "duration", label: "duration", type: "number", default: 8 },
      { key: "format", label: "format", type: "select", default: "wav", options: ["wav", "mp3", "ogg_opus"].map((value) => ({ value, label: value })) },
    ];
  }
  return [];
}

export function buildHiggsfieldGenerateArgs(input: {
  modelKey: string;
  prompt: string;
  params: Record<string, unknown>;
  parameterSchema: CatalogSchemaSnapshot;
}): string[] {
  const isWorkflow = input.modelKey.startsWith(HIGGSFIELD_WORKFLOW_MODEL_PREFIX);
  const jobType = isWorkflow ? input.modelKey.slice(HIGGSFIELD_WORKFLOW_MODEL_PREFIX.length) : input.modelKey;
  const args = isWorkflow ? ["generate", "workflow", jobType] : ["generate", "create", jobType];
  const prompt = input.prompt.trim();
  if (prompt) args.push("--prompt", prompt);
  for (const [key, value] of Object.entries(input.params)) {
    if (shouldSkipParam(key, value)) continue;
    const flag = flagForParam(key, input.parameterSchema);
    if (!flag) throw new Error("Higgsfield rejected one or more generation parameters.");
    if (Array.isArray(value)) {
      for (const item of value) pushFlagValue(args, flag, item);
    } else {
      pushFlagValue(args, flag, value);
    }
  }
  args.push("--wait", "--wait-timeout", "20m", "--wait-interval", "5s", "--json");
  return args;
}

function shouldSkipParam(key: string, value: unknown): boolean {
  if (!key || key.endsWith("_nodeRef")) return true;
  if (["modelKey", "modelAlias", "vendor", "projectId", "nodeId", "grantId", "forceRerun"].includes(key)) return true;
  // These are OpenAI-compatible fallback defaults Nomi may inject headlessly;
  // Higgsfield schemas are explicit and reject unknown params.
  if (["n", "size", "response_format"].includes(key)) return true;
  if (typeof value === "undefined" || value === null || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function flagForParam(key: string, schema: CatalogSchemaSnapshot): string | null {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return null;
  const property = (properties as Record<string, unknown>)[key];
  if (!property || typeof property !== "object" || Array.isArray(property)) return null;
  return higgsfieldFlagForCatalogParameter(key);
}

function schemaPropertyForParam(param: JsonRecord): JsonRecord | null {
  const name = String(param.name || "").trim();
  if (!higgsfieldFlagForCatalogParameter(name)) return null;
  const rawType = String(param.type || "string").toLowerCase();
  const isArray = /array|\[\]|strings/.test(rawType);
  const scalarType = /bool/.test(rawType) ? "boolean" : /int/.test(rawType) ? "integer" : /number|float/.test(rawType) ? "number" : "string";
  const property: JsonRecord = {
    ...(isArray
      ? { type: "array", maxItems: 100, items: { type: scalarType, ...(scalarType === "string" ? { maxLength: 65_536 } : {}) } }
      : { type: rawType.includes("null") ? [scalarType, "null"] : scalarType }),
  };
  if (property.type === "string" || (Array.isArray(property.type) && property.type.includes("string"))) property.maxLength = 65_536;
  if (Array.isArray(param.enum) && param.enum.length > 0) {
    const enumValues = Array.from(new Set(
      param.enum
        .slice(0, 1_000)
        .map((value) => normalizeCatalogScalar(value, scalarType))
        .filter((value): value is string | number | boolean => value !== undefined),
    ));
    if (enumValues.length === 0) return null;
    if (isArray && property.items && typeof property.items === "object" && !Array.isArray(property.items)) {
      (property.items as JsonRecord).enum = enumValues;
    } else {
      property.enum = enumValues;
    }
  }
  if (typeof param.minimum === "number") property.minimum = param.minimum;
  if (typeof param.maximum === "number") property.maximum = param.maximum;
  return property;
}

function normalizeCatalogScalar(value: unknown, type: string): string | number | boolean | undefined {
  if (type === "string") {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : undefined;
  }
  if (type === "integer") {
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value !== "string" || !/^[+-]?\d+$/.test(value.trim())) return undefined;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : undefined;
  }
  if (type === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "string" || value.trim() === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return undefined;
    if (value.trim().toLowerCase() === "true") return true;
    if (value.trim().toLowerCase() === "false") return false;
  }
  return undefined;
}

function normalizeCatalogInputValue(value: unknown, propertyValue: unknown): unknown | undefined {
  const property = propertyValue && typeof propertyValue === "object" && !Array.isArray(propertyValue)
    ? propertyValue as JsonRecord
    : null;
  if (!property) return undefined;
  const types = Array.isArray(property.type) ? property.type.map(String) : [String(property.type || "")];
  if (value === null) return types.includes("null") ? null : undefined;
  if (types.includes("array")) {
    if (!Array.isArray(value)) return undefined;
    const normalized: unknown[] = [];
    for (const entry of value) {
      const item = normalizeCatalogInputValue(entry, property.items);
      if (item === undefined) return undefined;
      normalized.push(item);
    }
    return normalized;
  }
  const scalarType = types.find((type) => type !== "null");
  const normalized = scalarType ? normalizeCatalogScalar(value, scalarType) : undefined;
  if (normalized === undefined) return undefined;
  if (Array.isArray(property.enum) && !property.enum.some((candidate) => Object.is(candidate, normalized))) return undefined;
  return normalized;
}

export function registerHiggsfieldCatalogSnapshot(
  source: "model" | "workflow",
  modelKey: string,
  params: unknown,
): CatalogSchemaSnapshot {
  const properties: Record<string, JsonRecord> = {
    prompt: { type: "string", maxLength: 65_536, cliFlag: "--prompt" },
  };
  const required: string[] = [];
  if (Array.isArray(params)) {
    for (const value of params) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const param = value as JsonRecord;
      const name = String(param.name || "").trim();
      const property = schemaPropertyForParam(param);
      if (!property) continue;
      properties[name] = property;
      if (param.required === true) required.push(name);
    }
  }
  const schema: CatalogSchemaSnapshot = {
    type: "object",
    additionalProperties: false,
    ...(required.length ? { required } : {}),
    properties,
  };
  const key = source === "workflow" && !modelKey.startsWith(HIGGSFIELD_WORKFLOW_MODEL_PREFIX)
    ? `${HIGGSFIELD_WORKFLOW_MODEL_PREFIX}${modelKey}`
    : modelKey;
  catalogSnapshots[source === "workflow" ? "workflows" : "models"][key] = schema;
  return schema;
}

export function getHiggsfieldCatalogSnapshots(): HiggsfieldCatalogSnapshots {
  return catalogSnapshots;
}

export function cacheResolvedHiggsfieldCatalogSnapshot(
  modelKey: string,
  snapshot: CatalogSchemaSnapshot,
): void {
  if (!isHiggsfieldCatalogSnapshot(snapshot)) return;
  const target = modelKey.startsWith(HIGGSFIELD_WORKFLOW_MODEL_PREFIX)
    ? catalogSnapshots.workflows
    : catalogSnapshots.models;
  target[modelKey] = snapshot;
}

export function isHiggsfieldCatalogSnapshot(value: unknown): value is CatalogSchemaSnapshot {
  return isTrustedHiggsfieldCatalogSnapshot(value);
}

type LegacyCatalogContext = {
  parameterControls?: unknown;
  fileParams?: NonNullable<NonNullable<HttpOperation["process"]>["fileParams"]>;
};

function legacyControlProperty(value: unknown): { key: string; property: JsonRecord } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const control = value as JsonRecord;
  const key = String(control.key || "").trim();
  if (!higgsfieldFlagForCatalogParameter(key) || higgsfieldAssetFlagForCatalogParameter(key)) return null;
  const controlType = String(control.type || "text").toLowerCase();
  const scalarType = controlType === "boolean" ? "boolean" : controlType === "number" ? "number" : "string";
  const property: JsonRecord = scalarType === "string"
    ? { type: "string", maxLength: 65_536 }
    : { type: scalarType };
  if (Array.isArray(control.options) && control.options.length > 0) {
    const enumValues = Array.from(new Set(control.options.slice(0, 1_000).flatMap((option) => {
      const record = option && typeof option === "object" && !Array.isArray(option) ? option as JsonRecord : null;
      const candidate = record ? record.value : option;
      const normalized = normalizeCatalogScalar(candidate, scalarType);
      return normalized === undefined ? [] : [normalized];
    })));
    if (enumValues.length > 0) property.enum = enumValues;
  }
  return { key, property };
}

function buildLegacyCatalogSnapshot(context: LegacyCatalogContext): CatalogSchemaSnapshot | undefined {
  const properties: Record<string, JsonRecord> = {
    prompt: { type: "string", maxLength: 65_536 },
  };
  if (Array.isArray(context.parameterControls)) {
    for (const value of context.parameterControls) {
      const control = legacyControlProperty(value);
      if (control) properties[control.key] = control.property;
    }
  }
  for (const fileParam of context.fileParams ?? []) {
    if (!higgsfieldAssetFlagForCatalogParameter(fileParam.param)) continue;
    properties[fileParam.param] = fileParam.mode === "single"
      ? { type: "string", maxLength: 65_536 }
      : { type: "array", maxItems: 100, items: { type: "string", maxLength: 65_536 } };
  }
  const snapshot: CatalogSchemaSnapshot = {
    type: "object",
    additionalProperties: false,
    properties,
  };
  return isHiggsfieldCatalogSnapshot(snapshot) ? snapshot : undefined;
}

export function resolveHiggsfieldCatalogSnapshot(
  modelKey: string,
  persistedSnapshot: unknown,
  legacyContext?: LegacyCatalogContext,
): CatalogSchemaSnapshot | undefined {
  const snapshots = getHiggsfieldCatalogSnapshots();
  const registered = modelKey.startsWith(HIGGSFIELD_WORKFLOW_MODEL_PREFIX)
    ? snapshots.workflows[modelKey]
    : snapshots.models[modelKey];
  if (isHiggsfieldCatalogSnapshot(registered)) return registered;
  if (isHiggsfieldCatalogSnapshot(persistedSnapshot)) return persistedSnapshot;
  const builtin = BUILTIN_COMPATIBILITY_SNAPSHOTS[modelKey];
  if (isHiggsfieldCatalogSnapshot(builtin)) return builtin;
  return legacyContext ? buildLegacyCatalogSnapshot(legacyContext) : undefined;
}

export function selectHiggsfieldGenerationParameters(
  prompt: string,
  params: Record<string, unknown>,
  schema: CatalogSchemaSnapshot,
): Record<string, unknown> | undefined {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return undefined;
  const allowed = properties as Record<string, unknown>;
  const selected: Record<string, unknown> = {};
  if (prompt.trim()) {
    if (!("prompt" in allowed)) return undefined;
    selected.prompt = prompt.trim();
  }
  for (const [key, value] of Object.entries(params)) {
    if (shouldSkipParam(key, value)) continue;
    if (!(key in allowed)) return undefined;
    const normalized = normalizeCatalogInputValue(value, allowed[key]);
    if (normalized === undefined) return undefined;
    selected[key] = normalized;
  }
  return selected;
}

function pushFlagValue(args: string[], flag: string, value: unknown): void {
  if (typeof value === "undefined" || value === null || value === "") return;
  if (typeof value === "boolean") {
    args.push(flag, value ? "true" : "false");
    return;
  }
  args.push(flag, String(value));
}
