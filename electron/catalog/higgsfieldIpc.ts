import { spawn } from "node:child_process";
import { HIGGSFIELD_VENDOR_KEY, buildHiggsfieldEnv, isHiggsfieldInstalled, parseJson, resolveHiggsfieldBin, runHiggsfieldCli } from "./higgsfieldCli";
import { mutateCatalog } from "./catalogStore";
import {
  HIGGSFIELD_GENERATE_OP,
  HIGGSFIELD_STATUS_MAPPING,
  HIGGSFIELD_WORKFLOW_MODEL_PREFIX,
  defaultHiggsfieldControls,
  higgsfieldTaskKindsFor,
  modelParamsToControls,
} from "./higgsfieldTransport";
import type { BillingModelKind } from "./types";

type HiggsfieldModelListItem = {
  display_name?: string;
  job_type?: string;
  type?: string;
};

type HiggsfieldModelDetail = HiggsfieldModelListItem & {
  params?: unknown[];
};

type HiggsfieldCatalogRow = HiggsfieldModelListItem & {
  source: "model" | "workflow";
};

export type HiggsfieldStatus = {
  installed: boolean;
  loggedIn: boolean;
  version: string;
  latestVersion: string;
  planType: string;
  credits: number | null;
  workspaceName: string;
  modelCount: number;
  workflowCount: number;
  voiceCount: number;
  error: string;
};

function toBillingKind(type: string): "text" | "image" | "video" | "audio" | "model3d" {
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  if (type === "3d") return "model3d";
  return "text";
}

function catalogKindFromHiggsfieldItem(item: HiggsfieldModelListItem): BillingModelKind {
  const type = String(item.type || "");
  const key = String(item.job_type || "").toLowerCase();
  if (type === "data" && /(speech|transcri|audio|clip)/.test(key)) return "audio";
  return toBillingKind(type);
}

function versionFromOutput(text: string): string {
  const line = String(text || "").split(/\r?\n/).find(Boolean) || "";
  const match = /\bhiggsfield\s+([^\s]+)/i.exec(line);
  return match?.[1] || line.trim();
}

async function safeJsonCommand<T>(args: string[], fallback: T, timeoutMs = 45_000): Promise<T> {
  const ran = await runHiggsfieldCli(args, { timeoutMs }).catch(() => null);
  if (!ran || ran.code !== 0) return fallback;
  return parseJson<T>(ran.stdout, fallback);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    for (;;) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      results[current] = await fn(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function higgsfieldStatus(): Promise<HiggsfieldStatus> {
  if (!isHiggsfieldInstalled()) {
    return {
      installed: false,
      loggedIn: false,
      version: "",
      latestVersion: "",
      planType: "",
      credits: null,
      workspaceName: "",
      modelCount: 0,
      workflowCount: 0,
      voiceCount: 0,
      error: "",
    };
  }

  const versionRun = await runHiggsfieldCli(["version"], { timeoutMs: 10_000 }).catch(() => null);
  const account = await safeJsonCommand<{ credits?: number; subscription_plan_type?: string } | null>(["account", "status", "--json"], null, 20_000);
  const workspace = await safeJsonCommand<{ name?: string; plan_type?: string; credits?: number } | null>(["workspace", "status", "--json"], null, 20_000);
  const models = await safeJsonCommand<HiggsfieldModelListItem[]>(["model", "list", "--json"], [], 45_000);
  const workflows = await safeJsonCommand<HiggsfieldModelListItem[]>(["workflow", "list", "--json"], [], 45_000);
  const voices = await safeJsonCommand<{ total?: number; items?: unknown[] } | unknown[]>(["voices", "list", "--json"], [], 45_000);
  const voiceCount = Array.isArray(voices) ? voices.length : Number(voices.total ?? voices.items?.length ?? 0);
  const loggedIn = Boolean(account || workspace);

  return {
    installed: true,
    loggedIn,
    version: versionRun && versionRun.code === 0 ? versionFromOutput(versionRun.stdout) : "",
    latestVersion: "",
    planType: String(account?.subscription_plan_type || workspace?.plan_type || ""),
    credits: typeof account?.credits === "number" ? account.credits : typeof workspace?.credits === "number" ? workspace.credits : null,
    workspaceName: String(workspace?.name || ""),
    modelCount: Array.isArray(models) ? models.length : 0,
    workflowCount: Array.isArray(workflows) ? workflows.length : 0,
    voiceCount,
    error: loggedIn ? "" : "Not signed in",
  };
}

export function higgsfieldInstall(): Promise<{ ok: boolean; message: string }> {
  if (isHiggsfieldInstalled()) return Promise.resolve({ ok: true, message: "Higgsfield CLI is already installed." });
  return new Promise((resolve) => {
    const child = spawn("npm", ["install", "-g", "@higgsfield/cli"], { windowsHide: true, env: buildHiggsfieldEnv() });
    let out = "";
    const timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch { /* already gone */ }
      resolve({ ok: false, message: "Install timed out. Try: npm install -g @higgsfield/cli" });
    }, 180_000);
    child.stdout?.on("data", (chunk) => { out += String(chunk); });
    child.stderr?.on("data", (chunk) => { out += String(chunk); });
    child.on("close", () => {
      clearTimeout(timer);
      resolve(resolveHiggsfieldBin() ? { ok: true, message: "Higgsfield CLI installed." } : { ok: false, message: out.slice(-400) || "Install did not finish." });
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ ok: false, message: error.message });
    });
  });
}

