// 技术自检 ⚠ 徽标(harness S4-2b)。只标记不裁决:tooltip 给人话原因,内容原样保留。
// 外挂组件:BaseGenerationNode 是白名单巨壳(R12),不往里塞实现。
import React from 'react'
import { cn } from '../../../utils/cn'
import { canvasRuntimeTranslate } from '../canvasI18n'

type TechnicalReview = { verdict?: string; checks?: { suspect: boolean; detail: string }[] }

export function TechnicalReviewBadge({ meta }: { meta?: Record<string, unknown> }): JSX.Element | null {
  const review = (meta as { technicalReview?: TechnicalReview } | undefined)?.technicalReview
  if (review?.verdict !== 'suspect') return null
  const reasons = (review.checks || []).filter((check) => check.suspect).map((check) => check.detail).join(';')
  return (
    <span
      className={cn('text-micro py-[3px] px-2 rounded-nomi-sm bg-workbench-danger-soft text-workbench-danger')}
      title={canvasRuntimeTranslate('technicalReview.title', { reason: reasons || canvasRuntimeTranslate('technicalReview.defaultReason') })}
      data-technical-review='suspect'
    >
      ⚠
    </span>
  )
}
