import { createHash } from "node:crypto";

import {
  HIGGSFIELD_OUTPUT_LIMITS,
  failure,
  resultFromExecutor,
  validateSchema,
  type GenerationProviderExtension,
  type HiggsfieldCliExecutor,
  type ProviderErrorCode,
  type ProviderInvokeOptions,
  type ProviderInvokeRequest,
  type ProviderResult,
  type SafeProcessEnvironment,
} from "./higgsfieldCodec";
import type { JsonSchema, ProviderCapabilityManifest, ProviderOperationManifest } from "./higgsfieldProviderManifest";

export {
  HIGGSFIELD_OUTPUT_LIMITS,
  type BoundedCliResult,
  type HiggsfieldCliExecutor,
  type OutputLimits,
  type SafeProcessEnvironment,
} from "./higgsfieldCodec";

export type CatalogSchemaSnapshot = Readonly<Record<string, unknown>>;
export type HiggsfieldCatalogSnapshots = {
  models: Readonly<Record<string, CatalogSchemaSnapshot>>;
  workflows: Readonly<Record<string, CatalogSchemaSnapshot>>;
};

export const HIGGSFIELD_GENERATION_PARAMETER_FLAGS: Readonly<Record<string, string>> = Object.freeze({
  prompt: "--prompt",
  negative_prompt: "--negative-prompt",
  duration: "--duration",
  aspect_ratio: "--aspect-ratio",
  aspectRatio: "--aspect-ratio",
  resolution: "--resolution",
  quality: "--quality",
  seed: "--seed",
  batch_size: "--batch-size",
  script: "--script",
  format: "--format",
  voice_id: "--voice-id",
  should_texture: "--should-texture",
  enable_animation: "--enable-animation",
  image_references: "--image",
  video_references: "--video",
  audio_references: "--audio",
  start_image: "--start-image",
  end_image: "--end-image",
  texture_image_url: "--texture-image-url",
  medias: "--video",
});

const ASSET_PARAMETER_FLAGS: Readonly<Record<string, string>> = Object.freeze({
  image: "--image",
  image_url: "--image-url",
  image_references: "--image",
  input_audio: "--input-audio",
  input_images: "--input-images",
  input_video: "--input-video",
  start_image: "--start-image",
  end_image: "--end-image",
  model_url: "--model-url",
  ref_image: "--ref-image",
  texture_image_url: "--texture-image-url",
  urls: "--urls",
  video: "--video",
  video_references: "--video",
  audio: "--audio",
  audio_references: "--audio",
  medias: "--video",
});

// Frozen from the installed CLI 1.1.13 catalog. New parameter names require an
// explicit code review before they can become argv flags.
const HIGGSFIELD_CLI_1_1_13_PARAMETER_ALLOWLIST = new Set<string>([
  "ad_reference_id", "animation_action_id", "apply_mask", "aspect_ratio", "aspectRatio", "audio", "audio_references",
  "auto_size", "autoprompt", "avatar_ids", "avatars", "background_color", "background_preset_id", "background_source",
  "batch_size", "bitrate_mode", "brand_kit_id", "budget", "camera_aperture_id", "camera_focal_length_id", "camera_lens_id",
  "camera_model_id", "camera_style", "cfg_scale", "clip_aspect", "clips_num", "color_grading", "colors", "creativity",
  "custom_reference_id", "denoise", "detection_threshold", "duration", "enable_animation", "enable_pbr", "enable_rigging",
  "enable_safety_checker", "end_image", "enhance_prompt", "enhancement", "enhancer", "export_textured_glb",
  "face_enhancement", "face_enhancement_creativity", "face_enhancement_strength", "face_limit", "folder_id", "format",
  "fps", "frame_count", "frame_interpolation", "frame_rate", "frame_size", "frames_count", "generate_audio", "genre",
  "geometry_quality", "height", "height_meters", "hook_id", "image", "image_references", "image_url", "input_audio",
  "input_height", "input_images", "input_video", "input_video_size", "input_width", "is_humanoid", "items", "kind",
  "kling_element_ids", "light_scheme", "loudness_rate", "max_height", "medias", "mode", "model", "model_type",
  "model_url", "model_version", "multi_prompt", "multi_shot_mode", "multi_shots", "name", "negative_prompt",
  "outfit_preset_ids", "output_height", "output_width", "pbr", "pitch_rate", "pose_mode", "pose_preset_id", "preset",
  "preset_id", "product_ids", "prompt", "prompt_language", "quality", "reasoning_effort", "ref_image", "remove_bg",
  "resolution", "rigging_height_meters", "sample_rate", "script", "seed", "segment_seconds", "setting_id", "sharpen",
  "should_remesh", "should_texture", "slow_motion", "sound", "specific_mode", "speech_rate", "speedramp", "start_image",
  "storyboard_id", "style_id", "style_prompt", "subtitle_case", "subtitle_font", "subtitle_highlight_hex",
  "subtitle_position", "subtitles", "symmetry_mode", "sync_mode", "system_prompt", "target_language", "target_polycount",
  "texture", "texture_image_url", "texture_prompt", "texture_quality", "thinking", "topology", "track_face_crop", "urls",
  "user_outfit_ids", "user_prompt", "variant", "video", "video_references", "video_tier", "voice", "voice_id",
  "voice_type", "web_product_ids", "web_product_type", "width", "with_sound",
] as const);

