import type { TimelineState } from "../timeline/timelineTypes";
import {
    workbenchProjectRecordSchema,
    type WorkbenchProjectRecordV1,
    type WorkbenchProjectSummary,
} from "./projectRecordSchema";
import type { GenerationCanvasSnapshot } from "../generationCanvas/model/generationCanvasTypes";
import type { WorkbenchDocument } from "../workbenchTypes";
import { assertWorkbenchProjectMediaUrlsPersistable } from "./projectMediaMigration";
import { getDesktopBridge } from "../../desktop/bridge";
import { buildTemplateCategories, getProjectTemplate } from "../library/projectTemplates";
import { createDefaultWorkbenchDocument } from "../workbenchTypes";
import {
    PROJECT_BACKUP_INDEX_PREFIX,
    PROJECT_BACKUP_PREFIX,
    PROJECT_INDEX_KEY,
    PROJECT_RECORD_PREFIX,
    projectBackupIndexKey,
    projectBackupKey,
    projectRecordKey,
    projectRevisionBackupKey,
    readJson,
    readStorageKeys,
    removeStorageKey,
    writeJson,
} from "./projectStorage";
import { readBackupIndex, rememberProjectBackup } from "./projectBackup";
import {
    createProjectRecord,
    extractCanvasThumbnailUrls,
    extractThumbnailUrlsFromRaw,
    normalizePayload,
    normalizeRecord,
    normalizeSummary,
    seedDocFromMarkdown,
} from "./projectNormalize";

// 重导出：实现已拆到 projectStorage（localStorage 原语 + 配额错误），
// 但 projectRepository 对外公共导出面保持不变。
export { ProjectStorageQuotaError } from "./projectStorage";

