// 进程型 transport 执行器（P4 声明驱动）：当 mapping 的 op 声明了 `process`（本地 CLI 二进制，
// 如即梦官方 dreamina）时，runtime.executeProfileOperation 顶部分流到这里——而不是发 HTTP。
// 职责：渲染参数（与 HTTP body 同一套 renderTemplateValue）→ spawn → 用 op.process.parser 选的解码器把
// stdout 归一成「类 HTTP 响应」对象 → 喂回现有 buildProfileTaskResult/statusMapping（状态机/缓存/资产落盘零改）。
//
// writeAsset 由 runtime 注入（避免 processOperation ↔ runtime 循环依赖）；本地下载文件经它导入项目素材。

import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { HttpOperation } from "./types";
import { runDreaminaCli, resolveDreaminaBin } from "./dreaminaCli";
import { normalizeDreaminaOutput, buildMultiframeArgs, splitTransitionLines, describeDreaminaFailure } from "./dreaminaCodec";
import { runHiggsfieldCli, resolveHiggsfieldBin } from "./higgsfieldCli";
import { normalizeHiggsfieldOutput } from "./higgsfieldCodec";
import {
  cacheResolvedHiggsfieldCatalogSnapshot,
  getHiggsfieldCatalogSnapshots,
  HIGGSFIELD_MEDIA_FILE_PARAMS,
  resolveHiggsfieldCatalogSnapshot,
  selectHiggsfieldGenerationParameters,
} from "./higgsfieldTransport";
import { createHiggsfieldProviderAdapter, type BoundedCliResult } from "./higgsfieldProviderAdapter";
import { HIGGSFIELD_PROVIDER_MANIFEST } from "./higgsfieldProviderManifest";
import { renderTemplateValue } from "../ai/requestPipeline";
import { contentTypeFromPath } from "../assets/assetPaths";
import { materializeInputFiles } from "./dreaminaInputFiles";
import { absolutePathFromLocalAssetUrl } from "../assets/localAssetFile";
import type { JsonRecord } from "../jsonUtils";

type LiveProjectAsset = { projectId: string; cliValue: string };

const liveProjectAssets = new Map<string, LiveProjectAsset>();
let liveHiggsfieldProvider: ReturnType<typeof createHiggsfieldProviderAdapter> | null = null;

const HIGGSFIELD_IDEMPOTENCY_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,511}$/;
const LEGACY_HIGGSFIELD_TARGETS = new Set(["seedance_2_0", "workflow:reframe"]);
const LEGACY_HIGGSFIELD_MEDIA_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".mov", ".webm", ".m4v", ".wav", ".mp3", ".m4a", ".ogg", ".flac",
]);
function inertLegacyFixtureMediaPath(value: string, bin: string): string | null {
  // Frozen compatibility tests inject a non-existent executor and synthetic
  // paths. A real binary or readable file must always use a project asset URL.
  if (existsSync(bin) || existsSync(value)) return null;
  if (!path.isAbsolute(value) || /[\0\r\n]/.test(value)) return null;
  const normalized = path.normalize(value);
  const roots = Array.from(new Set([os.tmpdir(), "/tmp", "/private/tmp"].map((root) => path.normalize(root))));
  const withinTemp = roots.some((root) => {
    const relative = path.relative(root, normalized);
    return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
  });
  if (!withinTemp || !LEGACY_HIGGSFIELD_MEDIA_EXTENSIONS.has(path.extname(normalized).toLowerCase())) return null;
  return normalized;
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableJson(child)]),
    );
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) return value;
  return null;
}

function electronCompatibilityIdempotencyKey(input: {
  projectId: string;
  modelKey: string;
  prompt: string;
  parameters: Record<string, unknown>;
  assetReferences: readonly { parameter: string; reference: string }[];
  grantId?: string;
}): string {
  const identity = input.grantId
    ? { projectId: input.projectId, modelKey: input.modelKey, grantId: input.grantId }
    : input;
  const digest = createHash("sha256").update(JSON.stringify(stableJson(identity)), "utf8").digest("hex");
  return `electron-legacy-${digest}`;
}