type MaterializedProjectAsset = {
  cliValue: string;
  cleanup(): Promise<void> | void;
};

type AdapterDependencies = {
  executor: HiggsfieldCliExecutor;
  manifest: ProviderCapabilityManifest;
  catalogSnapshots: HiggsfieldCatalogSnapshots;
  environment: Readonly<Record<string, string | undefined>>;
  platform: "posix" | "win32";
  onDiagnostic?: (diagnostic: Readonly<Record<string, unknown>>) => void;
  materializeProjectAsset?: (input: { projectId: string; assetId: string }) => Promise<MaterializedProjectAsset>;
};

type JsonRecord = Record<string, unknown>;

const POSIX_ENV_KEYS = ["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"] as const;
const WINDOWS_ENV_KEYS = ["PATH", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP"] as const;
const PRODUCT_GATED_PREFIXES = [
  "higgsfield.soul-id.",
  "higgsfield.marketing-studio.",
  "higgsfield.product-photoshoot.",
  "higgsfield.marketplace-cards.",
] as const;
const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/;
const IDEMPOTENCY_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,511}$/;
const WINDOWS_ABSOLUTE_PATH_RE = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/[^/])/;
const RELATIVE_LOCAL_PATH_RE = /^(?:(?:\.{1,2}|~)[\\/]|[^\s?#]+[\\/][^\s?#]+\.(?:png|jpe?g|webp|gif|mp4|mov|webm|m4v|glb|gltf|obj|fbx|usdz|wav|mp3|m4a|ogg|flac|json|zip)$)|(?:^|[\\/])\.\.(?:[\\/]|$)/i;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonRecord;
}

function safeEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  platform: "posix" | "win32",
): SafeProcessEnvironment {
  const keys = platform === "win32" ? WINDOWS_ENV_KEYS : POSIX_ENV_KEYS;
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = environment[key];
    if (typeof value === "string" && value.length > 0) result[key] = value;
  }
  return result;
}

function hashIdempotencyKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

function isProductGated(operationId: string): boolean {
  return PRODUCT_GATED_PREFIXES.some((prefix) => operationId.startsWith(prefix));
}

function validSafeId(value: unknown): value is string {
  return typeof value === "string" && SAFE_ID_RE.test(value);
}

export function higgsfieldFlagForCatalogParameter(name: string): string | null {
  const fixedFlag = HIGGSFIELD_GENERATION_PARAMETER_FLAGS[name] ?? ASSET_PARAMETER_FLAGS[name];
  if (fixedFlag) return fixedFlag;
  if (!HIGGSFIELD_CLI_1_1_13_PARAMETER_ALLOWLIST.has(name)) return null;
  const kebab = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
  return kebab ? `--${kebab}` : null;
}

