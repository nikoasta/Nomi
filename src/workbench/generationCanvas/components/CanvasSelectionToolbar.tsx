import { IconFolderMinus, IconFolderPlus, IconPlayerPlay, IconX } from '@tabler/icons-react'
import { WorkbenchIconButton } from '../../../design'
import { useI18n } from '../../../i18n/i18nContext'
import { cn } from '../../../utils/cn'

type CanvasSelectionToolbarProps = {
  selectedCount: number
  selectedGroupCount: number
  transform: string
  onBatchGenerate: () => void
  onGroupSelectedNodes: () => void
  onUngroupSelectedNodes: () => void
  onClearSelection: () => void
}

export function CanvasSelectionToolbar({
  selectedCount,
  selectedGroupCount,
  transform,
  onBatchGenerate,
  onGroupSelectedNodes,
  onUngroupSelectedNodes,
  onClearSelection,
}: CanvasSelectionToolbarProps): JSX.Element {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'generation-canvas-v2__selection-toolbar',
        'absolute z-[11] inline-flex items-center gap-2 px-2.5 py-1.5',
        'border border-nomi-line rounded-full',
        'bg-nomi-paper/[0.96] shadow-nomi-md pointer-events-auto',
      )}
      style={{ transform }}
      aria-label={t('canvas.selection.aria')}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className={cn('pl-1.5 pr-1 text-nomi-ink-60 text-body-sm whitespace-nowrap')}>{t('canvas.selection.count', { count: selectedCount })}</span>
      <button
        type="button"
        data-storyboard-run-all="true"
        className={cn(
          'inline-flex items-center gap-2 h-9 px-4 rounded-full border-0 cursor-pointer',
          'bg-nomi-ink text-nomi-paper text-body font-medium hover:bg-nomi-accent',
          'transition-colors duration-[var(--nomi-transition-fast)]',
        )}
        title={t('canvas.selection.generateTitle')}
        onClick={onBatchGenerate}
      >
        <IconPlayerPlay size={16} stroke={1.6} aria-hidden />
        {t('canvas.selection.generate', { count: selectedCount })}
      </button>
      <span className={cn('w-px h-4 bg-nomi-line')} />
      {selectedGroupCount > 0 ? (
        <WorkbenchIconButton label={t('canvas.selection.ungroup')} icon={<IconFolderMinus size={16} />} onClick={onUngroupSelectedNodes} />
      ) : (
        <WorkbenchIconButton label={t('canvas.selection.group')} icon={<IconFolderPlus size={16} />} onClick={onGroupSelectedNodes} />
      )}
      <WorkbenchIconButton label={t('canvas.selection.clear')} icon={<IconX size={16} />} onClick={onClearSelection} />
    </div>
  )
}
