import { cn } from '@/lib/utils'
import { getOpportunityLabel } from '@/lib/opportunity-score'
import { OPPORTUNITY_LABELS } from '@/types'

interface OpportunityBadgeProps {
  score: number
  showScore?: boolean
  className?: string
}

export function OpportunityBadge({ score, showScore = true, className }: OpportunityBadgeProps) {
  const label = getOpportunityLabel(score)
  const cfg = OPPORTUNITY_LABELS[label]

  if (label === 'skip') return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        cfg.bgColor, cfg.color,
        className
      )}
    >
      {cfg.emoji}
      {showScore ? score : cfg.text}
    </span>
  )
}
