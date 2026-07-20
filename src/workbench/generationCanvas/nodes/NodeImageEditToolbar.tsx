import React from 'react'
import { IconBrush, IconCrop, IconDownload, IconFlipHorizontal, IconFlipVertical, IconGrid3x3, IconGridDots, IconLayersSubtract, IconLayoutGrid, IconMaximize, IconRotate2, IconRotateClockwise2, IconScissors, IconSparkles, IconTransform, IconTypography, IconWand } from '@tabler/icons-react'
import { IMAGE_TRANSFORM_LABEL_KEY, type ImageGridSize, type ImageTransformOp } from './useNodeImageEditing'
import type { CropGridSize } from './render/ImageCropGridOverlay'
import { useResultDownload } from './useResultDownload'
import { FloatingToolbarShell, TOOLBAR_ICON as I, ToolbarButton, ToolbarDivider, ToolbarIconButton, ToolbarMenu } from './NodeFloatingToolbar'
import type { GenerationCanvasNode } from '../model/generationCanvasTypes'
import WhiteboardModal from './whiteboard/WhiteboardModal'
import { inferWhiteboardAspectRatio, readWhiteboardState } from './whiteboard/whiteboardState'
import { applyTextEdit } from '../textEdit/buildTextEditNode'
import { useDecomposeLayers } from './decompose/useDecomposeLayers'
import { NomiLoadingMark } from '../../../design'
import { useI18n } from '../../../i18n/i18nContext'

// 图片节点编辑浮条（方案 B 分组，用户拍板）：定妆 ｜ 裁剪 · 切图▾ · 变换▾ ｜ 下载。
// 把低频的截图(2)/变换(4)收进两个下拉，常用动作留在外面 1 次点击直达。容器/按钮/图标全走
// NodeFloatingToolbar 共享组件（token 合规，§2/§6）。图片类与素材类节点共用此条。

type Props = {
  node: GenerationCanvasNode
  /** 当前打开的可调框：null=未开，1=裁剪，2/3=切图。开着或忙时禁用编辑入口。 */
  editGrid: CropGridSize | null
  imageOpBusy: boolean
  onGridSplit: (gridSize: ImageGridSize) => void
  onCrop: () => void
  onTransform: (op: ImageTransformOp) => void
  onRemoveBackground?: () => void
  removeBackgroundBusy?: boolean
  /** 打开共享图片全屏预览。 */
  onPreview: () => void
  /** Tier1「定妆」：基于当前图建一个预填身份板提示词的新节点（不自动生成）。缺省不渲染该按钮。 */
  onMakeup?: () => void
}