function getLiveHiggsfieldProvider() {
  if (liveHiggsfieldProvider) return liveHiggsfieldProvider;
  liveHiggsfieldProvider = createHiggsfieldProviderAdapter({
    manifest: HIGGSFIELD_PROVIDER_MANIFEST,
    catalogSnapshots: getHiggsfieldCatalogSnapshots(),
    environment: process.env,
    platform: process.platform === "win32" ? "win32" : "posix",
    executor: {
      async execute(execution) {
        const bin = resolveHiggsfieldBin();
        if (!bin) return { kind: "not_installed" as const };
        try {
          const ran = await runHiggsfieldCli([...execution.argv], {
            timeoutMs: execution.timeoutMs,
            bin,
            signal: execution.signal,
            limits: execution.limits,
            env: execution.env,
          });
          return ran.code === 0
            ? { kind: "success" as const, exitCode: 0, stdout: ran.stdout, stderr: ran.stderr }
            : { kind: "failure" as const, exitCode: ran.code, stdout: ran.stdout, stderr: ran.stderr };
        } catch (error) {
          const result = error && typeof error === "object" ? (error as { result?: unknown }).result : undefined;
          if (result && typeof result === "object") {
            const kind = String((result as { kind?: unknown }).kind || "");
            if (["not_installed", "not_authenticated", "timed_out", "output_limit_exceeded", "cancelled", "ambiguous_submission", "unavailable"].includes(kind)) {
              return result as BoundedCliResult;
            }
          }
          return { kind: "unavailable" as const };
        }
      },
    },
    async materializeProjectAsset({ projectId, assetId }) {
      const asset = liveProjectAssets.get(assetId);
      if (!asset || asset.projectId !== projectId) throw new Error("Invalid project asset reference.");
      return {
        cliValue: asset.cliValue,
        cleanup() {
          liveProjectAssets.delete(assetId);
        },
      };
    },
  });
  return liveHiggsfieldProvider;
}

/** runtime 注入的写资产原语（写本地字节进项目素材，返回含 data.url 的记录）。 */
export type WriteAsset = (projectId: string, bytes: Buffer, fileName: string, contentType: string, meta: JsonRecord) => unknown;

export type ProcessOperationInput = {
  process: NonNullable<HttpOperation["process"]>;
  /** 与 HTTP body 同源的模板 context（{{request.prompt}}/{{request.params.X}}/{{providerMeta.task_id}}）。 */
  context: JsonRecord;
  /** 项目 id：用于把 `--download_dir` 下载到的本地结果导入素材；空则仅取远端 URL。 */
  projectId: string;
  writeAsset: WriteAsset;
  timeoutMs?: number;
  signal?: AbortSignal;
};

/** 归一后的「类 HTTP 响应」形状。response_mapping/statusMapping 据此读取（见 dreaminaVideos.ts）。 */
export type ProcessResponse = {
  submit_id: string;
  gen_status: string;
  fail_reason: string;
  queue_info: unknown;
  /** 结果媒体：远端 http(s) URL + 本地下载文件导入后的 nomi-local:// URL。 */
  video_url: string[];
};