function placeholderForCatalogProperty(property: unknown, count: number): unknown | undefined {
  const record = asRecord(property);
  if (!record) return undefined;
  const types = Array.isArray(record.type) ? record.type : [record.type];
  if (types.includes("array")) return Array.from({ length: Math.max(1, count) }, () => "project-asset");
  return count === 1 ? "project-asset" : undefined;
}

type CatalogAssetPlan = {
  parameter: string;
  flag: string;
  assetIds: readonly string[];
};

function planCatalogInvocation(
  parameters: unknown,
  assets: readonly { assetId: string; parameter: string }[],
  schema: CatalogSchemaSnapshot,
): { parameters: JsonRecord; assets: readonly CatalogAssetPlan[] } | null {
  const parameterRecord = asRecord(parameters);
  if (!isTrustedHiggsfieldCatalogSnapshot(schema) || !parameterRecord) return null;
  const properties = asRecord(schema.properties) ?? {};
  const merged: JsonRecord = { ...parameterRecord };
  if (Object.keys(merged).some((name) => assetFlag(name))) return null;
  if (containsLocalPathValue(merged)) return null;

  const groupedAssets = new Map<string, { flag: string; assetIds: string[] }>();
  for (const asset of assets) {
    const flag = assetFlag(asset.parameter);
    if (!flag) return null;
    const group = groupedAssets.get(asset.parameter) ?? { flag, assetIds: [] };
    group.assetIds.push(asset.assetId);
    groupedAssets.set(asset.parameter, group);
  }

  const assetPlan: CatalogAssetPlan[] = [];
  for (const [parameter, group] of groupedAssets) {
    const property = properties[parameter];
    if (!property || parameter in merged) return null;
    const placeholder = placeholderForCatalogProperty(property, group.assetIds.length);
    if (placeholder === undefined || !validateSchema(placeholder, property as JsonSchema)) return null;
    merged[parameter] = placeholder;
    assetPlan.push({ parameter, flag: group.flag, assetIds: group.assetIds });
  }

  if (!validateSchema(merged, schema)) return null;

  // Prove every non-file catalog value has a closed-schema argv mapping before
  // any project asset resolver is allowed to run.
  const preflightArgv: string[] = [];
  for (const [name, value] of Object.entries(parameterRecord)) {
    if (!appendSchemaParameter(preflightArgv, name, value, schema)) return null;
  }

  return { parameters: parameterRecord, assets: assetPlan };
}

function containsLocalPathValue(value: unknown): boolean {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return /^(?:file|nomi-local):/i.test(trimmed)
      || trimmed.startsWith("/")
      || WINDOWS_ABSOLUTE_PATH_RE.test(trimmed)
      || RELATIVE_LOCAL_PATH_RE.test(trimmed);
  }
  if (Array.isArray(value)) return value.some(containsLocalPathValue);
  const record = asRecord(value);
  return record ? Object.values(record).some(containsLocalPathValue) : false;
}

function appendSchemaParameter(argv: string[], name: string, value: unknown, schema: CatalogSchemaSnapshot): boolean {
  const properties = asRecord(schema.properties) ?? {};
  const property = asRecord(properties[name]);
  const flag = higgsfieldFlagForCatalogParameter(name);
  if (!property || !flag || assetFlag(name)) return false;
  if (Array.isArray(value)) {
    for (const item of value) argv.push(flag, String(item));
  } else if (typeof value === "boolean") {
    argv.push(flag, value ? "true" : "false");
  } else {
    argv.push(flag, String(value));
  }
  return true;
}

