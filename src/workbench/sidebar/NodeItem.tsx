import React from 'react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n/i18nContext'
import type { TranslationKey } from '../../i18n/translations'
import type { GenerationCanvasNode } from '../generationCanvas/model/generationCanvasTypes'

const NODE_KIND_LABEL_KEY: Partial<Record<GenerationCanvasNode['kind'], TranslationKey>> = {
  text: 'nodeItem.kind.text',
  character: 'nodeItem.kind.character',
  scene: 'nodeItem.kind.scene',
  image: 'nodeItem.kind.image',
  keyframe: 'nodeItem.kind.keyframe',
  video: 'nodeItem.kind.video',
  shot: 'nodeItem.kind.shot',
  output: 'nodeItem.kind.output',
  panorama: 'nodeItem.kind.panorama',
}

type Props = {
  node: GenerationCanvasNode
  active?: boolean
  depth?: number
  onSelect?: (nodeId: string) => void
  onContextMenu?: (event: React.MouseEvent<HTMLButtonElement>, nodeId: string) => void
}

export default function NodeItem({ node, active = false, depth = 0, onSelect, onContextMenu }: Props): JSX.Element {
  const { t } = useI18n()
  const handleDragStart = React.useCallback((event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('application/x-nomi-node-id', node.id)
    event.dataTransfer.effectAllowed = 'move'
  }, [node.id])

  const handleClick = React.useCallback(() => {
    onSelect?.(node.id)
  }, [node.id, onSelect])

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      onContextMenu={(event) => onContextMenu?.(event, node.id)}
      data-node-id={node.id}
      data-active={active ? 'true' : 'false'}
      className={cn(
        'w-full flex items-center gap-2 rounded-nomi-sm px-2 py-1.5 text-left transition-colors',
        'text-micro leading-tight border border-transparent',
        active
          ? 'bg-nomi-ink-10 text-nomi-accent'
          : 'text-nomi-ink-60 hover:bg-nomi-ink-05 hover:text-nomi-ink',
      )}
      style={{ paddingLeft: `${8 + depth * 10}px` }}
      title={node.title || node.id}
    >
      <span className="grid place-items-center h-4 w-4 shrink-0 rounded-nomi-sm bg-nomi-ink-05 text-micro text-nomi-ink-40" aria-hidden>
        {t(NODE_KIND_LABEL_KEY[node.kind] || 'nodeItem.kind.default')}
      </span>
      <span className="min-w-0 flex-1 truncate">{node.title || node.id}</span>
      {node.derivedFrom ? (
        <span className="shrink-0 rounded-full bg-nomi-accent/10 px-1.5 py-0.5 text-micro text-nomi-accent" title={t('nodeItem.derived')}>
          ↩
        </span>
      ) : null}
    </button>
  )
}
