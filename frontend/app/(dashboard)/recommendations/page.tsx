'use client'

import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Target,
  Clock,
  Calendar,
  Hourglass,
  IndianRupee,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecommendations } from '@/hooks/use-energy-data'
import { applyRecommendation } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/lib/types'

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

const priorityConfig = {
  high: {
    bg: 'bg-critical/5',
    border: 'border-critical/20',
    badge: 'bg-critical/10 text-critical',
    icon: 'text-critical',
  },
  medium: {
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    badge: 'bg-warning/10 text-warning',
    icon: 'text-warning',
  },
  low: {
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    badge: 'bg-primary/10 text-primary',
    icon: 'text-primary',
  },
}

const actionTypeIcons = {
  immediate: Clock,
  scheduled: Calendar,
  'long-term': Hourglass,
}

function RecommendationCard({
  rec,
  isApplying,
  onApply,
}: {
  rec: Recommendation
  isApplying: boolean
  onApply: (id: string) => void
}) {
  const config = priorityConfig[rec.priority]
  const ActionIcon = actionTypeIcons[rec.actionType]
  const isApplied = rec.status === 'applied'

  return (
    <motion.div variants={itemVariants}>
      <Card className={cn('h-full transition-colors hover:shadow-md', config.bg, config.border)}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg bg-background')}>
                <Target className={cn('w-4.5 h-4.5', config.icon)} />
              </div>
              <Badge
                variant="outline"
                className={cn('text-[10px] capitalize', config.badge)}
              >
                {rec.priority} priority
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
              <ActionIcon className="w-3 h-3" />
              <span className="capitalize">{rec.actionType}</span>
            </div>
          </div>

          {/* Content */}
          <h3 className="text-base font-medium text-foreground mb-2">
            {rec.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {rec.description}
          </p>

          {/* Savings & ROI */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-success">
                <IndianRupee className="w-4 h-4" />
                <span className="text-lg font-semibold">
                  {rec.estimatedSavings.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              {rec.roi && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="w-3 h-3" />
                  <span>{rec.roi}% ROI</span>
                </div>
              )}
            </div>
            <Button
              variant={isApplied ? 'outline' : 'ghost'}
              size="sm"
              className="h-8 min-w-24"
              disabled={isApplied || isApplying}
              onClick={() => onApply(rec.id)}
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Applying
                </>
              ) : isApplied ? (
                <>
                  Applied
                  <Check className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Apply
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
          {isApplied && rec.impactReductionPercent ? (
            <p className="mt-3 text-xs font-medium text-success">
              Energy reduced by ~{rec.impactReductionPercent}%
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function RecommendationsPage() {
  const { data, isLoading } = useRecommendations()
  const queryClient = useQueryClient()
  const applyMutation = useMutation({
    mutationFn: applyRecommendation,
    onMutate: async (recommendationId) => {
      await queryClient.cancelQueries({ queryKey: ['recommendations'] })
      const previous = queryClient.getQueryData<Recommendation[]>(['recommendations'])

      queryClient.setQueryData<Recommendation[]>(['recommendations'], (current) =>
        current?.map((rec) =>
          rec.id === recommendationId
            ? {
                ...rec,
                status: 'applied',
                appliedAt: new Date().toISOString(),
              }
            : rec
        )
      )

      return { previous }
    },
    onSuccess: (response) => {
      queryClient.setQueryData<Recommendation[]>(['recommendations'], (current) =>
        current?.map((rec) =>
          rec.id === response.data.recommendationId
            ? {
                ...rec,
                status: 'applied',
                appliedAt: response.data.appliedAt,
                impactReductionPercent: response.data.impactReductionPercent,
              }
            : rec
        )
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['trends'] })
      queryClient.invalidateQueries({ queryKey: ['impact'] })
      toast.success('Optimization Applied', {
        description: `Energy reduced by ~${response.data.impactReductionPercent}%`,
      })
    },
    onError: (_error, _id, context) => {
      queryClient.setQueryData(['recommendations'], context?.previous)
      toast.error('Could not apply optimization')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  const totalSavings = data?.reduce((sum, r) => sum + r.estimatedSavings, 0) || 0
  const highPriorityCount = data?.filter((r) => r.priority === 'high').length || 0
  const appliedCount = data?.filter((r) => r.status === 'applied').length || 0
  const realizedSavings =
    data
      ?.filter((r) => r.status === 'applied')
      .reduce((sum, r) => sum + r.estimatedSavings, 0) || 0
  const avgRoi = data?.length
    ? Math.round(data.reduce((sum, r) => sum + (r.roi || 0), 0) / data.length)
    : 0

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
          Recommendations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Savings optimizer with actionable suggestions to reduce costs
        </p>
      </motion.div>

      {/* Summary Banner */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Potential Savings
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-32 mt-1" />
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <IndianRupee className="w-6 h-6 text-success" />
                      <span className="text-3xl font-semibold text-foreground">
                        {totalSavings.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {isLoading ? '-' : highPriorityCount}
                  </p>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {isLoading ? '-' : data?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {isLoading ? '-' : avgRoi}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg ROI</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Types Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Action Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-3 gap-4">
              {['immediate', 'scheduled', 'long-term'].map((type) => {
                const count = data?.filter((r) => r.actionType === type).length || 0
                const Icon = actionTypeIcons[type as keyof typeof actionTypeIcons]
                return (
                  <div key={type} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-card">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {isLoading ? '-' : count}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations Grid */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-medium text-foreground mb-4">
          Recommended Actions
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl" />
              ))
            : data?.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  isApplying={
                    applyMutation.isPending &&
                    applyMutation.variables === rec.id
                  }
                  onApply={(id) => applyMutation.mutate(id)}
                />
              ))}
        </div>
      </motion.div>

      {/* Implementation Progress */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Implementation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Actions Implemented
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {appliedCount} of {data?.length || 0}
                  </span>
                </div>
                <Progress
                  value={data?.length ? (appliedCount / data.length) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Realized Savings This Month
                </span>
                <span className="font-medium text-success">
                  INR {realizedSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Remaining Opportunity
                </span>
                <span className="font-medium text-foreground">
                  INR {Math.max(totalSavings - realizedSavings, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
