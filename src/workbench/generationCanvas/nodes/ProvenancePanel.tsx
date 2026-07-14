import React from 'react'
import type { GenerationCanvasNode, GenerationProvenance } from '../model/generationCanvasTypes'
import { cn } from '../../../utils/cn'
import { WorkbenchButton } from '../../../design'
import { useI18n } from '../../../i18n/i18nContext'

/**
 * Phase E Task E11 — Provenance viewer.
 *
 * Displays full generation provenance for a node's current result so the
 * user can: see why this looks the way it does, copy the exact prompt, or
 * "regenerate with the same params" (button delegated to caller via
 * onRegenerate). Falls back to a friendly "no provenance recorded" message
 * for legacy v0.4.0 nodes that predate E11.
 */

type Props = {
  node: GenerationCanvasNode
  open: boolean
  onClose: () => void
  /** Optional regenerate handler — if absent, button is hidden. */
  onRegenerate?: (provenance: GenerationProvenance) => void
}

function copyToClipboard(text: string): void {
  if (!text) return
  try { void navigator.clipboard?.writeText(text) } catch { /* ignore */ }
}

export default function ProvenancePanel({ node, open, onClose, onRegenerate }: Props): JSX.Element | null {
  const { t } = useI18n()
  if (!open) return null
  const provenance = node.result?.provenance
  const nodeName = node.title || node.kind
  return (
    <div
      className="fixed inset-0 z-[210] grid place-items-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('tool.provenance.aria')}
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-[560px] max-h-[80vh] overflow-y-auto',
          'bg-nomi-paper border border-nomi-line rounded-nomi-lg shadow-nomi-md p-5',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title font-medium text-nomi-ink m-0">{t('tool.provenance.title', { name: nodeName })}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-nomi-ink-40 hover:text-nomi-ink text-h2 leading-none"
            aria-label={t('tool.provenance.close')}
          >×</button>
        </div>

        {!provenance ? (
          <div className="text-body-sm text-nomi-ink-40 leading-relaxed">
            {t('tool.provenance.empty')}
            <div className="mt-2 text-caption">
              {t('tool.provenance.possibleReasons')}
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>{t('tool.provenance.reasonLegacy')}</li>
                <li>{t('tool.provenance.reasonLocal')}</li>
                <li>{t('tool.provenance.reasonFailed')}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-caption">
            <ProvenanceRow label={t('tool.provenance.provider')} value={provenance.provider || '—'} />
            <ProvenanceRow label={t('tool.provenance.model')} value={provenance.modelKey || '—'} />
            <ProvenanceRow label={t('tool.provenance.time')} value={new Date(provenance.timestamp).toLocaleString()} />
            {typeof provenance.seed === 'number' ? (
              <ProvenanceRow label="Seed" value={String(provenance.seed)} mono />
            ) : null}
            <div>
              <div className="text-micro text-nomi-ink-40 uppercase tracking-wide mb-1">Prompt</div>
              <div className="bg-nomi-bg border border-nomi-line-soft rounded-nomi-sm p-2 text-caption font-mono leading-relaxed whitespace-pre-wrap break-words text-nomi-ink-80">
                {provenance.prompt || t('tool.provenance.emptyPrompt')}
              </div>
              {provenance.prompt ? (
                <button
                  type="button"
                  onClick={() => copyToClipboard(provenance.prompt || '')}
                  className="mt-1 text-micro text-nomi-accent hover:underline"
                >
                  {t('tool.provenance.copyPrompt')}
                </button>
              ) : null}
            </div>
            {provenance.negativePrompt ? (
              <div>
                <div className="text-micro text-nomi-ink-40 uppercase tracking-wide mb-1">Negative Prompt</div>
                <div className="bg-nomi-bg border border-nomi-line-soft rounded-nomi-sm p-2 text-caption font-mono">
                  {provenance.negativePrompt}
                </div>
              </div>
            ) : null}
            {provenance.params && Object.keys(provenance.params).length > 0 ? (
              <div>
                <div className="text-micro text-nomi-ink-40 uppercase tracking-wide mb-1">{t('tool.provenance.params')}</div>
                <pre className="bg-nomi-bg border border-nomi-line-soft rounded-nomi-sm p-2 text-micro font-mono overflow-x-auto text-nomi-ink-80">
{JSON.stringify(provenance.params, null, 2)}
                </pre>
              </div>
            ) : null}
            {provenance.vendorRequestId ? (
              <ProvenanceRow label="Vendor Request ID" value={provenance.vendorRequestId} mono small />
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-nomi-line-soft">
          {provenance && onRegenerate ? (
            <WorkbenchButton variant="primary" onClick={() => onRegenerate(provenance)}>
              {t('tool.provenance.regenerate')}
            </WorkbenchButton>
          ) : null}
          <WorkbenchButton variant="default" onClick={onClose}>
            {t('tool.provenance.close')}
          </WorkbenchButton>
        </div>
      </div>
    </div>
  )
}

function ProvenanceRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }): JSX.Element {
  return (
    <div className="flex items-baseline gap-3">
      <div className={cn(
        'text-nomi-ink-40 shrink-0 w-[80px] text-micro',
      )}>{label}</div>
      <div className={cn(
        'flex-1 text-nomi-ink-80',
        mono ? 'font-mono' : '',
        small ? 'text-micro' : 'text-caption',
        'break-words',
      )}>{value}</div>
    </div>
  )
}
