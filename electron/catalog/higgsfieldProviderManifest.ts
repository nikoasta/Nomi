export type JsonSchema = Readonly<Record<string, unknown>>;
export type HiggsfieldOperationId = `higgsfield.${string}`;
export type ProviderExecutionMode = "immediate" | "job" | "stream";
export type ProviderExposure = "allowed" | "gated" | "deferred" | "prohibited";
export type ProviderSideEffect = "none" | "local-auth" | "account-state" | "upload" | "paid-job" | "publish-admin";
export type ProviderOperationManifest = {
  id: HiggsfieldOperationId;
  cliPath: readonly string[];
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  execution: ProviderExecutionMode;
  idempotency: "none" | "optional" | "required";
  policy: {
    exposure: ProviderExposure;
    defaultDecision: "allow" | "deny";
    requiredClaims: readonly string[];
    sideEffect: ProviderSideEffect;
    reasonCode?: string;
  };
};
export type ProviderCapabilityManifest = {
  schemaVersion: "provider-capabilities.v1";
  providerId: "higgsfield-cli";
  manifestVersion: string;
  source: { product: "higgsfield"; cliVersion: "1.1.13"; evidenceRevision: string };
  operations: readonly ProviderOperationManifest[];
};

const JSON_SCHEMA_2020_12 = "https://json-schema.org/draft/2020-12/schema";
const CLI_VERSION = "1.1.13";

type PropertySchema = Readonly<Record<string, unknown>>;
type InventoryRow = readonly [
  id: HiggsfieldOperationId,
  cliPath: readonly string[],
  execution: ProviderExecutionMode,
  exposure: ProviderExposure,
];

const stringField = (maxLength = 512): PropertySchema => ({ type: "string", maxLength });
const integerField = (maximum = 10_000): PropertySchema => ({ type: "integer", minimum: 0, maximum });
const numberField = (maximum = 1_000_000): PropertySchema => ({ type: "number", minimum: 0, maximum });
const booleanField = (): PropertySchema => ({ type: "boolean" });
const stringArrayField = (maxItems = 100): PropertySchema => ({
  type: "array",
  maxItems,
  items: stringField(),
});
const objectField = (
  properties: Readonly<Record<string, PropertySchema>>,
  required: readonly string[] = [],
): PropertySchema => ({
  type: "object",
  additionalProperties: false,
  ...(required.length ? { required } : {}),
  properties,
});
const objectArrayField = (
  properties: Readonly<Record<string, PropertySchema>>,
  required: readonly string[] = [],
  maxItems = 10_000,
): PropertySchema => ({ type: "array", maxItems, items: objectField(properties, required) });

function objectSchema(
  id: string,
  properties: Readonly<Record<string, PropertySchema>> = {},
  required: readonly string[] = [],
  title?: string,
): JsonSchema {
  return {
    $schema: JSON_SCHEMA_2020_12,
    $id: id,
    ...(title ? { title } : {}),
    type: "object",
    additionalProperties: false,
    ...(required.length ? { required } : {}),
    properties,
  };
}

function schemaId(operationId: HiggsfieldOperationId, direction: "input" | "output"): string {
  return `hf://schema/${CLI_VERSION}/${operationId.replace(/^higgsfield\./, "")}/${direction}@1`;
}

type SchemaShape = {
  properties?: Readonly<Record<string, PropertySchema>>;
  required?: readonly string[];
  title: string;
};