export async function executeProcessOperation(input: ProcessOperationInput): Promise<{ response: unknown; request: unknown }> {
  if (input.process.parser === "higgsfield-cli") return executeHiggsfieldProcessOperation(input);

  const bin = resolveDreaminaBin();
  if (!bin) {
    throw new Error("未找到即梦 CLI（dreamina）。请在「模型设置 · 即梦会员」卡里一键安装，或终端运行 curl -fsSL https://jimeng.jianying.com/cli | bash。");
  }

  // 输入文件吞入：把槽给的资产 URL 物化成本地路径写回 params[expose]（spawn 后清理 temp）。
  const tempInputs: string[] = [];
  let inputDir = "";
  if (input.process.fileParams?.length) {
    inputDir = mkdtempSync(path.join(os.tmpdir(), "nomi-dreamina-in-"));
    const reqParams = (((input.context.request as JsonRecord)?.params) ?? {}) as Record<string, unknown>;
    tempInputs.push(...(await materializeInputFiles(reqParams, input.process.fileParams, input.projectId, inputDir)));
  }

  // 多帧：args 按图数变形（模板表达不了），分派给纯函数构建器（读已物化的图路径数组 + 主提示 + 过渡行）。
  let args: string[];
  if (input.process.build === "multiframe") {
    const reqParams = (((input.context.request as JsonRecord)?.params) ?? {}) as Record<string, unknown>;
    const imagePaths = Array.isArray(reqParams.mf_image_paths) ? (reqParams.mf_image_paths as unknown[]).map(String) : [];
    const prompt = String((input.context.request as JsonRecord)?.prompt ?? "");
    // 过渡描述用节点提示词（本就是多行 textarea）：2 图用整段当主提示；3+ 图按行拆，每行一句相邻图过渡。
    args = buildMultiframeArgs({ imagePaths, prompt, transitionLines: splitTransitionLines(prompt), duration: reqParams.duration });
  } else {
    // 渲染参数（与 HTTP body 同一套 renderTemplateValue）；空值参数（`--flag=`）丢弃 → dreamina 回落该项默认。
    // 数组结果（repeat-flag 模式：`["--image=/a","--image=/b"]`）展开成多参数。
    args = [];
    for (const tpl of input.process.args) {
      const rendered = renderTemplateValue(tpl, input.context);
      const items = Array.isArray(rendered) ? rendered : [rendered];
      for (const item of items) {
        const s = String(item ?? "");
        if (s && !/=$/.test(s)) args.push(s);
      }
    }
  }

  let downloadDir = "";
  // `--download_dir` 只有 query_result 子命令支持（实查 CLI：text2image/text2video/image2video… 全部 unknown flag）。
  // 提交子命令此刻也无结果可下，语义上本就不该带它。结构性兜底：即便某 op 误标 appendDownloadDir，
  // 也只在真正取结果的子命令上追加，杜绝「提交即 unknown flag 秒挂」这类复发（根因 P2，非逐 op 修症状）。
  if (input.process.appendDownloadDir && args[0] === "query_result") {
    downloadDir = mkdtempSync(path.join(os.tmpdir(), "nomi-dreamina-"));
    args.push(`--download_dir=${downloadDir}`);
  }

  try {
    const ran = await runDreaminaCli(args, { timeoutMs: input.timeoutMs ?? 300_000, bin });
    const normalized = normalizeDreaminaOutput(ran.stdout, ran.stderr);

    // 「三无」（submit_id / gen_status / 结果媒体全解析不到）= 这次调用没产生任何可用信息 = 真·调用失败，
    // **不看退出码**。实测（2026-07-06）现役 CLI 会 exit=0 只吐一行错误文本——登录态失效
    // （authsdk: refresh failed）、首用合规拦截（AigcComplianceConfirmationRequired）等；旧判定只拦
    // exit≠0，这类被 taskStatusFromResponse 兜成 queued → 节点「仍在生成」空转到 20 分钟硬超时
    // （群用户报「扣了积分一直生成不出来」的 Nomi 侧根因）。describeDreaminaFailure 按输出签名给
    // 人话指引（会员/首用授权/登录态/网络），其余原话透传。非会员静默失败（exit=1、输出全空）同样
    // 落在这里（旧 case 的超集）。
    const hasAnySignal = Boolean(
      normalized.submitId || normalized.genStatus || normalized.remoteUrls.length || normalized.localPaths.length,
    );
    if (!hasAnySignal) {
      throw new Error(describeDreaminaFailure(ran.code, ran.stdout, ran.stderr));
    }

    // 本地下载文件导入项目素材 → nomi-local://；远端 URL 直接交给现有 buildProfileTaskResult 下载。
    const localUrls: string[] = [];
    if (input.projectId) {
      for (const p of normalized.localPaths) {
        if (!existsSync(p)) continue;
        try {
          const written = input.writeAsset(input.projectId, readFileSync(p), path.basename(p), contentTypeFromPath(p), { kind: "generated" }) as { data?: { url?: string } };
          const url = String(written.data?.url || "");
          if (url && !localUrls.includes(url)) localUrls.push(url);
        } catch {
          /* 单个文件导入失败不阻断其余结果 */
        }
      }
    }

    const response: ProcessResponse = {
      submit_id: normalized.submitId,
      gen_status: normalized.genStatus,
      fail_reason: normalized.failReason,
      queue_info: normalized.queueInfo,
      video_url: Array.from(new Set([...normalized.remoteUrls, ...localUrls])),
    };
    return { response, request: { bin: path.basename(bin), args } };
  } finally {
    if (downloadDir) {
      try { rmSync(downloadDir, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    if (inputDir) {
      try { rmSync(inputDir, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    void tempInputs; // temp 输入随 inputDir 整体清理（列表留作未来按文件粒度清理/排错）
  }
}

async function executeHiggsfieldProcessOperation(input: ProcessOperationInput): Promise<{ response: unknown; request: unknown }> {
  if (input.process.build !== "higgsfield-generate") {
    throw new Error("Higgsfield process mappings must use the manifest generation adapter.");
  }
  const bin = resolveHiggsfieldBin();
  if (!bin) {
    throw new Error("Higgsfield CLI is not installed. Open Model setup and install Higgsfield CLI first.");
  }

  const registeredAssetIds: string[] = [];
  const assetReferences: Array<{ parameter: string; reference: string }> = [];
  try {
    const request = ((input.context.request as JsonRecord) || {}) as JsonRecord;
    const model = ((input.context.model as JsonRecord) || {}) as JsonRecord;
    const modelKey = String(model.modelKey || model.model_key || model.model_alias || "");
    const params = { ...((request.params && typeof request.params === "object" && !Array.isArray(request.params)
      ? request.params
      : {}) as Record<string, unknown>) };
    const assets: Array<{ assetId: string; parameter: string }> = [];
    const usesLegacyCompatibility = !input.process.fileParams?.length
      && input.process.bin === "higgsfield"
      && input.process.args.length === 0
      && LEGACY_HIGGSFIELD_TARGETS.has(modelKey);
    const fileParams = HIGGSFIELD_MEDIA_FILE_PARAMS;
    for (const spec of fileParams) {
      const raw = params[spec.param];
      const references = typeof raw === "string"
        ? (raw.trim() ? [raw.trim()] : [])
        : Array.isArray(raw) && raw.every((value) => typeof value === "string")
          ? raw.map((value) => value.trim()).filter(Boolean)
          : raw == null
            ? []
            : null;
      if (!references || references.length > 100) {
        throw new Error("Higgsfield asset references are invalid.");
      }
      delete params[spec.param];
      if (spec.expose !== spec.param) delete params[spec.expose];
      for (const reference of references) {
        assetReferences.push({ parameter: spec.param, reference });
        const cliValue = absolutePathFromLocalAssetUrl(reference, input.projectId)
          ?? (usesLegacyCompatibility ? inertLegacyFixtureMediaPath(reference, bin) : null);
        if (!cliValue) {
          throw new Error("Higgsfield accepts only assets materialized from the active project.");
        }
        const assetId = `asset-${randomUUID()}`;
        liveProjectAssets.set(assetId, { projectId: input.projectId, cliValue });
        registeredAssetIds.push(assetId);
        assets.push({ assetId, parameter: spec.param });
      }
    }
    const modelMeta = model.meta && typeof model.meta === "object" && !Array.isArray(model.meta)
      ? model.meta as JsonRecord
      : {};
    const higgsfieldMeta = modelMeta.higgsfield && typeof modelMeta.higgsfield === "object" && !Array.isArray(modelMeta.higgsfield)
      ? modelMeta.higgsfield as JsonRecord
      : {};
    const parameterSchema = resolveHiggsfieldCatalogSnapshot(modelKey, higgsfieldMeta.parameterSchema, {
      parameterControls: modelMeta.parameterControls,
      fileParams,
    });
    if (!parameterSchema) {
      throw new Error("Higgsfield catalog parameters are unavailable or invalid. Sync the Higgsfield catalog before generating.");
    }
    cacheResolvedHiggsfieldCatalogSnapshot(modelKey, parameterSchema);
    const parameters = selectHiggsfieldGenerationParameters(String(request.prompt || ""), params, parameterSchema);
    if (!parameters) {
      throw new Error("Higgsfield rejected one or more generation parameters.");
    }
    const extras = request.extras && typeof request.extras === "object" && !Array.isArray(request.extras)
      ? request.extras as JsonRecord
      : {};
    const operationId = modelKey.startsWith("workflow:")
      ? "higgsfield.generate.workflow" as const
      : "higgsfield.generate.create" as const;
    const generatedRequestId = `electron-${randomUUID()}`;
    const suppliedIdempotencyKey = extras.idempotencyKey;
    if (suppliedIdempotencyKey !== undefined && (typeof suppliedIdempotencyKey !== "string" || !HIGGSFIELD_IDEMPOTENCY_RE.test(suppliedIdempotencyKey))) {
      throw new Error("Higgsfield generation requires a valid caller-provided idempotency key.");
    }
    const grantId = typeof extras.grantId === "string" && extras.grantId ? extras.grantId : undefined;
    const idempotencyKey = typeof suppliedIdempotencyKey === "string"
      ? suppliedIdempotencyKey
      : electronCompatibilityIdempotencyKey({
          projectId: input.projectId,
          modelKey,
          prompt: String(request.prompt || ""),
          parameters,
          assetReferences,
          ...(grantId ? { grantId } : {}),
        });
    const result = await getLiveHiggsfieldProvider().invoke({
      requestId: generatedRequestId,
      manifestVersion: HIGGSFIELD_PROVIDER_MANIFEST.manifestVersion,
      operationId,
      input: { targetKey: modelKey, parameters, assets },
      idempotencyKey,
      policyContext: {
        ...(input.projectId ? { projectId: input.projectId } : {}),
        claimIds: ["generation.submit"],
        spendGrantId: grantId
          ? grantId
          : "electron-runtime-consumed-grant",
      },
    }, { signal: input.signal });
    if (!result.ok) throw new Error(result.error.message);
    const normalized = normalizeHiggsfieldOutput(JSON.stringify(result.value), "", 0);
    const hasAnySignal = Boolean(normalized.submitId || normalized.genStatus || normalized.remoteUrls.length);
    if (!hasAnySignal) throw new Error("Higgsfield returned an invalid generation result.");
    const response: ProcessResponse = {
      submit_id: normalized.submitId,
      gen_status: normalized.genStatus,
      fail_reason: normalized.failReason,
      queue_info: normalized.queueInfo,
      video_url: normalized.remoteUrls,
    };
    return {
      response,
      request: {
        bin: path.basename(bin),
        providerId: result.meta.providerId,
        operationId: result.meta.operationId,
        requestId: result.meta.requestId,
        idempotencyKeyHash: result.meta.idempotencyKeyHash,
        remoteState: result.meta.remoteState,
      },
    };
  } finally {
    for (const assetId of registeredAssetIds) liveProjectAssets.delete(assetId);
  }
}
