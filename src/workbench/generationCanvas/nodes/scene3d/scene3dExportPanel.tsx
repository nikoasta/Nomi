import React from 'react'
import { IconPhoto, IconVideo, IconX, IconPlayerPlay } from '@tabler/icons-react'
import type { Scene3DState } from './scene3dTypes'
import { isCameraMoveReady } from './scene3dPlayback'
import { useScene3DI18n } from './scene3dI18n'

/**
 * 出片面板（P0-2）：3D 场景的"产物出口"。
 *
 * 设计定案（docs/plan/2026-07-20-scene3d-ux-overhaul.md §4.3）：
 * 三种产物一个入口——参考视频 / 截图 / 首尾帧。
 * "参考视频"标"推荐"——这是用户最常要的产物。
 * 没整运镜时，"参考视频"灰掉 + 提示"先整运镜"。
 */

export type Scene3DExportPanelProps = {
  open: boolean
  onClose: () => void
  state: Scene3DState
  onExportReferenceVideo: () => void
  onScreenshotViewport: () => void
  onScreenshotCamera: () => void
  onExportKeyFrames: () => void
  hasCamera: boolean
}

/**
 * P0-4/P3-14：出片产物卡片。渲染中 → 完成（带去向：画布节点/下游镜头）三态，
 * 状态由宿主 useScene3DExportActions 盯 take 节点 meta.cameraMoveVideo 推进。
 */
export function Scene3DExportingCard({ card, onGoCanvas, onDismiss }: {
  card: import('./useScene3DFullscreenActions').Scene3DExportCard | null
  /** 回画布查看：关编辑器（宿主已排好 fit + 高亮新节点） */
  onGoCanvas: () => void
  onDismiss: () => void
}): JSX.Element | null {
  const t3d = useScene3DI18n()
  if (!card) return null
  return (
    <div className="fixed bottom-6 right-6 z-[59] flex max-w-[440px] items-center gap-3 rounded-nomi border border-[var(--nomi-line-soft)] bg-[var(--workbench-surface-solid)] px-4 py-3 shadow-workbench-pop">
      {card.phase === 'done' ? (
        <>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-caption font-medium text-[var(--workbench-ink)]">
              {card.kind === 'screenshot' ? t3d('export.screenshotCreated') : t3d('export.referenceVideoCreated')}
            </span>
            <span className="text-micro text-[var(--workbench-muted)]">
              {card.kind === 'screenshot'
                ? t3d('export.screenshotCanvasNode')
                : card.fedDownstream ? t3d('export.videoFedDownstream') : t3d('export.videoCanvasNode')}
            </span>
          </div>
          <button
            type="button"
            onClick={onGoCanvas}
            className="shrink-0 rounded-nomi-sm bg-[var(--nomi-ink)] px-2.5 py-1.5 text-caption font-medium text-[var(--nomi-paper)] transition-opacity hover:opacity-90"
          >
            {t3d('export.viewCanvas')}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-caption text-[var(--workbench-muted)] hover:text-[var(--workbench-ink)]"
          >
            {t3d('export.dismiss')}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-[var(--nomi-accent)]" />
            <span className="text-caption font-medium text-[var(--workbench-ink)]">
              {card.phase === 'slow' ? t3d('export.videoSlow') : t3d('export.videoRendering')}
            </span>
          </div>
          <span className="text-caption text-[var(--workbench-muted)]">
            {card.phase === 'slow' ? t3d('export.videoSlowHint') : t3d('export.videoRenderingHint')}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-2 text-caption text-[var(--workbench-muted)] hover:text-[var(--workbench-ink)]"
          >
            {t3d('export.dismiss')}
          </button>
        </>
      )}
    </div>
  )
}