const cursorPage = { cursor: stringField(), size: integerField(100) };
const limitPage = { limit: integerField(100) };
const searchPage = { cursor: stringField(), size: integerField(100), search: stringField(512) };
const boundedCatalogValue: PropertySchema = {
  type: ["string", "number", "integer", "boolean", "null", "array"],
  maxLength: 65_536,
  maxItems: 100,
  items: { type: ["string", "number", "integer", "boolean", "null"], maxLength: 65_536 },
};
const installedCatalogParameterNames = [
  "ad_reference_id", "animation_action_id", "apply_mask", "aspect_ratio", "audio_references", "auto_size", "autoprompt",
  "avatar_ids", "avatars", "background_color", "background_preset_id", "background_source", "batch_size", "bitrate_mode",
  "brand_kit_id", "budget", "camera_aperture_id", "camera_focal_length_id", "camera_lens_id", "camera_model_id", "camera_style",
  "cfg_scale", "clip_aspect", "clips_num", "color_grading", "colors", "creativity", "custom_reference_id", "denoise",
  "detection_threshold", "duration", "enable_animation", "enable_pbr", "enable_rigging", "enable_safety_checker", "end_image",
  "enhance_prompt", "enhancement", "enhancer", "export_textured_glb", "face_enhancement", "face_enhancement_creativity",
  "face_enhancement_strength", "face_limit", "folder_id", "format", "fps", "frame_count", "frame_interpolation", "frame_rate",
  "frame_size", "frames_count", "generate_audio", "genre", "geometry_quality", "height", "height_meters", "hook_id",
  "image_references", "image_url", "input_audio", "input_height", "input_images", "input_video", "input_video_size", "input_width",
  "is_humanoid", "items", "kind", "kling_element_ids", "light_scheme", "loudness_rate", "max_height", "medias", "mode",
  "model", "model_type", "model_url", "model_version", "multi_prompt", "multi_shot_mode", "multi_shots", "name",
  "negative_prompt", "outfit_preset_ids", "output_height", "output_width", "pbr", "pitch_rate", "pose_mode", "pose_preset_id",
  "preset", "preset_id", "product_ids", "prompt", "prompt_language", "quality", "reasoning_effort", "ref_image", "remove_bg",
  "resolution", "rigging_height_meters", "sample_rate", "seed", "segment_seconds", "setting_id", "sharpen", "should_remesh",
  "should_texture", "slow_motion", "sound", "specific_mode", "speech_rate", "speedramp", "start_image", "storyboard_id",
  "style_id", "style_prompt", "subtitle_case", "subtitle_font", "subtitle_highlight_hex", "subtitle_position", "subtitles",
  "symmetry_mode", "sync_mode", "system_prompt", "target_language", "target_polycount", "texture", "texture_image_url",
  "texture_prompt", "texture_quality", "thinking", "topology", "track_face_crop", "urls", "user_outfit_ids", "user_prompt",
  "variant", "video", "video_references", "video_tier", "voice", "voice_id", "voice_type", "web_product_ids",
  "web_product_type", "width", "with_sound",
] as const;
const installedCatalogParameterProperties = Object.fromEntries(
  installedCatalogParameterNames.map((name) => [name, boundedCatalogValue]),
) as Readonly<Record<string, PropertySchema>>;
const catalogParameterProperties: Readonly<Record<string, PropertySchema>> = {
  ...installedCatalogParameterProperties,
  prompt: stringField(65_536),
  negative_prompt: stringField(65_536),
  duration: { type: ["number", "string"], maxLength: 64 },
  aspect_ratio: stringField(64),
  resolution: stringField(64),
  quality: stringField(64),
  seed: { type: ["integer", "null"], minimum: 0, maximum: 2_147_483_647 },
  batch_size: integerField(100),
  script: stringField(65_536),
  format: stringField(64),
  voice_id: stringField(),
  should_texture: booleanField(),
  enable_animation: booleanField(),
  image_references: stringArrayField(20),
  video_references: stringArrayField(20),
  audio_references: stringArrayField(20),
  start_image: stringField(4_096),
  end_image: stringField(4_096),
  texture_image_url: stringField(4_096),
  medias: stringArrayField(20),
  bitrate_mode: stringField(64),
  generate_audio: booleanField(),
  genre: stringField(128),
  mode: stringField(128),
};
const catalogAssetReferences = (maxItems = 100): PropertySchema => objectArrayField(
  { assetId: stringField(), parameter: stringField(128) },
  ["assetId", "parameter"],
  maxItems,
);
const catalogGenerationProperties = {
  targetKey: stringField(),
  parameters: {
    ...objectField(catalogParameterProperties),
    description: "Frozen CLI 1.1.13 catalog parameter surface; the selected target snapshot applies the narrower schema.",
  },
  assets: catalogAssetReferences(),
};
const catalogCostProperties = {
  ...catalogGenerationProperties,
  assets: catalogAssetReferences(0),
};

