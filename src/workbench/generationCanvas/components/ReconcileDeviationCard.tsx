import React from 'react'
import { cn } from '../../../utils/cn'
import { WorkbenchButton } from '../../../design'
import type { ReconcileDeviation } from '../agent/reconcile'
import { useI18n } from '../../../i18n/i18nContext'
import { canvasTranslate, type CanvasI18nKey } from '../canvasI18n'

type ReconcileDeviationCardProps = {
  deviations: ReconcileDeviation[]
  /** 一键整笔撤销(S6-2 后整笔提议=一个 undo barrier,一次 undo 即全退)。
   *  内容偏差卡(画面校验)不传:verify 没改任何东西,无可撤销。 */
  onUndoAll?: () => void
  onDismiss: () => void
  /** 让 AI 用模型支持的方式把没接上的连接重连;内容偏差=发修复消息让 AI 改 prompt/重生(走确认闸)。 */
  onAiFix?: () => void
  /** 半自动闭环预算耗尽(Stage 2):隐藏「让 AI 修」、改显「已尽力」提示,绝不无限回灌。 */
  exhausted?: boolean
  /** 时间线内嵌(方案三):去外框,导轨提供视觉结构。 */
  flat?: boolean
}

const trunc = (value: unknown, max = 40): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** 边类偏差:where 已是「源标题」→「目标标题」,正文不再重复 field。 */
const isEdgeField = (field: string): boolean => field === '引用边' || field === '边语义'

/** 一条偏差的人话正文:内容(画面校验)→直接显原因;边→为什么没接上;其余结构→批准 vs 实际。 */
function detailLine(d: ReconcileDeviation, tCanvas: (key: CanvasI18nKey, params?: Record<string, string | number>) => string): string {
  if (d.kind === 'content') return d.reason ? String(d.reason) : tCanvas('reconcile.contentMismatch', { actual: trunc(d.actual) })
  if (d.field === '引用边') return d.reason ? tCanvas('reconcile.edgeMissingWithReason', { reason: String(d.reason) }) : tCanvas('reconcile.edgeMissing')
  if (d.field === '边语义') return tCanvas('reconcile.edgeModeMismatch', { actual: trunc(d.actual), expected: trunc(d.expected) })
  if (d.field === '节点') return tCanvas('reconcile.nodeMismatch', { expected: trunc(d.expected), actual: trunc(d.actual) })
  return tCanvas('reconcile.genericMismatch', { expected: trunc(d.expected), actual: trunc(d.actual) })
}

/**
 * 对账偏差卡(S6-3,N12 → 2026-06-13 完整版重设计):用节点标题+人话说明「哪些没按计划生效、
 * 为什么」,而不是甩原始 id + 黑话。正常对账一致时永不出现——它是诚实纪律的兜底面,不是常驻 UI。
 */
export default function ReconcileDeviationCard({ deviations, onUndoAll, onDismiss, onAiFix, exhausted = false, flat = false }: ReconcileDeviationCardProps): JSX.Element {
  const { locale } = useI18n()
  const tCanvas = React.useCallback((key: CanvasI18nKey, params?: Record<string, string | number>) => canvasTranslate(locale, key, params), [locale])
  const hasEdgeMiss = deviations.some((d) => d.field === '引用边')
  const hasContentMiss = deviations.some((d) => d.kind === 'content')
  const hasStructural = deviations.some((d) => d.kind !== 'content')
  // 「让 AI 修」对结构边丢失=重连边;对画面偏差=改 prompt/重生(走确认闸)。预算耗尽则不再给。
  const showAiFix = Boolean(onAiFix) && (hasEdgeMiss || hasContentMiss) && !exhausted
  // 撤销只对结构偏差有意义(verify 没改东西);内容偏差卡无可撤销。
  const showUndo = Boolean(onUndoAll) && hasStructural
  const captionText = hasContentMiss
    ? tCanvas('reconcile.contentCaption')
    : tCanvas('reconcile.structuralCaption')
  return (
    <div
      className={cn('flex flex-col gap-2', flat ? '' : 'p-3 rounded-nomi border border-nomi-line bg-nomi-paper')}
      data-reconcile-deviation-card="true"
      aria-label={tCanvas('reconcile.aria')}
    >
      <div className={cn('text-caption text-nomi-ink-60')}>
        {captionText}
      </div>
      <ul className={cn('flex flex-col gap-1 list-none p-0 m-0')}>
        {deviations.map((deviation, index) => (
          <li key={index} className={cn('flex flex-col gap-[2px] p-2 rounded-nomi-sm bg-nomi-ink-05 text-caption')}>
            <span className={cn('text-nomi-ink font-medium')}>
              {deviation.where}
              {isEdgeField(deviation.field) ? '' : ` · ${deviation.field}`}
            </span>
            <span className={cn('text-nomi-ink-60')}>{detailLine(deviation, tCanvas)}</span>
          </li>
        ))}
      </ul>
      {exhausted ? (
        <div className={cn('text-caption text-nomi-ink-40')}>{tCanvas('reconcile.exhausted')}</div>
      ) : null}
      {/* flex-wrap + shrink-0:按钮在窄面板放不下时整组换行,不挤压不竖排。 */}
      <div className={cn('flex flex-wrap items-center gap-2')}>
        {showAiFix ? (
          <WorkbenchButton className={cn('shrink-0')} variant="accent" size="sm" data-reconcile-ai-fix="true" onClick={onAiFix}>
            {tCanvas('reconcile.aiFix')}
          </WorkbenchButton>
        ) : null}
        <div className={cn('flex items-center gap-2 ml-auto')}>
          <WorkbenchButton className={cn('shrink-0')} variant="default" size="sm" onClick={onDismiss}>
            {showUndo ? tCanvas('reconcile.keep') : tCanvas('reconcile.ok')}
          </WorkbenchButton>
          {showUndo ? (
            <WorkbenchButton className={cn('shrink-0')} variant="primary" size="sm" data-reconcile-undo-all="true" onClick={onUndoAll}>
              {tCanvas('reconcile.undo')}
            </WorkbenchButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
