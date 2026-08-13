'use client'

import { Clock, Gauge } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { usePeakUsage, useCategoryUsage } from '@/hooks/use-energy-data'

export function PeakUsageSummary() {
  const { data: peakData, isLoading: peakLoading } = usePeakUsage()
  const { data: categoryData, isLoading: categoryLoading } = useCategoryUsage()

  if (peakLoading || categoryLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  const topCategory = categoryData?.[0]

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Peak Usage</h3>
        <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground">
              {peakData?.value || 0} kWh
            </p>
            <p className="text-xs text-muted-foreground">
              at {peakData?.time || '--:--'} ({peakData?.percentageOfDaily || 0}%
              of daily)
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Top Consumer
        </h3>
        {topCategory && (
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {topCategory.category}
                </span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {topCategory.percentage}%
              </span>
            </div>
            <Progress value={topCategory.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {topCategory.consumption.toLocaleString()} kWh consumed
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Category Breakdown
        </h3>
        <div className="space-y-2">
          {categoryData?.slice(1, 4).map((cat) => (
            <div key={cat.category} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs text-muted-foreground flex-1">
                {cat.category}
              </span>
              <span className="text-xs font-medium text-foreground">
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