function inputShape(operationId: HiggsfieldOperationId): SchemaShape {
  const exact: Partial<Record<HiggsfieldOperationId, SchemaShape>> = {
    "higgsfield.system.version": { title: "Empty" },
    "higgsfield.auth.login": { title: "AuthLoginInput", properties: { port: integerField(65_535) } },
    "higgsfield.auth.logout": { title: "Empty" },
    "higgsfield.auth.token": { title: "Empty" },
    "higgsfield.account.status": { title: "Empty" },
    "higgsfield.account.transactions": { title: "CursorPageInput", properties: cursorPage },
    "higgsfield.workspace.list": { title: "Empty" },
    "higgsfield.workspace.set": { title: "WorkspaceIdInput", properties: { workspaceId: stringField() }, required: ["workspaceId"] },
    "higgsfield.workspace.status": { title: "Empty" },
    "higgsfield.workspace.unset": { title: "Empty" },
    "higgsfield.model.list": { title: "ModelListInput", properties: { kind: { type: "string", maxLength: 16, enum: ["image", "video", "audio", "text"] } } },
    "higgsfield.model.get": { title: "ModelKeyInput", properties: { modelKey: stringField() }, required: ["modelKey"] },
    "higgsfield.workflow.list": { title: "Empty" },
    "higgsfield.workflow.get": { title: "WorkflowKeyInput", properties: { workflowKey: stringField() }, required: ["workflowKey"] },
    "higgsfield.voices.list": { title: "CursorPageInput", properties: cursorPage },
    "higgsfield.voices.get": { title: "VoiceIdInput", properties: { voiceId: stringField() }, required: ["voiceId"] },
    "higgsfield.upload.list": { title: "UploadListInput", properties: { ...cursorPage, mediaKind: { type: "string", maxLength: 16, enum: ["image", "video", "audio"] } } },
    "higgsfield.upload.create": { title: "ProjectAssetInput", properties: { assetId: stringField(), mediaKind: { type: "string", maxLength: 16, enum: ["image", "video", "audio"] } }, required: ["assetId"] },
    "higgsfield.generate.cost": { title: "CatalogGenerationInput", properties: catalogCostProperties, required: ["targetKey", "parameters", "assets"] },
    "higgsfield.generate.create": { title: "CatalogModelGenerationInput", properties: catalogGenerationProperties, required: ["targetKey", "parameters", "assets"] },
    "higgsfield.generate.workflow": { title: "CatalogWorkflowGenerationInput", properties: catalogGenerationProperties, required: ["targetKey", "parameters", "assets"] },
    "higgsfield.generate.get": { title: "GenerationIdInput", properties: { generationId: stringField() }, required: ["generationId"] },
    "higgsfield.generate.list": { title: "GenerationListInput", properties: { size: integerField(100), kind: { type: "string", maxLength: 16, enum: ["image", "video", "audio", "text"] } } },
    "higgsfield.generate.wait": { title: "GenerationWaitInput", properties: { generationId: stringField(), timeoutSeconds: integerField(7_200), intervalSeconds: integerField(300) }, required: ["generationId"] },
    "higgsfield.soul-id.create": { title: "SoulCreateInput", properties: { name: stringField(), assetIds: stringArrayField(20), model: { type: "string", maxLength: 32, enum: ["soul-2", "soul-cinematic"] } }, required: ["name", "assetIds", "model"] },
    "higgsfield.soul-id.get": { title: "SoulIdInput", properties: { soulId: stringField() }, required: ["soulId"] },
    "higgsfield.soul-id.list": { title: "SoulListInput", properties: { size: integerField(100), model: { type: "string", maxLength: 32, enum: ["soul-2", "soul-cinematic"] } } },
    "higgsfield.soul-id.wait": { title: "SoulWaitInput", properties: { soulId: stringField(), timeoutSeconds: integerField(7_200), intervalSeconds: integerField(300) }, required: ["soulId"] },
    "higgsfield.marketing-studio.ad-formats.list": { title: "AdFormatListInput", properties: { type: stringField(64) } },
    "higgsfield.marketing-studio.ad-references.create": { title: "AdReferenceCreateInput", properties: { videoInputId: stringField(), jobId: stringField(), avatarId: stringField(), productId: stringField() } },
    "higgsfield.marketing-studio.ad-references.get": { title: "AdReferenceIdInput", properties: { adReferenceId: stringField() }, required: ["adReferenceId"] },
    "higgsfield.marketing-studio.ad-references.list": { title: "CursorPageInput", properties: cursorPage },
    "higgsfield.marketing-studio.avatars.create": { title: "MarketingAvatarCreateInput", properties: { name: stringField(), assetId: stringField(), pinned: booleanField() }, required: ["name"] },
    "higgsfield.marketing-studio.avatars.list": { title: "PageSizeInput", properties: { size: integerField(100) } },
    "higgsfield.marketing-studio.brand-kits.fetch": { title: "BrandKitFetchInput", properties: { url: stringField(4_096), wait: booleanField(), timeoutSeconds: integerField(7_200) }, required: ["url"] },
    "higgsfield.marketing-studio.brand-kits.get": { title: "BrandKitIdInput", properties: { brandKitId: stringField() }, required: ["brandKitId"] },
    "higgsfield.marketing-studio.brand-kits.list": { title: "CursorPageInput", properties: cursorPage },
    "higgsfield.marketing-studio.dtc-ads.generate": { title: "DtcAdGenerationInput", properties: { prompt: stringField(65_536), formatId: stringField(), aspectRatio: stringField(64), avatarIds: stringArrayField(1), brandKitId: stringField(), batchSize: integerField(20), mediaIds: stringArrayField(14), productIds: stringArrayField(1), quality: stringField(32), resolution: stringField(32), costOnly: booleanField() }, required: ["prompt", "formatId"] },
    "higgsfield.marketing-studio.hooks.list": { title: "SearchPageInput", properties: searchPage },
    "higgsfield.marketing-studio.products.create": { title: "MarketingProductCreateInput", properties: { title: stringField(), description: stringField(8_192), assetIds: stringArrayField(20) }, required: ["title", "assetIds"] },
    "higgsfield.marketing-studio.products.fetch": { title: "UrlFetchInput", properties: { url: stringField(4_096), wait: booleanField(), timeoutSeconds: integerField(7_200) }, required: ["url"] },
    "higgsfield.marketing-studio.products.list": { title: "LimitInput", properties: limitPage },
    "higgsfield.marketing-studio.settings.list": { title: "SearchPageInput", properties: searchPage },
    "higgsfield.marketing-studio.webproducts.create": { title: "WebProductCreateInput", properties: { url: stringField(4_096), title: stringField(), description: stringField(8_192) }, required: ["url"] },
    "higgsfield.marketing-studio.webproducts.fetch": { title: "UrlFetchInput", properties: { url: stringField(4_096), wait: booleanField(), timeoutSeconds: integerField(7_200) }, required: ["url"] },
    "higgsfield.marketing-studio.webproducts.list": { title: "LimitInput", properties: limitPage },
    "higgsfield.product-photoshoot.create": { title: "ProductPhotoshootInput", properties: { mode: stringField(128), prompt: stringField(65_536), assetIds: stringArrayField(20), aspectRatio: stringField(64), brandContext: stringField(16_384), productContext: stringField(16_384), count: integerField(10), enhanceOnly: booleanField() }, required: ["mode", "prompt"] },
    "higgsfield.marketplace-cards.create": { title: "MarketplaceCardsInput", properties: { scope: { type: "string", maxLength: 32, enum: ["main", "product-images", "aplus", "full-set"] }, prompt: stringField(65_536), assetIds: stringArrayField(20), assetTypes: stringArrayField(20), brandContext: stringField(16_384), category: stringField(), mainJobId: stringField(), productContext: stringField(16_384), productUrl: stringField(4_096), visualStyle: stringField(16_384), enhanceOnly: booleanField() }, required: ["scope", "prompt"] },
    "higgsfield.website.list": { title: "Empty" },
    "higgsfield.website.status": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.create": { title: "WebsiteCreateInput", properties: { type: { type: "string", maxLength: 16, enum: ["website", "app"] }, subdomain: stringField(253) }, required: ["type"] },
    "higgsfield.website.deploy": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.contest": { title: "WebsiteContestInput", properties: { websiteId: stringField(), urls: stringArrayField(10) }, required: ["websiteId", "urls"] },
    "higgsfield.website.publish": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.rename": { title: "WebsiteRenameInput", properties: { websiteId: stringField(), subdomain: stringField(253) }, required: ["websiteId", "subdomain"] },
    "higgsfield.website.repo-access": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.db.tables": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.db.schema": { title: "WebsiteTableInput", properties: { websiteId: stringField(), table: stringField() }, required: ["websiteId", "table"] },
    "higgsfield.website.db.rows": { title: "WebsiteRowsInput", properties: { websiteId: stringField(), table: stringField(), filters: stringArrayField(100), limit: integerField(1_000), offset: integerField(1_000_000), orderBy: stringField(), orderDir: { type: "string", maxLength: 4, enum: ["asc", "desc"] } }, required: ["websiteId", "table"] },
    "higgsfield.website.db.query": { title: "WebsiteQueryInput", properties: { websiteId: stringField(), sql: stringField(65_536) }, required: ["websiteId", "sql"] },
    "higgsfield.website.secrets.list": { title: "WebsiteIdInput", properties: { websiteId: stringField() }, required: ["websiteId"] },
    "higgsfield.website.secrets.set": { title: "WebsiteSecretSetInput", properties: { websiteId: stringField(), name: stringField(), value: stringField(8_192) }, required: ["websiteId", "name", "value"] },
    "higgsfield.website.secrets.delete": { title: "WebsiteSecretDeleteInput", properties: { websiteId: stringField(), name: stringField() }, required: ["websiteId", "name"] },
    "higgsfield.game.deploy": { title: "GameDeployInput", properties: { zipAssetId: stringField(), title: stringField(), description: stringField(8_192), faviconUrl: stringField(4_096), gameId: stringField(), thumbnailUrl: stringField(4_096) }, required: ["zipAssetId", "title", "description"] },
    "higgsfield.game.publish": { title: "GamePublishInput", properties: { gameId: stringField(), coverUrl: stringField(4_096), description: stringField(8_192), logoUrl: stringField(4_096), name: stringField() }, required: ["gameId"] },
  };
  const found = exact[operationId];
  if (found) return found;
  return { title: "Never" };
}