export default function Scene3DExportPanel({
  open,
  onClose,
  state,
  onExportReferenceVideo,
  onScreenshotViewport,
  onScreenshotCamera,
  onExportKeyFrames,
  hasCamera,
}: Scene3DExportPanelProps): JSX.Element | null {
  const t3d = useScene3DI18n()
  if (!open) return null

  const moveReady = isCameraMoveReady(state)
  const trajectoryCount = state.trajectories.filter((t) => t.points.length >= 2).length
  const bindingCount = state.trajectoryBindings.length

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-[60] bg-[var(--nomi-scrim)]"
        onClick={onClose}
        aria-hidden
      />
      {/* 出片面板（右侧滑出） */}
      <aside
        className="fixed right-0 top-0 z-[61] flex h-full w-[360px] flex-col overflow-hidden border-l border-[var(--nomi-line-soft)] bg-[var(--workbench-surface-solid)] shadow-workbench-pop"
        role="dialog"
        aria-label={t3d('export.title')}
      >
        {/* 头部 */}
        <header className="flex min-h-[52px] shrink-0 items-center gap-2 border-b border-[var(--workbench-border)] px-4">
          <span className="text-body font-medium text-[var(--workbench-ink)]">{t3d('export.title')}</span>
          <span className="text-caption text-[var(--workbench-muted)]">{t3d('export.subtitle')}</span>
          <button
            type="button"
            className="ml-auto grid size-8 place-items-center rounded-nomi-sm text-[var(--workbench-muted)] hover:bg-[var(--nomi-ink-05)] hover:text-[var(--workbench-ink)]"
            onClick={onClose}
            title={t3d('export.close')}
          >
            <IconX size={16} />
          </button>
        </header>

        {/* 内容 */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {/* 参考视频（推荐） */}
          <button
            type="button"
            disabled={!moveReady}
            onClick={onExportReferenceVideo}
            className="group flex flex-col gap-2 rounded-nomi border border-[var(--nomi-line-soft)] bg-[var(--nomi-paper)] p-4 text-left transition-colors hover:border-[var(--nomi-ink-30)] hover:bg-[var(--nomi-ink-05)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <IconVideo size={20} className="text-[var(--nomi-ink)]" />
              <span className="text-body-sm font-medium text-[var(--workbench-ink)]">{t3d('export.referenceVideo')}</span>
              <span className="ml-auto rounded-full bg-[var(--nomi-ink)] px-2 py-0.5 text-micro font-medium text-[var(--nomi-paper)]">
                {t3d('export.recommended')}
              </span>
            </div>
            <p className="text-caption text-[var(--workbench-muted)]">
              {t3d('export.referenceVideoDescription')}
            </p>
            {!moveReady ? (
              <p className="text-caption text-[var(--workbench-danger)]">
                {trajectoryCount === 0
                  ? t3d('export.moveNeedTrajectory')
                  : bindingCount === 0
                    ? t3d('export.moveNeedBinding')
                    : t3d('export.moveNotReady')}
              </p>
            ) : (
              <p className="text-caption text-[var(--workbench-muted)]">
                {t3d('export.moveReady', { trajectories: trajectoryCount, bindings: bindingCount })}
              </p>
            )}
          </button>

          {/* 截图 */}
          <div className="flex flex-col gap-2 rounded-nomi border border-[var(--nomi-line-soft)] bg-[var(--nomi-paper)] p-4">
            <div className="flex items-center gap-2">
              <IconPhoto size={20} className="text-[var(--nomi-ink)]" />
              <span className="text-body-sm font-medium text-[var(--workbench-ink)]">{t3d('export.screenshot')}</span>
            </div>
            <p className="text-caption text-[var(--workbench-muted)]">{t3d('export.screenshotDescription')}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onScreenshotViewport}
                className="flex-1 rounded-nomi-sm border border-[var(--nomi-line-soft)] bg-[var(--nomi-ink-05)] px-3 py-1.5 text-caption text-[var(--workbench-ink)] hover:bg-[var(--nomi-ink-10)]"
              >
                {t3d('export.viewportScreenshot')}
              </button>
              <button
                type="button"
                onClick={onScreenshotCamera}
                disabled={!hasCamera}
                className="flex-1 rounded-nomi-sm border border-[var(--nomi-line-soft)] bg-[var(--nomi-ink-05)] px-3 py-1.5 text-caption text-[var(--workbench-ink)] hover:bg-[var(--nomi-ink-10)] disabled:cursor-not-allowed disabled:opacity-50"
                title={hasCamera ? t3d('export.cameraScreenshotTitle') : t3d('export.addCameraFirst')}
              >
                {t3d('export.cameraScreenshot')}
              </button>
            </div>
          </div>

          {/* 首尾帧 */}
          <button
            type="button"
            disabled={!moveReady || !hasCamera}
            onClick={onExportKeyFrames}
            className="group flex flex-col gap-2 rounded-nomi border border-[var(--nomi-line-soft)] bg-[var(--nomi-paper)] p-4 text-left transition-colors hover:border-[var(--nomi-ink-30)] hover:bg-[var(--nomi-ink-05)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <IconPhoto size={20} className="text-[var(--nomi-ink)]" />
              <span className="text-body-sm font-medium text-[var(--workbench-ink)]">{t3d('export.keyFrames')}</span>
            </div>
            <p className="text-caption text-[var(--workbench-muted)]">
              {t3d('export.keyFramesDescription')}
            </p>
            {(!moveReady || !hasCamera) && (
              <p className="text-caption text-[var(--workbench-danger)]">
                {t3d('export.keyFramesRequirement')}
              </p>
            )}
          </button>

          {/* 底部提示 */}
          <div className="mt-auto rounded-nomi bg-[var(--nomi-ink-05)] p-3 text-caption text-[var(--workbench-muted)]">
            <div className="flex items-center gap-1.5">
              <IconPlayerPlay size={12} />
              <span>{t3d('export.autoDelivery')}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