function isTrustedCatalogValueSchema(value: unknown): boolean {
  const property = asRecord(value);
  if (!property) return false;
  const types = Array.isArray(property.type) ? property.type : [property.type];
  if (types.length === 0 || types.some((type) => !["string", "integer", "number", "boolean", "null", "array"].includes(String(type)))) {
    return false;
  }
  if (types.includes("string") && (typeof property.maxLength !== "number" || property.maxLength > 65_536)) return false;
  if (types.includes("array")) {
    if (typeof property.maxItems !== "number" || property.maxItems > 100) return false;
    const items = asRecord(property.items);
    if (!items) return false;
    const itemTypes = Array.isArray(items.type) ? items.type : [items.type];
    if (itemTypes.some((type) => !["string", "integer", "number", "boolean"].includes(String(type)))) return false;
    if (itemTypes.includes("string") && (typeof items.maxLength !== "number" || items.maxLength > 65_536)) return false;
  }
  if (Array.isArray(property.enum)) {
    const enumSchema = { ...property };
    delete enumSchema.enum;
    if (property.enum.length === 0 || property.enum.some((entry) => !validateSchema(entry, enumSchema))) return false;
  }
  const items = asRecord(property.items);
  if (items && Array.isArray(items.enum)) {
    const itemEnumSchema = { ...items };
    delete itemEnumSchema.enum;
    if (items.enum.length === 0 || items.enum.some((entry) => !validateSchema(entry, itemEnumSchema))) return false;
  }
  return true;
}

export function isTrustedHiggsfieldCatalogSnapshot(value: unknown): value is CatalogSchemaSnapshot {
  const schema = asRecord(value);
  if (!schema || schema.type !== "object" || schema.additionalProperties !== false) return false;
  const properties = asRecord(schema.properties);
  if (!properties || Object.keys(properties).length === 0) return false;
  const required = schema.required;
  if (required !== undefined) {
    if (!Array.isArray(required) || required.some((name) => typeof name !== "string" || !(name in properties))) return false;
  }
  return Object.entries(properties).every(([name, property]) => {
    return higgsfieldFlagForCatalogParameter(name) !== null && isTrustedCatalogValueSchema(property);
  });
}

function assetFlag(parameter: string): string | null {
  return ASSET_PARAMETER_FLAGS[parameter] ?? null;
}

export function higgsfieldAssetFlagForCatalogParameter(parameter: string): string | null {
  return assetFlag(parameter);
}

function parseGenerationInput(input: unknown): {
  targetKey: string;
  parameters: JsonRecord;
  assets: Array<{ assetId: string; parameter: string }>;
} | null {
  const record = asRecord(input);
  if (!record || Object.keys(record).some((key) => !["targetKey", "parameters", "assets"].includes(key))) return null;
  if (!validSafeId(record.targetKey) || !asRecord(record.parameters) || !Array.isArray(record.assets)) return null;
  if (record.assets.length > HIGGSFIELD_OUTPUT_LIMITS.artifactCount) return null;
  const assets: Array<{ assetId: string; parameter: string }> = [];
  for (const value of record.assets) {
    const asset = asRecord(value);
    if (!asset || Object.keys(asset).some((key) => !["assetId", "parameter"].includes(key))) return null;
    if (!validSafeId(asset.assetId) || !validSafeId(asset.parameter) || !assetFlag(asset.parameter)) return null;
    assets.push({ assetId: asset.assetId, parameter: asset.parameter });
  }
  return { targetKey: record.targetKey, parameters: record.parameters as JsonRecord, assets };
}

