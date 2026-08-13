'use client'

import Link from 'next/link'
import { ArrowRight, Zap, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRecommendations } from '@/hooks/use-energy-data'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/lib/types'

const priorityStyles = {
  high: 'bg-critical/10 text-critical border-critical/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground',
}

function RecommendationItem({ rec }: { rec: Recommendation }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
        <Zap className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground line-clamp-1">
            {rec.title}
          </p>
          <Badge
            variant="outline"
            className={cn('text-[10px] shrink-0', priorityStyles[rec.priority])}
          >
            {rec.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-success">
          <IndianRupee className="w-3 h-3" />
          <span className="text-xs font-medium">
            {rec.estimatedSavings.toLocaleString()}/mo
          </span>
        </div>
      </div>
    </div>
  )
}

export function RecommendationsPreview() {
  const { data, isLoading } = useRecommendations()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20" />
      </div>
    )
  }

  const topRecommendation = data?.[0]
  const totalSavings =
    data?.reduce((sum, r) => sum + r.estimatedSavings, 0) || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Top Recommendation</h3>
        <div className="flex items-center gap-1 text-success">
          <IndianRupee className="w-3 h-3" />
          <span className="text-xs font-medium">
            {totalSavings.toLocaleString()} potential
          </span>
        </div>
      </div>

      {topRecommendation ? (
        <RecommendationItem rec={topRecommendation} />
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No recommendations
        </p>
      )}

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link href="/recommendations">
          View all recommendations
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
