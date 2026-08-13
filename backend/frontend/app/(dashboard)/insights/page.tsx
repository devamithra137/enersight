'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Gauge,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useInsights, useImpact, useCategoryUsage } from '@/hooks/use-energy-data'
import { cn } from '@/lib/utils'
import type { Insight } from '@/lib/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const impactStyles = {
  high: 'bg-critical/10 text-critical border-critical/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-primary/10 text-primary border-primary/20',
}

function InsightCard({ insight }: { insight: Insight }) {
  const TrendIcon =
    insight.metric.trend === 'up'
      ? TrendingUp
      : insight.metric.trend === 'down'
      ? TrendingDown
      : Minus

  const trendColor =
    insight.metric.trend === 'up'
      ? 'text-critical'
      : insight.metric.trend === 'down'
      ? 'text-success'
      : 'text-muted-foreground'

  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] capitalize', impactStyles[insight.impact])}
              >
                {insight.impact} impact
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-secondary">
              {insight.category}
            </span>
          </div>

          <h3 className="text-base font-medium text-foreground mb-2">
            {insight.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-semibold text-foreground">
                {insight.metric.value}
              </span>
              <span className="text-sm text-muted-foreground">
                {insight.metric.unit}
              </span>
            </div>
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {insight.metric.changePercent > 0 && '+'}
                {insight.metric.changePercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function InsightsPage() {
  const { data: insights, isLoading: insightsLoading } = useInsights()
  const { data: impact, isLoading: impactLoading } = useImpact()
  const { data: categories, isLoading: categoriesLoading } = useCategoryUsage()

  const isLoading = insightsLoading || impactLoading || categoriesLoading

  const topCategory = categories?.[0]

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Intelligence report explaining your energy consumption patterns
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        variants={itemVariants}
      >
        {/* Consumption Change */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  vs Previous Period
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <>
                      <span className="text-xl font-semibold text-foreground">
                        {Math.abs(impact?.comparedToPrevious.consumption || 0)}%
                      </span>
                      {(impact?.comparedToPrevious.consumption || 0) < 0 ? (
                        <TrendingDown className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-critical" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {(impact?.comparedToPrevious.consumption || 0) < 0
                ? 'Consumption decreased compared to last period'
                : 'Consumption increased compared to last period'}
            </p>
          </CardContent>
        </Card>

        {/* Top Category */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                <Gauge className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Highest Consumer
                </p>
                {isLoading ? (
                  <Skeleton className="h-6 w-20 mt-0.5" />
                ) : (
                  <p className="text-xl font-semibold text-foreground mt-0.5">
                    {topCategory?.category || '-'}
                  </p>
                )}
              </div>
            </div>
            {!isLoading && topCategory && (
              <div className="space-y-1.5">
                <Progress value={topCategory.percentage} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {topCategory.percentage}% of total consumption
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Efficiency */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Efficiency Score</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-0.5" />
                ) : (
                  <p className="text-xl font-semibold text-foreground mt-0.5">
                    {impact?.efficiency || 0}%
                  </p>
                )}
              </div>
            </div>
            {!isLoading && (
              <div className="space-y-1.5">
                <Progress value={impact?.efficiency || 0} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Based on usage optimization metrics
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Period Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Total Consumption
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-24" />
                ) : (
                  <p className="text-xl font-semibold text-foreground">
                    {impact?.totalConsumption.toLocaleString() || 0}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      kWh
                    </span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="text-xl font-semibold text-foreground">
                    ₹{impact?.totalCost.toLocaleString() || 0}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Carbon Footprint
                </p>
                {isLoading ? (
                  <Skeleton className="h-7 w-20" />
                ) : (
                  <p className="text-xl font-semibold text-foreground">
                    {impact?.carbonFootprint || 0}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      tons CO₂
                    </span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cost Change</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-semibold text-foreground">
                      {Math.abs(impact?.comparedToPrevious.cost || 0)}%
                    </p>
                    {(impact?.comparedToPrevious.cost || 0) < 0 ? (
                      <TrendingDown className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-critical" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-medium text-foreground mb-4">
          Key Insights
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {insightsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))
            : insights?.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