function fixedArgv(operation: ProviderOperationManifest, input: unknown): string[] | null {
  const record = asRecord(input);
  if (!record || !validateSchema(input, operation.inputSchema)) return null;
  switch (operation.id) {
    case "higgsfield.system.version":
    case "higgsfield.account.status":
    case "higgsfield.workspace.status":
    case "higgsfield.workflow.list":
    case "higgsfield.auth.logout":
    case "higgsfield.workspace.unset":
      return [...operation.cliPath, "--json"];
    case "higgsfield.auth.login":
      return typeof record.port === "number"
        ? [...operation.cliPath, "--port", String(record.port), "--json"]
        : [...operation.cliPath, "--json"];
    case "higgsfield.model.list": {
      const argv = [...operation.cliPath];
      if (typeof record.kind === "string") argv.push(`--${record.kind}`);
      return [...argv, "--json"];
    }
    case "higgsfield.voices.list": {
      const argv = [...operation.cliPath];
      if (typeof record.cursor === "string") argv.push("--cursor", record.cursor);
      if (typeof record.size === "number") argv.push("--size", String(record.size));
      return [...argv, "--json"];
    }
    case "higgsfield.model.get":
      return validSafeId(record.modelKey) ? [...operation.cliPath, record.modelKey, "--json"] : null;
    case "higgsfield.workflow.get": {
      if (!validSafeId(record.workflowKey) || !record.workflowKey.startsWith("workflow:")) return null;
      const key = record.workflowKey.slice("workflow:".length);
      return validSafeId(key) ? [...operation.cliPath, key, "--json"] : null;
    }
    case "higgsfield.voices.get":
      return validSafeId(record.voiceId) ? [...operation.cliPath, record.voiceId, "--json"] : null;
    case "higgsfield.workspace.set":
      return validSafeId(record.workspaceId) ? [...operation.cliPath, record.workspaceId, "--json"] : null;
    case "higgsfield.generate.get":
      return validSafeId(record.generationId) ? [...operation.cliPath, record.generationId, "--json"] : null;
    case "higgsfield.generate.wait": {
      if (!validSafeId(record.generationId)) return null;
      const argv = [...operation.cliPath, record.generationId];
      if (typeof record.timeoutSeconds === "number") argv.push("--timeout", `${record.timeoutSeconds}s`);
      if (typeof record.intervalSeconds === "number") argv.push("--interval", `${record.intervalSeconds}s`);
      return [...argv, "--json"];
    }
    default:
      return null;
  }
}

function diagnostic(dependencies: AdapterDependencies, code: ProviderErrorCode, operationId: string): void {
  try {
    dependencies.onDiagnostic?.({ providerId: "higgsfield-cli", operationId, code });
  } catch {
    // Diagnostics are observational and never change provider behavior.
  }
}

async function cleanupAssets(assets: readonly MaterializedProjectAsset[]): Promise<void> {
  await Promise.all(assets.map(async (asset) => {
    try {
      await asset.cleanup();
    } catch {
      // Best effort cleanup; provider results never contain local paths.
    }
  }));
}

function withRequestMeta(result: ProviderResult<unknown>, request: ProviderInvokeRequest): ProviderResult<unknown> {
  return { ...result, meta: { ...result.meta, requestId: request.requestId, operationId: request.operationId, manifestVersion: request.manifestVersion } };
}

