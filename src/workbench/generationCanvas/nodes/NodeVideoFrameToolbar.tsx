import React from 'react'
import { IconDownload, IconMaximize, IconPlayerTrackNext, IconPlayerTrackPrev } from '@tabler/icons-react'
import { FloatingToolbarShell, TOOLBAR_ICON as I, ToolbarButton, ToolbarDivider, ToolbarIconButton } from './NodeFloatingToolbar'
import { extractVideoFrameToNode } from './extractVideoFrameToNode'
import type { GenerationCanvasNode } from '../model/generationCanvasTypes'
import { useI18n } from '../../../i18n/i18nContext'

// 视频节点浮条（用户拍板「抽帧能力」的用户入口）：抽首帧 / 抽尾帧 ｜ 下载。
// 抽帧 = 从这段视频取首/尾一帧 → 落独立图片节点（extractVideoFrameToNode），能拿去当 Seedance 首尾帧 /
// 任何参考 / 接力源。抽首/尾用两个不同图标（⏮/⏭）一眼可分。容器/按钮走共享 NodeFloatingToolbar（token 合规）。

type Props = {
  node: GenerationCanvasNode
  downloading: boolean
  onDownload: (event: React.MouseEvent) => void
  onPreview: () => void
}

export default function NodeVideoFrameToolbar({ node, downloading, onDownload, onPreview }: Props): JSX.Element {
  const { t } = useI18n()
  const [busy, setBusy] = React.useState<'first' | 'last' | null>(null)
  const extract = (which: 'first' | 'last') => {
    if (busy) return
    setBusy(which)
    void extractVideoFrameToNode(node, which).finally(() => setBusy(null))
  }
  return (
    <FloatingToolbarShell ariaLabel={t('mediaPreview.videoActions')}>
      <ToolbarIconButton
        icon={<IconMaximize size={I.size} stroke={I.stroke} />}
        title={t('mediaPreview.fullscreen')}
        ariaLabel={t('mediaPreview.fullscreenVideo')}
        onClick={onPreview}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={<IconPlayerTrackPrev size={I.size} stroke={I.stroke} />}
        label={busy === 'first' ? t('mediaPreview.extractingFrame') : t('mediaPreview.extractFirstFrame')}
        title={t('mediaPreview.extractFirstFrameTitle')}
        disabled={busy !== null}
        onClick={() => extract('first')}
      />
      <ToolbarButton
        icon={<IconPlayerTrackNext size={I.size} stroke={I.stroke} />}
        label={busy === 'last' ? t('mediaPreview.extractingFrame') : t('mediaPreview.extractLastFrame')}
        title={t('mediaPreview.extractLastFrameTitle')}
        disabled={busy !== null}
        onClick={() => extract('last')}
      />
      <ToolbarDivider />
      <ToolbarButton
        icon={<IconDownload size={I.size} stroke={I.stroke} />}
        label={t('imageEdit.download')}
        title={t('imageEdit.downloadTitle')}
        disabled={downloading}
        onClick={onDownload}
      />
    </FloatingToolbarShell>
  )
}
