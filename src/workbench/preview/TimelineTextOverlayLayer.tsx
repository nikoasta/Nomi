import React from 'react'
import { translateDisplayText } from '../../i18n/displayText'
import { useI18n } from '../../i18n/i18nContext'
import type { TimelineTextClip } from '../timeline/timelineTypes'
import { resolveOverlayTransform, resolveTextBox } from '../timeline/textLayout'
import { useWorkbenchStore } from '../workbenchStore'
import OverlaySelectionBox from './OverlaySelectionBox'

type Props = {
  clips: TimelineTextClip[]
  stageSize: { width: number; height: number }
  editingTextId: string
  editingDraft: string
  setEditingTextId: (id: string) => void
  setEditingDraft: (text: string) => void
  commitEditText: (id: string) => void
  beginEditText: (id: string, text: string) => void
}

function resizeTextArea(textarea: HTMLTextAreaElement): void {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

export function TimelineTextOverlayLayer({
  clips,
  stageSize,
  editingTextId,
  editingDraft,
  setEditingTextId,
  setEditingDraft,
  commitEditText,
  beginEditText,
}: Props): JSX.Element | null {
  const { locale, t } = useI18n()
  const selectedTextClipId = useWorkbenchStore((state) => state.selectedTextClipId)
  const selectTimelineTextClip = useWorkbenchStore((state) => state.selectTimelineTextClip)
  const updateTimelineTextClipTransform = useWorkbenchStore((state) => state.updateTimelineTextClipTransform)
  const [snapGuides, setSnapGuides] = React.useState<{ x: number | null; y: number | null }>({ x: null, y: null })

  const handleTextEditFocus = React.useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    event.currentTarget.select()
    resizeTextArea(event.currentTarget)
  }, [])

  const handleTextEditChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingDraft(event.currentTarget.value)
    resizeTextArea(event.currentTarget)
  }, [setEditingDraft])

  if (clips.length === 0) return null

  return (
    <div className="workbench-preview-player__text-layer absolute inset-0 z-[3] pointer-events-none" aria-hidden="false">
      {snapGuides.x !== null ? (
        <div className="absolute top-0 bottom-0 w-px bg-[var(--nomi-accent)] opacity-70 pointer-events-none" style={{ left: `${snapGuides.x * stageSize.width}px` }} aria-hidden="true" />
      ) : null}
      {snapGuides.y !== null ? (
        <div className="absolute left-0 right-0 h-px bg-[var(--nomi-accent)] opacity-70 pointer-events-none" style={{ top: `${snapGuides.y * stageSize.height}px` }} aria-hidden="true" />
      ) : null}
      {clips.map((clip) => {
        const displayText = translateDisplayText(locale, clip.text)
        const box = resolveTextBox(clip, stageSize.width, stageSize.height)
        const transform = resolveOverlayTransform(clip)
        const editing = editingTextId === clip.id
        const selected = selectedTextClipId === clip.id
        const contentStyle: React.CSSProperties = {
          maxWidth: `${box.maxWidthPx}px`,
          fontSize: `${box.fontSizePx}px`,
          fontFamily: box.fontFamily,
          fontWeight: box.fontWeight,
          lineHeight: String(box.lineHeight),
          textAlign: 'center',
          color: 'var(--nomi-ink)',
          padding: box.hasBackdrop ? '0.32em 0.7em' : 0,
          background: box.hasBackdrop ? 'color-mix(in oklch, var(--nomi-paper) 86%, transparent)' : 'transparent',
          border: box.hasBackdrop ? '1px solid var(--nomi-line-soft)' : 'none',
          borderRadius: 'var(--nomi-radius)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }
        const centerStyle: React.CSSProperties = {
          left: `${box.centerX}px`,
          top: `${box.centerY}px`,
          transform: 'translate(-50%, -50%)',
        }
        if (editing) {
          return (
            <textarea
              key={clip.id}
              className="workbench-preview-player__text-edit absolute pointer-events-auto resize-none outline-none overflow-hidden"
              style={{
                ...centerStyle,
                ...contentStyle,
                boxShadow: '0 0 0 2px var(--nomi-accent)',
                minWidth: `${Math.max(120, Math.min(box.maxWidthPx, 260))}px`,
                minHeight: `${Math.max(48, box.fontSizePx * box.lineHeight + (box.hasBackdrop ? box.fontSizePx * 0.64 : 0))}px`,
              }}
              value={editingDraft}
              placeholder={displayText}
              autoFocus
              rows={1}
              onPointerDown={(event) => event.stopPropagation()}
              onFocus={handleTextEditFocus}
              onChange={handleTextEditChange}
              onBlur={() => commitEditText(clip.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.blur()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setEditingTextId('')
                }
              }}
            />
          )
        }
        if (selected) {
          return (
            <OverlaySelectionBox
              key={clip.id}
              centerNorm={transform.position}
              scale={transform.scale}
              stageWidth={stageSize.width}
              stageHeight={stageSize.height}
              onTransform={(patch, commit) => updateTimelineTextClipTransform(clip.id, patch, { commit })}
              onSnapGuides={setSnapGuides}
            >
              <div
                className="cursor-text"
                style={contentStyle}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); beginEditText(clip.id, displayText) }}
                onDoubleClick={(event) => { event.stopPropagation(); beginEditText(clip.id, displayText) }}
                title={t('preview.textDragTitle')}
              >
                {displayText}
              </div>
            </OverlaySelectionBox>
          )
        }
        return (
          <div
            key={clip.id}
            className="workbench-preview-player__text-box absolute pointer-events-auto cursor-pointer select-none"
            style={{ ...centerStyle, ...contentStyle }}
            onPointerDown={(event) => { event.stopPropagation(); selectTimelineTextClip(clip.id) }}
            onDoubleClick={(event) => { event.stopPropagation(); beginEditText(clip.id, displayText) }}
            title={t('preview.textSelectTitle')}
          >
            {displayText}
          </div>
        )
      })}
    </div>
  )
}