export async function higgsfieldLogin(): Promise<{ ok: boolean; message: string }> {
  const ran = await runHiggsfieldCli(["auth", "login"], { timeoutMs: 10 * 60_000 }).catch((error) => ({
    code: -1,
    stdout: "",
    stderr: error instanceof Error ? error.message : String(error),
  }));
  const text = `${ran.stdout}\n${ran.stderr}`.trim();
  return ran.code === 0 ? { ok: true, message: text || "Signed in to Higgsfield." } : { ok: false, message: text || "Higgsfield sign-in failed." };
}

export async function higgsfieldSyncCatalog(): Promise<{ ok: boolean; models: number; workflows: number; message: string }> {
  const models = await safeJsonCommand<HiggsfieldModelListItem[]>(["model", "list", "--json"], [], 60_000);
  const workflows = await safeJsonCommand<HiggsfieldModelListItem[]>(["workflow", "list", "--json"], [], 60_000);
  if (!Array.isArray(models) || models.length === 0) {
    return { ok: false, models: 0, workflows: Array.isArray(workflows) ? workflows.length : 0, message: "No Higgsfield models returned by CLI." };
  }
  const workflowRows: HiggsfieldCatalogRow[] = (Array.isArray(workflows) ? workflows : [])
    .map((item) => ({ ...item, source: "workflow" as const }))
    .filter((item) => String(item.job_type || "").trim());
  const modelRows: HiggsfieldCatalogRow[] = models.map((item) => ({ ...item, source: "model" as const }));
  const catalogRows = [...modelRows, ...workflowRows];
  const detailRows = await mapWithConcurrency(catalogRows, 4, async (item) => {
    const key = String(item.job_type || "").trim();
    if (!key) return [key, null] as const;
    const command = item.source === "workflow" ? "workflow" : "model";
    const detail = await safeJsonCommand<HiggsfieldModelDetail | null>([command, "get", key, "--json"], null, 20_000);
    return [`${item.source}:${key}`, detail] as const;
  });
  const details = new Map(detailRows.filter(([key]) => key).map(([key, detail]) => [key, detail]));

  mutateCatalog((tx) => {
    tx.upsertVendor({
      key: HIGGSFIELD_VENDOR_KEY,
      name: "Higgsfield CLI",
      baseUrlHint: "higgsfield://cli",
      authType: "none",
      enabled: true,
      meta: { transport: "higgsfield-cli", source: "higgsfield model list" },
    });
    const taskKinds = new Set<string>();
    for (const item of catalogRows) {
      const jobType = String(item.job_type || "").trim();
      if (!jobType) continue;
      const modelKey = item.source === "workflow" ? `${HIGGSFIELD_WORKFLOW_MODEL_PREFIX}${jobType}` : jobType;
      const kind = catalogKindFromHiggsfieldItem(item);
      for (const taskKind of higgsfieldTaskKindsFor(kind)) taskKinds.add(taskKind);
      const detail = details.get(`${item.source}:${jobType}`);
      const parameterControls = modelParamsToControls(detail?.params);
      tx.upsertModel({
        vendorKey: HIGGSFIELD_VENDOR_KEY,
        modelKey,
        modelAlias: jobType,
        labelZh: item.source === "workflow" ? `Workflow · ${String(item.display_name || jobType)}` : String(item.display_name || jobType),
        kind,
        enabled: true,
        meta: {
          higgsfield: { jobType, type: item.type || "", cli: true, source: item.source },
          catalogOnly: false,
          parameterControls: parameterControls.length ? parameterControls : defaultHiggsfieldControls(kind, modelKey),
          imageOptions: kind === "image" ? { supportsReferenceImages: true, supportsTextToImage: true, supportsImageToImage: true } : undefined,
        },
      });
    }
    for (const taskKind of taskKinds) {
      tx.upsertMapping({
        id: `mapping-higgsfield-${taskKind}`,
        vendorKey: HIGGSFIELD_VENDOR_KEY,
        taskKind,
        name: `Higgsfield CLI · ${taskKind}`,
        enabled: true,
        create: HIGGSFIELD_GENERATE_OP,
        statusMapping: HIGGSFIELD_STATUS_MAPPING,
      });
    }
  });
  return {
    ok: true,
    models: catalogRows.length,
    workflows: Array.isArray(workflows) ? workflows.length : 0,
    message: `Enabled ${models.length} Higgsfield models and ${workflowRows.length} workflows.`,
  };
}