const statusFields = { id: stringField(), status: stringField(64) };
const generationFields = {
  ...statusFields,
  assets: stringArrayField(100),
  output_url: stringField(4_096),
  result_url: stringField(4_096),
  min_result_url: stringField(4_096),
};
const pageFields = (item: Readonly<Record<string, PropertySchema>>): Readonly<Record<string, PropertySchema>> => ({
  items: objectArrayField(item), cursor: stringField(), total: integerField(10_000), total_count: integerField(10_000), has_more: booleanField(),
});

function outputShape(operationId: HiggsfieldOperationId): SchemaShape {
  const modelSummary = { job_type: stringField(), display_name: stringField(), type: stringField(64) };
  const workspace = { id: stringField(), name: stringField(), plan_type: stringField(128), credits: numberField(), is_selected: booleanField(), user_role: stringField(128) };
  const voice = { id: stringField(), name: stringField(), status: stringField(64), category: stringField(128), voice_type: stringField(128), created_at: stringField(128) };
  const namedStatus = { ...statusFields, name: stringField(), created_at: stringField(128) };
  const exact: Partial<Record<HiggsfieldOperationId, SchemaShape>> = {
    "higgsfield.system.version": { title: "VersionInfo", properties: { version: stringField(64) } },
    "higgsfield.auth.login": { title: "RedactedAuthStatus", properties: { authenticated: booleanField(), name: stringField() } },
    "higgsfield.auth.logout": { title: "RedactedAuthStatus", properties: { authenticated: booleanField(), name: stringField() } },
    "higgsfield.auth.token": { title: "Never" },
    "higgsfield.account.status": { title: "RedactedAccountStatus", properties: { subscription_plan_type: stringField(128), credits: { type: ["number", "null"] } } },
    "higgsfield.account.transactions": { title: "CreditTransactionPage", properties: pageFields({ action: stringField(), created_at: stringField(128), credits: numberField(), display_name: stringField() }) },
    "higgsfield.workspace.list": { title: "WorkspaceSummaryList", properties: { items: objectArrayField(workspace) } },
    "higgsfield.workspace.set": { title: "WorkspaceStatus", properties: workspace },
    "higgsfield.workspace.status": { title: "WorkspaceStatus", properties: workspace },
    "higgsfield.workspace.unset": { title: "WorkspaceStatus", properties: workspace },
    "higgsfield.model.list": { title: "ModelSummaryList", properties: { items: objectArrayField(modelSummary) } },
    "higgsfield.model.get": { title: "ModelCapability", properties: { ...modelSummary, params: objectArrayField({ name: stringField(128), type: stringField(64), required: booleanField(), default: { type: ["string", "number", "boolean", "null"], maxLength: 65_536 }, enum: stringArrayField(1_000) }) } },
    "higgsfield.workflow.list": { title: "WorkflowSummaryList", properties: { items: objectArrayField(modelSummary) } },
    "higgsfield.workflow.get": { title: "WorkflowCapability", properties: { ...modelSummary, params: objectArrayField({ name: stringField(128), type: stringField(64), required: booleanField(), default: { type: ["string", "number", "boolean", "null"], maxLength: 65_536 }, enum: stringArrayField(1_000) }), cost_params: objectArrayField({ name: stringField(128), type: stringField(64), required: booleanField() }) } },
    "higgsfield.voices.list": { title: "VoicePage", properties: pageFields(voice) },
    "higgsfield.voices.get": { title: "Voice", properties: voice },
    "higgsfield.upload.list": { title: "UploadPage", properties: pageFields({ id: stringField(), type: stringField(64), url: stringField(4_096), created_at: stringField(128) }) },
    "higgsfield.upload.create": { title: "UploadReceipt", properties: { id: stringField(), type: stringField(64), url: stringField(4_096), status: stringField(64) } },
    "higgsfield.generate.cost": { title: "CostEstimate", properties: { credits: numberField(), currency: stringField(32), amount: numberField() } },
    "higgsfield.generate.create": { title: "GenerationReceipt", properties: generationFields },
    "higgsfield.generate.workflow": { title: "GenerationReceipt", properties: generationFields },
    "higgsfield.generate.get": { title: "GenerationStatus", properties: generationFields },
    "higgsfield.generate.list": { title: "GenerationPage", properties: { items: objectArrayField({ ...generationFields, job_type: stringField(), display_name: stringField(), created_at: stringField(128) }) } },
    "higgsfield.generate.wait": { title: "GenerationStatus", properties: generationFields },
    "higgsfield.soul-id.create": { title: "SoulReceipt", properties: namedStatus },
    "higgsfield.soul-id.get": { title: "SoulStatus", properties: namedStatus },
    "higgsfield.soul-id.list": { title: "SoulPage", properties: { items: objectArrayField(namedStatus) } },
    "higgsfield.soul-id.wait": { title: "SoulStatus", properties: namedStatus },
    "higgsfield.marketing-studio.ad-formats.list": { title: "AdFormatList", properties: { items: objectArrayField({ id: stringField(), name: stringField(), type: stringField(64), priority: integerField(10_000), media: stringArrayField(100) }) } },
    "higgsfield.marketing-studio.ad-references.create": { title: "AdReferenceReceipt", properties: statusFields },
    "higgsfield.marketing-studio.ad-references.get": { title: "AdReference", properties: { ...namedStatus, video_url: stringField(4_096), thumbnail_url: stringField(4_096) } },
    "higgsfield.marketing-studio.ad-references.list": { title: "AdReferencePage", properties: pageFields({ ...namedStatus, video_url: stringField(4_096), thumbnail_url: stringField(4_096) }) },
    "higgsfield.marketing-studio.avatars.create": { title: "MarketingAvatarReceipt", properties: statusFields },
    "higgsfield.marketing-studio.avatars.list": { title: "MarketingAvatarPage", properties: { items: objectArrayField({ id: stringField(), name: stringField(), type: stringField(64), gender: stringField(64), preview_url: stringField(4_096) }) } },
    "higgsfield.marketing-studio.brand-kits.fetch": { title: "BrandKitReceipt", properties: statusFields },
    "higgsfield.marketing-studio.brand-kits.get": { title: "BrandKit", properties: namedStatus },
    "higgsfield.marketing-studio.brand-kits.list": { title: "BrandKitPage", properties: pageFields(namedStatus) },
    "higgsfield.marketing-studio.dtc-ads.generate": { title: "GenerationReceipt", properties: generationFields },
    "higgsfield.marketing-studio.hooks.list": { title: "HookPage", properties: pageFields({ ...namedStatus, prompt: stringField(65_536), source: stringField(128), type: stringField(64), thumbnail_url: stringField(4_096), video_url: stringField(4_096), is_pinned: booleanField(), job_id: stringField(), job_status: stringField(64) }) },
    "higgsfield.marketing-studio.products.create": { title: "MarketingProductReceipt", properties: statusFields },
    "higgsfield.marketing-studio.products.fetch": { title: "MarketingProductReceipt", properties: statusFields },
    "higgsfield.marketing-studio.products.list": { title: "MarketingProductPage", properties: { items: objectArrayField({ ...namedStatus, title: stringField(), description: stringField(8_192), image_urls: stringArrayField(20) }) } },
    "higgsfield.marketing-studio.settings.list": { title: "MarketingSettingPage", properties: pageFields({ ...namedStatus, prompt: stringField(65_536), source: stringField(128), type: stringField(64), thumbnail_url: stringField(4_096), video_url: stringField(4_096), is_pinned: booleanField(), job_id: stringField(), job_status: stringField(64) }) },
    "higgsfield.marketing-studio.webproducts.create": { title: "WebProductReceipt", properties: statusFields },
    "higgsfield.marketing-studio.webproducts.fetch": { title: "WebProductReceipt", properties: statusFields },
    "higgsfield.marketing-studio.webproducts.list": { title: "WebProductPage", properties: { items: objectArrayField({ ...namedStatus, title: stringField(), description: stringField(8_192), url: stringField(4_096) }) } },
    "higgsfield.product-photoshoot.create": { title: "ProductPhotoshootReceipt", properties: { ...statusFields, assets: stringArrayField(100), enhanced_prompts: stringArrayField(100) } },
    "higgsfield.marketplace-cards.create": { title: "MarketplaceCardsReceipt", properties: { ...statusFields, assets: stringArrayField(100), enhanced_prompts: stringArrayField(100) } },
    "higgsfield.website.list": { title: "WebsiteSummaryList", properties: { items: objectArrayField({ id: stringField(), name: stringField(), status: stringField(64), url: stringField(4_096) }) } },
    "higgsfield.website.status": { title: "WebsiteStatus", properties: { id: stringField(), name: stringField(), status: stringField(64), url: stringField(4_096) } },
  };
  return exact[operationId] ?? { title: "Never" };
}