export function createHiggsfieldProviderAdapter(dependencies: AdapterDependencies): GenerationProviderExtension {
  const operations = new Map(dependencies.manifest.operations.map((operation) => [operation.id, operation]));
  type SubmissionEntry = {
    promise: Promise<ProviderResult<unknown>>;
    settled: boolean;
    expiresAt: number;
  };
  const submissions = new Map<string, SubmissionEntry>();
  const environment = safeEnvironment(dependencies.environment, dependencies.platform);
  const submissionTtlMs = 5 * 60_000;
  const maxSubmissions = 1_000;

  function pruneSubmissions(now: number): void {
    for (const [key, entry] of submissions) {
      if (entry.settled && entry.expiresAt <= now) submissions.delete(key);
    }
    while (submissions.size >= maxSubmissions) {
      const oldest = Array.from(submissions.entries()).find(([, entry]) => entry.settled)?.[0];
      if (!oldest) break;
      submissions.delete(oldest);
    }
  }

  async function execute(
    request: ProviderInvokeRequest,
    operation: ProviderOperationManifest,
    hash: string | undefined,
    options: ProviderInvokeOptions,
  ): Promise<ProviderResult<unknown>> {
    const materialized: MaterializedProjectAsset[] = [];
    try {
      let argv: string[] | null = null;
      if (operation.id === "higgsfield.generate.create" || operation.id === "higgsfield.generate.workflow" || operation.id === "higgsfield.generate.cost") {
        const generation = parseGenerationInput(request.input);
        if (!generation) return failure(request, "invalid_input", "The Higgsfield operation input is invalid.", {}, hash);
        const isWorkflowTarget = generation.targetKey.startsWith("workflow:");
        const isWorkflowOperation = operation.id === "higgsfield.generate.workflow";
        if (operation.id !== "higgsfield.generate.cost" && isWorkflowOperation !== isWorkflowTarget) {
          return failure(request, "invalid_input", "The Higgsfield target does not match the operation.", {}, hash);
        }
        const snapshots = isWorkflowTarget ? dependencies.catalogSnapshots.workflows : dependencies.catalogSnapshots.models;
        const schema = snapshots[generation.targetKey];
        if (!schema) {
          return failure(request, "invalid_input", "The Higgsfield target or parameters are invalid.", {}, hash);
        }
        const invocationPlan = planCatalogInvocation(generation.parameters, generation.assets, schema);
        if (!invocationPlan) {
          return failure(request, "invalid_input", "The Higgsfield target or parameters are invalid.", {}, hash);
        }
        if (operation.id === "higgsfield.generate.cost" && invocationPlan.assets.length > 0) {
          return failure(request, "invalid_input", "Cost estimates cannot materialize or upload project assets.", {}, hash);
        }
        const target = isWorkflowTarget ? generation.targetKey.slice("workflow:".length) : generation.targetKey;
        if (!validSafeId(target)) return failure(request, "invalid_input", "The Higgsfield target is invalid.", {}, hash);
        argv = operation.id === "higgsfield.generate.cost" && isWorkflowTarget
          ? [...operation.cliPath, "workflow", target]
          : [...operation.cliPath, target];
        const resolvedAssets = new Map<string, MaterializedProjectAsset[]>();
        if (invocationPlan.assets.length > 0) {
          if (!request.policyContext.projectId || !dependencies.materializeProjectAsset) {
            return failure(request, "invalid_input", "Project assets cannot be materialized for this request.", {}, hash);
          }
          for (const planned of invocationPlan.assets) {
            const resolvedGroup: MaterializedProjectAsset[] = [];
            for (const assetId of planned.assetIds) {
              const resolved = await dependencies.materializeProjectAsset({
                projectId: request.policyContext.projectId,
                assetId,
              });
              materialized.push(resolved);
              resolvedGroup.push(resolved);
            }
            resolvedAssets.set(planned.parameter, resolvedGroup);
          }
        }
        const schemaProperties = asRecord(schema.properties) ?? {};
        for (const name of Object.keys(schemaProperties)) {
          if (name in invocationPlan.parameters) {
            appendSchemaParameter(argv, name, invocationPlan.parameters[name], schema);
          }
          const flag = invocationPlan.assets.find((planned) => planned.parameter === name)?.flag;
          const assets = resolvedAssets.get(name);
          if (flag && assets) {
            for (const asset of assets) argv.push(flag, asset.cliValue);
          }
        }
        if (operation.id !== "higgsfield.generate.cost") {
          argv.push("--wait", "--wait-timeout", "20m", "--wait-interval", "5s");
        }
        argv.push("--json");
      } else if (operation.id === "higgsfield.upload.create") {
        const upload = asRecord(request.input);
        if (!upload || !validateSchema(request.input, operation.inputSchema) || !validSafeId(upload.assetId)) {
          return failure(request, "invalid_input", "The Higgsfield upload input is invalid.", {}, hash);
        }
        if (!request.policyContext.projectId || !dependencies.materializeProjectAsset) {
          return failure(request, "invalid_input", "The project asset cannot be materialized for upload.", {}, hash);
        }
        const resolved = await dependencies.materializeProjectAsset({
          projectId: request.policyContext.projectId,
          assetId: upload.assetId,
        });
        materialized.push(resolved);
        argv = [...operation.cliPath, resolved.cliValue, "--json"];
      } else {
        argv = fixedArgv(operation, request.input);
      }

      if (!argv) return failure(request, "invalid_input", "The Higgsfield operation input is invalid.", {}, hash);
      if (options.signal?.aborted) {
        return failure(
          request,
          "cancelled",
          "The Higgsfield operation was cancelled before it started.",
          { remoteState: "not_started", cancellation: "before_start" },
          hash,
        );
      }
      const executorResult = await dependencies.executor.execute({
        argv,
        timeoutMs: operation.execution === "immediate" ? 60_000 : 20 * 60_000,
        signal: options.signal,
        limits: HIGGSFIELD_OUTPUT_LIMITS,
        env: environment,
      });
      const result = resultFromExecutor(request, operation, executorResult, hash);
      if (!result.ok) diagnostic(dependencies, result.error.code, operation.id);
      return result;
    } catch {
      diagnostic(dependencies, "internal", operation.id);
      return failure(request, "internal", "The Higgsfield operation failed safely.", { remoteState: "unknown" }, hash);
    } finally {
      await cleanupAssets(materialized);
    }
  }

  return {
    async describe() {
      return {
        ok: true,
        value: dependencies.manifest,
        meta: {
          providerId: "higgsfield-cli",
          manifestVersion: dependencies.manifest.manifestVersion,
          operationId: "higgsfield.system.version",
          requestId: "describe",
          remoteState: "terminal",
          cancellation: "not_requested",
        },
      };
    },

    async invoke(request, options = {}) {
      let operation: ProviderOperationManifest | undefined;
      try {
        operation = operations.get(request.operationId);
      } catch {
        return failure(request, "invalid_input", "The provider request is invalid.");
      }
      if (!operation || request.manifestVersion !== dependencies.manifest.manifestVersion) {
        return failure(request, "invalid_input", "The provider operation or manifest version is invalid.");
      }
      if (options.signal?.aborted) {
        return failure(
          request,
          "cancelled",
          "The Higgsfield operation was cancelled before it started.",
          { remoteState: "not_started", cancellation: "before_start" },
        );
      }
      if (operation.policy.exposure === "prohibited") {
        return failure(request, "policy_denied", "This Higgsfield operation is prohibited by policy.");
      }
      if (operation.policy.exposure === "deferred") {
        return failure(request, "unsupported", "This Higgsfield operation is deferred in the local adapter.");
      }
      if (isProductGated(operation.id)) {
        return failure(request, "policy_denied", "This Higgsfield product operation has not been approved.");
      }
      if (operation.policy.exposure === "gated") {
        const claims = Array.isArray(request.policyContext?.claimIds) ? request.policyContext.claimIds : [];
        if (!operation.policy.requiredClaims.every((claim) => claims.includes(claim))) {
          return failure(request, "policy_denied", "The required approval claim is missing.");
        }
        if (operation.policy.sideEffect === "paid-job" && !request.policyContext?.spendGrantId) {
          return failure(request, "policy_denied", "A spend grant is required for this operation.");
        }
      }

      let hash: string | undefined;
      if (operation.idempotency === "required") {
        if (typeof request.idempotencyKey !== "string" || !IDEMPOTENCY_RE.test(request.idempotencyKey)) {
          return failure(request, "invalid_input", "A valid idempotency key is required.");
        }
        hash = hashIdempotencyKey(request.idempotencyKey);
      }

      if (!hash) return execute(request, operation, undefined, options);
      const scopeHash = createHash("sha256")
        .update(`${request.policyContext?.projectId ?? ""}\0${request.policyContext?.spendGrantId ?? ""}`, "utf8")
        .digest("hex");
      const submissionKey = `${operation.id}:${scopeHash}:${hash}`;
      const now = Date.now();
      pruneSubmissions(now);
      const existing = submissions.get(submissionKey);
      if (existing) return withRequestMeta(await existing.promise, request);
      const entry: SubmissionEntry = {
        promise: Promise.resolve(failure(request, "internal", "The Higgsfield operation failed safely.")),
        settled: false,
        expiresAt: Number.POSITIVE_INFINITY,
      };
      entry.promise = execute(request, operation, hash, options).finally(() => {
        entry.settled = true;
        entry.expiresAt = Date.now() + submissionTtlMs;
      });
      submissions.set(submissionKey, entry);
      return withRequestMeta(await entry.promise, request);
    },
  };
}