function createProjectId(): string {
    return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDefaultProjectTimestamp(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
        .formatToParts(new Date())
        .reduce<Record<string, string>>((acc, part) => {
            if (part.type !== "literal") acc[part.type] = part.value;
            return acc;
        }, {});
    return `${parts.month || "00"}/${parts.day || "00"} ${parts.hour || "00"}:${parts.minute || "00"}`;
}

function formatDefaultProjectName(): string {
    return `Untitled project ${formatDefaultProjectTimestamp()}`;
}

export type PortalProjectBinding = {
    organizationId: string;
    workspaceId: string;
    projectId: string;
    currentRevisionId?: string | null;
};

function normalizePortalProjectBinding(value?: PortalProjectBinding | null): PortalProjectBinding | null {
    const organizationId = String(value?.organizationId || "").trim();
    const workspaceId = String(value?.workspaceId || "").trim();
    const projectId = String(value?.projectId || "").trim();
    if (!organizationId || !workspaceId || !projectId) return null;
    const currentRevisionId =
        value?.currentRevisionId === null ? null : String(value?.currentRevisionId || "").trim() || null;
    return { organizationId, workspaceId, projectId, currentRevisionId };
}

function portalSummaryFields(value?: PortalProjectBinding | null): Partial<WorkbenchProjectSummary> {
    const binding = normalizePortalProjectBinding(value);
    if (!binding) return {};
    return {
        portalOrganizationId: binding.organizationId,
        portalWorkspaceId: binding.workspaceId,
        portalProjectId: binding.projectId,
        portalCurrentRevisionId: binding.currentRevisionId,
    };
}

function portalSummaryFieldsFromRaw(value: unknown): Partial<WorkbenchProjectSummary> {
    if (!value || typeof value !== "object") return {};
    const raw = value as Record<string, unknown>;
    return portalSummaryFields({
        organizationId: typeof raw.portalOrganizationId === "string" ? raw.portalOrganizationId : "",
        workspaceId: typeof raw.portalWorkspaceId === "string" ? raw.portalWorkspaceId : "",
        projectId: typeof raw.portalProjectId === "string" ? raw.portalProjectId : "",
        currentRevisionId:
            raw.portalCurrentRevisionId === null
                ? null
                : typeof raw.portalCurrentRevisionId === "string"
                  ? raw.portalCurrentRevisionId
                  : null,
    });
}

function readIndex(): WorkbenchProjectSummary[] {
    const raw = readJson(PROJECT_INDEX_KEY);
    if (!Array.isArray(raw)) return [];
    return raw
        .flatMap((item): WorkbenchProjectSummary[] => {
            const summary = normalizeSummary(item);
            return summary ? [summary] : [];
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

function readRecordSummaries(): WorkbenchProjectSummary[] {
    return readStorageKeys()
        .filter((key) => key.startsWith(PROJECT_RECORD_PREFIX))
        .flatMap((key): WorkbenchProjectSummary[] => {
            const raw = readJson(key);
            const summary = normalizeSummary(raw);
            return summary ? [summary] : [];
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

function readMergedProjectSummaries(): WorkbenchProjectSummary[] {
    const byId = new Map<string, WorkbenchProjectSummary>();
    for (const summary of readRecordSummaries()) byId.set(summary.id, summary);
    for (const summary of readIndex()) byId.set(summary.id, summary);
    return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

function writeIndex(items: readonly WorkbenchProjectSummary[]): void {
    writeJson(PROJECT_INDEX_KEY, items);
}

export function listLocalProjects(): WorkbenchProjectSummary[] {
    const desktop = getDesktopBridge();
    if (desktop) {
        return (desktop.projects.list() as WorkbenchProjectSummary[]).sort(
            (a, b) => b.updatedAt - a.updatedAt,
        );
    }
    return readMergedProjectSummaries().map((summary) => {
        if (summary.thumbnailUrls?.length) return summary;
        try {
            const raw = readJson(projectRecordKey(summary.id));
            const thumbnailUrls = extractThumbnailUrlsFromRaw(raw);
            if (thumbnailUrls.length)
                return {
                    ...summary,
                    thumbnailUrls,
                    thumbnail: thumbnailUrls[0],
                };
        } catch {
            // ignore
        }
        return summary;
    });
}

export function createLocalProject(
    name?: string,
    templateId?: string,
    options: { rootPath?: string; seedKey?: string; portal?: PortalProjectBinding } = {},
): WorkbenchProjectRecordV1 {
    const now = Date.now();
    const template = getProjectTemplate(templateId || null);
    // 草稿态：用户手动「新建空白」（无 seedKey 播种、无 rootPath 外部绑定）零编辑会被启动 GC 回收。
    // example（seedKey）/打开文件夹（rootPath）不打标记，永不被回收。
    const isDraft = !options.seedKey?.trim() && !options.rootPath?.trim() && !normalizePortalProjectBinding(options.portal);
    const summary: WorkbenchProjectSummary = {
        id: createProjectId(),
        name:
            typeof name === "string" && name.trim()
                ? name.trim()
                : formatDefaultProjectName(),
        createdAt: now,
        updatedAt: now,
        revision: 0,
        savedAt: now,
        ...(options.seedKey?.trim() ? { seedKey: options.seedKey.trim() } : {}),
        ...(isDraft ? { draft: true } : {}),
        ...portalSummaryFields(options.portal),
    };
    const docDefaults = createDefaultWorkbenchDocument();
    const seededDocument = template.seedDocument
        ? {
              ...docDefaults,
              contentJson: seedDocFromMarkdown(template.seedDocument),
              updatedAt: now,
          }
        : docDefaults;
    const record = createProjectRecord(summary, {
        workbenchDocument: seededDocument,
        categories: buildTemplateCategories(template),
    });
    const desktop = getDesktopBridge();
    if (desktop) {
        return desktop.projects.create(record) as WorkbenchProjectRecordV1;
    }
    writeJson(projectRecordKey(summary.id), record);
    writeIndex([
        summary,
        ...readMergedProjectSummaries().filter(
            (item) => item.id !== summary.id,
        ),
    ]);
    return record;
}

export function readLocalProject(
    projectId: string,
): WorkbenchProjectRecordV1 | null {
    const id = String(projectId || "").trim();
    if (!id) return null;
    const desktop = getDesktopBridge();
    if (desktop) {
        const record = desktop.projects.read(id);
        return record
            ? normalizeRecord(
                  normalizeSummary(record) ||
                      (record as WorkbenchProjectSummary),
                  record,
              )
            : null;
    }
    const summary = readMergedProjectSummaries().find((item) => item.id === id);
    if (!summary) return null;
    const raw = readJson(projectRecordKey(id));
    if (!raw) {
        throw new Error(`Local project record is missing: ${id}`);
    }
    return normalizeRecord(summary, raw);
}

export async function readLocalProjectAsync(
    projectId: string,
): Promise<WorkbenchProjectRecordV1 | null> {
    const id = String(projectId || "").trim();
    if (!id) return null;
    const desktop = getDesktopBridge();
    if (desktop?.projects.readAsync) {
        const record = await desktop.projects.readAsync(id);
        return record
            ? normalizeRecord(
                  normalizeSummary(record) ||
                      (record as WorkbenchProjectSummary),
                  record,
              )
            : null;
    }
    return readLocalProject(id);
}

export function saveLocalProject(
    projectId: string,
    state: {
        workbenchDocument: WorkbenchDocument;
        timeline: TimelineState;
        generationCanvas: GenerationCanvasSnapshot;
    },
    name?: string,
): WorkbenchProjectRecordV1 {
    const id = String(projectId || "").trim();
    if (!id) throw new Error("projectId is required");
    const desktop = getDesktopBridge();
    const now = Date.now();
    const existingRecord = desktop
        ? desktop.projects.read(id)
        : readJson(projectRecordKey(id));
    const existing = desktop
        ? normalizeSummary(existingRecord)
        : readMergedProjectSummaries().find((item) => item.id === id);
    const existingRevision = (() => {
        const parsed = workbenchProjectRecordSchema.safeParse(existingRecord);
        if (parsed.success && typeof parsed.data.revision === "number")
            return parsed.data.revision;
        return existing?.revision ?? 0;
    })();
    const thumbnailUrls = extractCanvasThumbnailUrls(
        state.generationCanvas.nodes,
    );
    const thumbnail = thumbnailUrls[0] || existing?.thumbnail;
    const summary: WorkbenchProjectSummary = {
        id,
        name:
            typeof name === "string" && name.trim()
                ? name.trim()
                : existing?.name || "Untitled project",
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        revision: existingRevision + 1,
        savedAt: now,
        ...(existing?.thumbStyle ? { thumbStyle: existing.thumbStyle } : {}),
        ...(existing?.seedKey ? { seedKey: existing.seedKey } : {}),
        ...portalSummaryFieldsFromRaw(existingRecord),
        ...portalSummaryFieldsFromRaw(existing),
        ...(thumbnail ? { thumbnail } : {}),
        ...(thumbnailUrls.length
            ? { thumbnailUrls }
            : existing?.thumbnailUrls?.length
              ? { thumbnailUrls: existing.thumbnailUrls }
              : {}),
    };
    const payload = normalizePayload(state);
    const record: WorkbenchProjectRecordV1 = {
        ...summary,
        version: 1,
        payload,
    };
    assertWorkbenchProjectMediaUrlsPersistable(record);
    if (desktop) {
        return desktop.projects.save(id, record) as WorkbenchProjectRecordV1;
    }
    if (existingRecord) rememberProjectBackup(id, existingRecord);
    const nextIndex = [
        summary,
        ...readMergedProjectSummaries().filter((item) => item.id !== id),
    ];
    writeJson(projectRecordKey(id), record);
    writeIndex(nextIndex);
    return record;
}

export function updateLocalProjectPortalBinding(
    projectId: string,
    binding: PortalProjectBinding,
): WorkbenchProjectRecordV1 | null {
    const id = String(projectId || "").trim();
    if (!id) throw new Error("projectId is required");
    const normalized = normalizePortalProjectBinding(binding);
    if (!normalized) throw new Error("portal binding is required");
    const desktop = getDesktopBridge();
    const existingRecord = desktop
        ? desktop.projects.read(id)
        : readJson(projectRecordKey(id));
    const summary = normalizeSummary(existingRecord);
    if (!summary) return null;
    const fields = portalSummaryFields(normalized);
    const next: WorkbenchProjectRecordV1 = {
        ...normalizeRecord({ ...summary, ...fields }, existingRecord),
        ...fields,
    };
    if (desktop) {
        if (!desktop.projects.save) return next;
        return desktop.projects.save(id, next) as WorkbenchProjectRecordV1;
    }
    writeJson(projectRecordKey(id), next);
    writeIndex(readMergedProjectSummaries().map((item) => (item.id === id ? { ...item, ...fields } : item)));
    return next;
}

export function deleteLocalProject(projectId: string): void {
    const id = String(projectId || "").trim();
    if (!id) throw new Error("projectId is required");
    const desktop = getDesktopBridge();
    if (desktop) {
        desktop.projects.delete(id);
    }
    removeStorageKey(projectRecordKey(id));
    removeStorageKey(projectBackupKey(id));
    for (const revision of readBackupIndex(id)) {
        removeStorageKey(projectRevisionBackupKey(id, revision));
    }
    removeStorageKey(projectBackupIndexKey(id));
    for (const key of readStorageKeys()) {
        if (
            key.startsWith(`${PROJECT_BACKUP_PREFIX}${id}:`) ||
            key.startsWith(`${PROJECT_BACKUP_INDEX_PREFIX}${id}`)
        ) {
            removeStorageKey(key);
        }
    }
    writeIndex(readMergedProjectSummaries().filter((item) => item.id !== id));
}