export default function NodeImageEditToolbar({ node, editGrid, imageOpBusy, onGridSplit, onCrop, onTransform, onRemoveBackground, removeBackgroundBusy = false, onPreview, onMakeup }: Props): JSX.Element {
  const { t } = useI18n()
  const { downloading, download } = useResultDownload(node)
  const [whiteboardOpen, setWhiteboardOpen] = React.useState(false)
  const imageUrl = node.result?.type === 'image' ? node.result.url || '' : ''
  const { decomposeBusy, decomposeState, runDecompose, clearDecompose } = useDecomposeLayers(node, imageUrl)
  const busy = editGrid !== null || imageOpBusy || removeBackgroundBusy || decomposeBusy
  // 拆解出图后自动打开白板（effect-first：用户立刻看到一堆可抓的元素，设计评审定）。
  React.useEffect(() => {
    if (decomposeState) setWhiteboardOpen(true)
  }, [decomposeState])
  return (
    <>
      <FloatingToolbarShell ariaLabel={t('imageEdit.aria')}>
        <ToolbarIconButton
          icon={<IconMaximize size={I.size} stroke={I.stroke} />}
          title={t('mediaPreview.fullscreen')}
          ariaLabel={t('mediaPreview.fullscreenImage')}
          disabled={!imageUrl}
          onClick={onPreview}
        />
        <ToolbarDivider />
        {onMakeup ? (
          <ToolbarButton
            icon={<IconSparkles size={I.size} stroke={I.stroke} />}
            label={t('imageEdit.makeup')}
            accent
            title={t('imageEdit.makeupTitle')}
            onClick={onMakeup}
          />
        ) : null}
        <ToolbarMenu
          icon={decomposeBusy ? <NomiLoadingMark size={I.size} /> : <IconWand size={I.size} stroke={I.stroke} />}
          label={decomposeBusy ? t('imageEdit.decomposing') : t('imageEdit.aiEdit')}
          disabled={busy || !imageUrl}
          items={[
            { icon: <IconLayersSubtract size={I.size} stroke={I.stroke} />, label: t('imageEdit.decomposeLayers'), onClick: () => { void runDecompose() } },
            { icon: <IconTypography size={I.size} stroke={I.stroke} />, label: t('imageEdit.textEdit'), onClick: () => applyTextEdit(node) },
          ]}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={<IconCrop size={I.size} stroke={I.stroke} />}
          label={t('imageEdit.crop')}
          title={t('imageEdit.cropTitle')}
          disabled={busy}
          onClick={onCrop}
        />
        {onRemoveBackground ? (
          <ToolbarButton
            icon={removeBackgroundBusy ? <NomiLoadingMark size={I.size} /> : <IconScissors size={I.size} stroke={I.stroke} />}
            label={removeBackgroundBusy ? t('imageEdit.removingBackground') : t('imageEdit.removeBackground')}
            title={t('imageEdit.removeBackgroundTitle')}
            disabled={busy}
            ariaBusy={removeBackgroundBusy}
            onClick={onRemoveBackground}
          />
        ) : null}
        <ToolbarMenu
          icon={<IconGridDots size={I.size} stroke={I.stroke} />}
          label={t('imageEdit.gridSplit')}
          disabled={busy}
          items={[
            { icon: <IconLayoutGrid size={I.size} stroke={I.stroke} />, label: t('imageEdit.grid2'), onClick: () => onGridSplit(2) },
            { icon: <IconGrid3x3 size={I.size} stroke={I.stroke} />, label: t('imageEdit.grid3'), onClick: () => onGridSplit(3) },
          ]}
        />
        <ToolbarMenu
          icon={<IconTransform size={I.size} stroke={I.stroke} />}
          label={t('imageEdit.transform')}
          disabled={busy}
          items={([
            { op: 'rotate-left' as const, icon: <IconRotate2 size={I.size} stroke={I.stroke} /> },
            { op: 'rotate-right' as const, icon: <IconRotateClockwise2 size={I.size} stroke={I.stroke} /> },
            { op: 'flip-h' as const, icon: <IconFlipHorizontal size={I.size} stroke={I.stroke} /> },
            { op: 'flip-v' as const, icon: <IconFlipVertical size={I.size} stroke={I.stroke} /> },
          ]).map(({ op, icon }) => ({ icon, label: t(IMAGE_TRANSFORM_LABEL_KEY[op]), onClick: () => onTransform(op) }))}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={<IconBrush size={I.size} stroke={I.stroke} />}
          label={t('imageEdit.whiteboard')}
          title={t('imageEdit.whiteboardTitle')}
          disabled={busy || !imageUrl}
          onClick={() => setWhiteboardOpen(true)}
        />
        <ToolbarDivider />
        <ToolbarButton
          icon={<IconDownload size={I.size} stroke={I.stroke} />}
          label={t('imageEdit.download')}
          title={t('imageEdit.downloadTitle')}
          disabled={downloading}
          onClick={download}
        />
      </FloatingToolbarShell>
      {whiteboardOpen && imageUrl ? (
        <WhiteboardModal
          nodeId={node.id}
          sourceKind="image"
          nodeTitle={`${node.title || t('imageEdit.defaultImage')} · ${decomposeState ? t('imageEdit.decomposedElements') : t('imageEdit.whiteboard')}`}
          initialState={decomposeState ?? readWhiteboardState(node)}
          {...(decomposeState
            ? {}
            : { initialImage: { url: imageUrl, aspectRatio: inferWhiteboardAspectRatio(node.meta?.imageWidth, node.meta?.imageHeight) } })}
          onClose={() => { setWhiteboardOpen(false); clearDecompose() }}
        />
      ) : null}
    </>
  )
}
