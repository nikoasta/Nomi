import type { BillingModelKind, HttpOperation, ProfileKind } from "./types";
import type { JsonRecord } from "../jsonUtils";

export const HIGGSFIELD_PROCESS_METHOD = "PROCESS";
export const HIGGSFIELD_WORKFLOW_MODEL_PREFIX = "workflow:";

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

const MEDIA_FILE_PARAMS: NonNullable<HttpOperation["process"]>["fileParams"] = [
  { param: "image_references", expose: "image_references", mode: "array" },
  { param: "start_image", expose: "start_image", mode: "single" },
  { param: "end_image", expose: "end_image", mode: "single" },
  { param: "texture_image_url", expose: "texture_image_url", mode: "single" },
  { param: "video_references", expose: "video_references", mode: "array" },
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
    fileParams: MEDIA_FILE_PARAMS,
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

export function buildHiggsfieldGenerateArgs(input: { modelKey: string; prompt: string; params: Record<string, unknown> }): string[] {
  const isWorkflow = input.modelKey.startsWith(HIGGSFIELD_WORKFLOW_MODEL_PREFIX);
  const jobType = isWorkflow ? input.modelKey.slice(HIGGSFIELD_WORKFLOW_MODEL_PREFIX.length) : input.modelKey;
  const args = isWorkflow ? ["generate", "workflow", jobType] : ["generate", "create", jobType];
  const prompt = input.prompt.trim();
  if (prompt) args.push("--prompt", prompt);
  for (const [key, value] of Object.entries(input.params)) {
    if (shouldSkipParam(key, value)) continue;
    const flag = flagForParam(key);
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

function flagForParam(key: string): string {
  if (key === "image_references") return "--image";
  if (key === "video_references") return "--video";
  if (key === "audio_references") return "--audio";
  if (key === "medias") return "--video";
  if (key === "start_image") return "--start-image";
  if (key === "end_image") return "--end-image";
  return `--${key.replace(/_/g, "-")}`;
}

function pushFlagValue(args: string[], flag: string, value: unknown): void {
  if (typeof value === "undefined" || value === null || value === "") return;
  if (typeof value === "boolean") {
    args.push(flag, value ? "true" : "false");
    return;
  }
  args.push(flag, String(value));
}
