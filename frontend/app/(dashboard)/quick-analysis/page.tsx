'use client'

import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calculator,
  Gauge,
  IndianRupee,
  Leaf,
  Lightbulb,
  Loader2,
  TrendingUp,
  Users,
  Home,
  PiggyBank,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createAnalysis } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AnalysisInput, AnalysisResult } from '@/lib/types'

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

const levelConfig = {
  efficient: {
    label: 'Efficient',
    badge: 'bg-success/10 text-success border-success/20',
    card: 'border-success/20 bg-success/5',
    text: 'text-success',
    progress: 'bg-success',
  },
  moderate: {
    label: 'Moderate',
    badge: 'bg-warning/10 text-warning border-warning/20',
    card: 'border-warning/20 bg-warning/5',
    text: 'text-warning',
    progress: 'bg-warning',
  },
  high: {
    label: 'High Usage',
    badge: 'bg-critical/10 text-critical border-critical/20',
    card: 'border-critical/20 bg-critical/5',
    text: 'text-critical',
    progress: 'bg-critical',
  },
}

function ResultCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'default',
}: {
  title: string
  value: string
  detail?: string
  icon: typeof Calculator
  tone?: 'default' | 'success' | 'warning' | 'critical'
}) {
  return (
    <Card
      className={cn(
        tone === 'success' && 'border-success/20 bg-success/5',
        tone === 'warning' && 'border-warning/20 bg-warning/5',
        tone === 'critical' && 'border-critical/20 bg-critical/5'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
              {value}
            </p>
            {detail ? (
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            ) : null}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-secondary',
              tone === 'success' && 'bg-success/10',
              tone === 'warning' && 'bg-warning/10',
              tone === 'critical' && 'bg-critical/10'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 text-muted-foreground',
                tone === 'success' && 'text-success',
                tone === 'warning' && 'text-warning',
                tone === 'critical' && 'text-critical'
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function QuickAnalysisPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AnalysisInput>({
    currentUnits: 320,
    previousUnits: 280,
    familyMembers: 4,
    houseType: '2BHK',
  })
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const mutation = useMutation({
    mutationFn: createAnalysis,
    onSuccess: (result) => {
      setAnalysis(result)
      queryClient.setQueryData(['analysis-latest'], result)
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['trends'] })
      queryClient.invalidateQueries({ queryKey: ['impact'] })
      queryClient.invalidateQueries({ queryKey: ['category-usage'] })
      toast.success('Usage analysis ready', {
        description: `Efficiency score: ${result.efficiencyScore}/100`,
      })
    },
    onError: (error) => {
      toast.error('Analysis failed', {
        description:
          error instanceof Error ? error.message : 'Please check your inputs',
      })
    },
  })

  const currentLevel = analysis?.efficiencyLevel || 'moderate'
  const config = levelConfig[currentLevel]
  const changeTone = useMemo(() => {
    if (!analysis) return 'default'
    if (analysis.changePercent <= 0) return 'success'
    if (analysis.changePercent <= 15) return 'warning'
    return 'critical'
  }, [analysis])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate(form)
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Quick Analysis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estimate your bill, footprint, savings, and recommendations from total monthly units
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                Household Input
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="currentUnits">Total Units (Current Month)</Label>
                  <Input
                    id="currentUnits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.currentUnits}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        currentUnits: Number(event.target.value),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousUnits">Previous Month Units</Label>
                  <Input
                    id="previousUnits"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.previousUnits}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        previousUnits: Number(event.target.value),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyMembers">Number of Family Members</Label>
                  <Input
                    id="familyMembers"
                    type="number"
                    min="1"
                    step="1"
                    value={form.familyMembers}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        familyMembers: Number(event.target.value),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>House Type</Label>
                  <Select
                    value={form.houseType}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        houseType: value as AnalysisInput['houseType'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select house type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1BHK">1BHK</SelectItem>
                      <SelectItem value="2BHK">2BHK</SelectItem>
                      <SelectItem value="3BHK">3BHK</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing
                    </>
                  ) : (
                    <>
                      Analyze Usage
                      <TrendingUp className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          {analysis ? (
            <>
              <Card className={config.card}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.badge}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {analysis.houseType} - {analysis.familyMembers} members
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Per person usage is {analysis.perPersonUsage} kWh/month
                      </p>
                    </div>
                    <div className="min-w-44">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className={cn('font-mono text-3xl font-semibold', config.text)}>
                          {analysis.efficiencyScore}
                        </span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <Progress value={analysis.efficiencyScore} className="mt-2 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ResultCard
                  title="Estimated Bill"
                  value={`INR ${analysis.estimatedBill.toLocaleString()}`}
                  detail={`Rate: INR ${analysis.assumptions?.rate ?? '--'}/kWh`}
                  icon={IndianRupee}
                  tone={analysis.efficiencyLevel === 'high' ? 'critical' : 'success'}
                />
                <ResultCard
                  title="Usage Change"
                  value={`${analysis.changePercent > 0 ? '+' : ''}${analysis.changePercent}%`}
                  detail="Compared to previous month"
                  icon={TrendingUp}
                  tone={changeTone}
                />
                <ResultCard
                  title="Efficiency Score"
                  value={`${analysis.efficiencyScore}/100`}
                  detail={config.label}
                  icon={Gauge}
                  tone={
                    analysis.efficiencyLevel === 'efficient'
                      ? 'success'
                      : analysis.efficiencyLevel === 'moderate'
                        ? 'warning'
                        : 'critical'
                  }
                />
                <ResultCard
                  title="Carbon Footprint"
                  value={`${analysis.carbonFootprint.toLocaleString()} kg CO2`}
                  detail="Estimated from monthly units"
                  icon={Leaf}
                />
                <ResultCard
                  title="Suggested Savings"
                  value={`INR ${analysis.suggestedSavings.toLocaleString()}`}
                  detail={
                    analysis.savingsPercent
                      ? `${analysis.savingsPercent}% realistic reduction target`
                      : 'Maintain current usage'
                  }
                  icon={PiggyBank}
                  tone={analysis.suggestedSavings > 0 ? 'success' : 'default'}
                />
                <ResultCard
                  title="Household Usage"
                  value={`${analysis.currentUnits.toLocaleString()} kWh`}
                  detail={`${analysis.previousUnits.toLocaleString()} kWh last month`}
                  icon={Home}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="space-y-3">
                      {analysis.recommendations.map((item) => (
                        <div
                          key={item}
                          className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm text-foreground"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Estimated Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="space-y-4">
                      {analysis.categoryBreakdown.map((item) => (
                        <div key={item.category}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">
                              {item.category}
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {item.units} kWh - {item.percentage}%
                            </span>
                          </div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
                <Calculator className="mb-4 h-10 w-10 text-muted-foreground/60" />
                <h2 className="text-lg font-medium text-foreground">
                  Enter your household usage
                </h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Run an analysis to update dashboard cards and charts from total units, even when IoT data is unavailable.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