const INVENTORY: readonly InventoryRow[] = [
  ["higgsfield.system.version", ["version"], "immediate", "allowed"],
  ["higgsfield.auth.login", ["auth", "login"], "stream", "gated"],
  ["higgsfield.auth.logout", ["auth", "logout"], "immediate", "gated"],
  ["higgsfield.auth.token", ["auth", "token"], "immediate", "prohibited"],
  ["higgsfield.account.status", ["account", "status"], "immediate", "allowed"],
  ["higgsfield.account.transactions", ["account", "transactions"], "immediate", "deferred"],
  ["higgsfield.workspace.list", ["workspace", "list"], "immediate", "deferred"],
  ["higgsfield.workspace.set", ["workspace", "set"], "immediate", "gated"],
  ["higgsfield.workspace.status", ["workspace", "status"], "immediate", "allowed"],
  ["higgsfield.workspace.unset", ["workspace", "unset"], "immediate", "gated"],
  ["higgsfield.model.list", ["model", "list"], "immediate", "allowed"],
  ["higgsfield.model.get", ["model", "get"], "immediate", "allowed"],
  ["higgsfield.workflow.list", ["workflow", "list"], "immediate", "allowed"],
  ["higgsfield.workflow.get", ["workflow", "get"], "immediate", "allowed"],
  ["higgsfield.voices.list", ["voices", "list"], "immediate", "allowed"],
  ["higgsfield.voices.get", ["voices", "get"], "immediate", "allowed"],
  ["higgsfield.upload.list", ["upload", "list"], "immediate", "deferred"],
  ["higgsfield.upload.create", ["upload", "create"], "job", "gated"],
  ["higgsfield.generate.cost", ["generate", "cost"], "immediate", "gated"],
  ["higgsfield.generate.create", ["generate", "create"], "job", "gated"],
  ["higgsfield.generate.workflow", ["generate", "workflow"], "job", "gated"],
  ["higgsfield.generate.get", ["generate", "get"], "immediate", "gated"],
  ["higgsfield.generate.list", ["generate", "list"], "immediate", "deferred"],
  ["higgsfield.generate.wait", ["generate", "wait"], "stream", "gated"],
  ["higgsfield.soul-id.create", ["soul-id", "create"], "job", "gated"],
  ["higgsfield.soul-id.get", ["soul-id", "get"], "immediate", "gated"],
  ["higgsfield.soul-id.list", ["soul-id", "list"], "immediate", "gated"],
  ["higgsfield.soul-id.wait", ["soul-id", "wait"], "stream", "gated"],
  ["higgsfield.marketing-studio.ad-formats.list", ["marketing-studio", "ad-formats", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.ad-references.create", ["marketing-studio", "ad-references", "create"], "job", "gated"],
  ["higgsfield.marketing-studio.ad-references.get", ["marketing-studio", "ad-references", "get"], "immediate", "gated"],
  ["higgsfield.marketing-studio.ad-references.list", ["marketing-studio", "ad-references", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.avatars.create", ["marketing-studio", "avatars", "create"], "job", "gated"],
  ["higgsfield.marketing-studio.avatars.list", ["marketing-studio", "avatars", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.brand-kits.fetch", ["marketing-studio", "brand-kits", "fetch"], "job", "gated"],
  ["higgsfield.marketing-studio.brand-kits.get", ["marketing-studio", "brand-kits", "get"], "immediate", "gated"],
  ["higgsfield.marketing-studio.brand-kits.list", ["marketing-studio", "brand-kits", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.dtc-ads.generate", ["marketing-studio", "dtc-ads", "generate"], "job", "gated"],
  ["higgsfield.marketing-studio.hooks.list", ["marketing-studio", "hooks", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.products.create", ["marketing-studio", "products", "create"], "job", "gated"],
  ["higgsfield.marketing-studio.products.fetch", ["marketing-studio", "products", "fetch"], "job", "gated"],
  ["higgsfield.marketing-studio.products.list", ["marketing-studio", "products", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.settings.list", ["marketing-studio", "settings", "list"], "immediate", "gated"],
  ["higgsfield.marketing-studio.webproducts.create", ["marketing-studio", "webproducts", "create"], "job", "gated"],
  ["higgsfield.marketing-studio.webproducts.fetch", ["marketing-studio", "webproducts", "fetch"], "job", "gated"],
  ["higgsfield.marketing-studio.webproducts.list", ["marketing-studio", "webproducts", "list"], "immediate", "gated"],
  ["higgsfield.product-photoshoot.create", ["product-photoshoot", "create"], "job", "gated"],
  ["higgsfield.marketplace-cards.create", ["marketplace-cards", "create"], "job", "gated"],
  ["higgsfield.website.list", ["website", "list"], "immediate", "deferred"],
  ["higgsfield.website.status", ["website", "status"], "immediate", "deferred"],
  ["higgsfield.website.create", ["website", "create"], "job", "prohibited"],
  ["higgsfield.website.deploy", ["website", "deploy"], "job", "prohibited"],
  ["higgsfield.website.contest", ["website", "contest"], "job", "prohibited"],
  ["higgsfield.website.publish", ["website", "publish"], "job", "prohibited"],
  ["higgsfield.website.rename", ["website", "rename"], "job", "prohibited"],
  ["higgsfield.website.repo-access", ["website", "repo-access"], "immediate", "prohibited"],
  ["higgsfield.website.db.tables", ["website", "db", "tables"], "immediate", "prohibited"],
  ["higgsfield.website.db.schema", ["website", "db", "schema"], "immediate", "prohibited"],
  ["higgsfield.website.db.rows", ["website", "db", "rows"], "immediate", "prohibited"],
  ["higgsfield.website.db.query", ["website", "db", "query"], "immediate", "prohibited"],
  ["higgsfield.website.secrets.list", ["website", "secrets", "list"], "immediate", "prohibited"],
  ["higgsfield.website.secrets.set", ["website", "secrets", "set"], "immediate", "prohibited"],
  ["higgsfield.website.secrets.delete", ["website", "secrets", "delete"], "immediate", "prohibited"],
  ["higgsfield.game.deploy", ["game", "deploy"], "job", "prohibited"],
  ["higgsfield.game.publish", ["game", "publish"], "job", "prohibited"],
];

const REQUIRED_IDEMPOTENCY = new Set<HiggsfieldOperationId>([
  "higgsfield.upload.create",
  "higgsfield.generate.create",
  "higgsfield.generate.workflow",
  "higgsfield.soul-id.create",
  "higgsfield.marketing-studio.ad-references.create",
  "higgsfield.marketing-studio.avatars.create",
  "higgsfield.marketing-studio.brand-kits.fetch",
  "higgsfield.marketing-studio.dtc-ads.generate",
  "higgsfield.marketing-studio.products.create",
  "higgsfield.marketing-studio.products.fetch",
  "higgsfield.marketing-studio.webproducts.create",
  "higgsfield.marketing-studio.webproducts.fetch",
  "higgsfield.product-photoshoot.create",
  "higgsfield.marketplace-cards.create",
]);

const REQUIRED_CLAIMS: Readonly<Record<string, readonly string[]>> = {
  "higgsfield.auth.login": ["desktop.setup.interactive"],
  "higgsfield.auth.logout": ["desktop.setup.interactive"],
  "higgsfield.workspace.set": ["workspace.select"],
  "higgsfield.workspace.unset": ["workspace.select"],
  "higgsfield.upload.create": ["asset.upload"],
  "higgsfield.generate.cost": ["generation.estimate"],
  "higgsfield.generate.create": ["generation.submit"],
  "higgsfield.generate.workflow": ["generation.submit"],
  "higgsfield.generate.get": ["generation.read"],
  "higgsfield.generate.wait": ["generation.read"],
  "higgsfield.soul-id.create": ["soul.manage"],
  "higgsfield.soul-id.get": ["soul.read"],
  "higgsfield.soul-id.list": ["soul.read"],
  "higgsfield.soul-id.wait": ["soul.read"],
  "higgsfield.marketing-studio.ad-formats.list": ["marketing.read"],
  "higgsfield.marketing-studio.ad-references.create": ["marketing.manage"],
  "higgsfield.marketing-studio.ad-references.get": ["marketing.read"],
  "higgsfield.marketing-studio.ad-references.list": ["marketing.read"],
  "higgsfield.marketing-studio.avatars.create": ["marketing.manage"],
  "higgsfield.marketing-studio.avatars.list": ["marketing.read"],
  "higgsfield.marketing-studio.brand-kits.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.brand-kits.get": ["marketing.read"],
  "higgsfield.marketing-studio.brand-kits.list": ["marketing.read"],
  "higgsfield.marketing-studio.dtc-ads.generate": ["marketing.generate"],
  "higgsfield.marketing-studio.hooks.list": ["marketing.read"],
  "higgsfield.marketing-studio.products.create": ["marketing.manage"],
  "higgsfield.marketing-studio.products.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.products.list": ["marketing.read"],
  "higgsfield.marketing-studio.settings.list": ["marketing.read"],
  "higgsfield.marketing-studio.webproducts.create": ["marketing.manage"],
  "higgsfield.marketing-studio.webproducts.fetch": ["marketing.manage"],
  "higgsfield.marketing-studio.webproducts.list": ["marketing.read"],
  "higgsfield.product-photoshoot.create": ["product-pipeline.generate"],
  "higgsfield.marketplace-cards.create": ["product-pipeline.generate"],
};

function sideEffectFor(id: HiggsfieldOperationId, exposure: ProviderExposure): ProviderSideEffect {
  if (id === "higgsfield.auth.login" || id === "higgsfield.auth.logout") return "local-auth";
  if (id === "higgsfield.workspace.set" || id === "higgsfield.workspace.unset") return "account-state";
  if (id === "higgsfield.upload.create") return "upload";
  if (
    id === "higgsfield.generate.create" ||
    id === "higgsfield.generate.workflow" ||
    id.startsWith("higgsfield.soul-id.") ||
    id.startsWith("higgsfield.marketing-studio.") ||
    id.startsWith("higgsfield.product-photoshoot.") ||
    id.startsWith("higgsfield.marketplace-cards.")
  ) {
    return id.endsWith(".create") || id.endsWith(".fetch") || id.endsWith(".generate") ? "paid-job" : "none";
  }
  if (exposure === "prohibited") return "publish-admin";
  return "none";
}

function operationFromRow([id, cliPath, execution, exposure]: InventoryRow): ProviderOperationManifest {
  const input = inputShape(id);
  const output = outputShape(id);
  const outputProperties = output.properties ?? {};
  const outputRequired = output.required ?? (() => {
    for (const candidate of ["version", "authenticated", "items", "id", "job_type", "credits"]) {
      if (candidate in outputProperties) return [candidate];
    }
    const first = Object.keys(outputProperties)[0];
    return first ? [first] : [];
  })();
  return {
    id,
    cliPath,
    inputSchema: objectSchema(schemaId(id, "input"), input.properties, input.required, input.title),
    outputSchema: objectSchema(schemaId(id, "output"), outputProperties, outputRequired, output.title),
    execution,
    idempotency: REQUIRED_IDEMPOTENCY.has(id) ? "required" : "none",
    policy: {
      exposure,
      defaultDecision: exposure === "allowed" ? "allow" : "deny",
      requiredClaims: REQUIRED_CLAIMS[id] ?? [],
      sideEffect: sideEffectFor(id, exposure),
      ...(exposure === "prohibited" ? { reasonCode: `policy.${id.replace(/^higgsfield\./, "")}.prohibited` } : {}),
    },
  };
}

export const HIGGSFIELD_PROVIDER_MANIFEST: ProviderCapabilityManifest = {
  schemaVersion: "provider-capabilities.v1",
  providerId: "higgsfield-cli",
  manifestVersion: "higgsfield-cli-1.1.13@5",
  source: {
    product: "higgsfield",
    cliVersion: CLI_VERSION,
    evidenceRevision: "11bfed2733870848f3489335c1bf3d91961ccd4a",
  },
  operations: INVENTORY.map(operationFromRow),
};

const OPERATIONS_BY_ID = new Map(HIGGSFIELD_PROVIDER_MANIFEST.operations.map((operation) => [operation.id, operation]));

export function getHiggsfieldOperation(operationId: string): ProviderOperationManifest | undefined {
  return OPERATIONS_BY_ID.get(operationId as HiggsfieldOperationId);
}
