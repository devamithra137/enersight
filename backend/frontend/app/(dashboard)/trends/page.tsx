'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChartIcon, BarChart3, LineChart, Calendar, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendsChart } from '@/components/trends/trends-chart'
import { CategoryBreakdownChart } from '@/components/trends/category-breakdown-chart'
import { useTrends } from '@/hooks/use-energy-data'
import type { TimeRange } from '@/lib/types'

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

type ChartType = 'area' | 'bar' | 'line'

export default function TrendsPage() {
  const [range, setRange] = useState<TimeRange>('daily')
  const [chartType, setChartType] = useState<ChartType>('area')
  const [showComparison, setShowComparison] = useState(false)

  const { data, isLoading } = useTrends(range)

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
          Trends
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deep analytics lab for exploring usage behavior over time
        </p>
      </motion.div>

      {/* Controls Bar */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Time Range Selector */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <ToggleGroup
                  type="single"
                  value={range}
                  onValueChange={(value) => value && setRange(value as TimeRange)}
                  className="bg-secondary rounded-lg p-1"
                >
                  <ToggleGroupItem
                    value="daily"
                    className="px-4 py-1.5 text-xs data-[state=on]:bg-card"
                  >
                    Daily
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="weekly"
                    className="px-4 py-1.5 text-xs data-[state=on]:bg-card"
                  >
                    Weekly
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="monthly"
                    className="px-4 py-1.5 text-xs data-[state=on]:bg-card"
                  >
                    Monthly
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Chart Type & Comparison */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Switch
                    id="comparison"
                    checked={showComparison}
                    onCheckedChange={setShowComparison}
                  />
                  <Label htmlFor="comparison" className="text-xs text-muted-foreground">
                    Compare
                  </Label>
                </div>

                <ToggleGroup
                  type="single"
                  value={chartType}
                  onValueChange={(value) => value && setChartType(value as ChartType)}
                >
                  <ToggleGroupItem value="area" className="px-2.5">
                    <AreaChartIcon className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bar" className="px-2.5">
                    <BarChart3 className="w-4 h-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="line" className="px-2.5">
                    <LineChart className="w-4 h-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Energy Consumption
              </CardTitle>
              {!isLoading && data?.summary && (
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium text-foreground">
                      {data.summary.totalConsumption.toLocaleString()} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average: </span>
                    <span className="font-medium text-foreground">
                      {data.summary.averageConsumption} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Peak: </span>
                    <span className="font-medium text-foreground">
                      {data.summary.peakConsumption} kWh
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-96">
              <TrendsChart
                range={range}
                chartType={chartType}
                showComparison={showComparison}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-5 h-64">
            <CategoryBreakdownChart />
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Detailed Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Time
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Consumption (kWh)
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                      Cost (₹)
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Skeleton className="h-4 w-16 ml-auto" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Skeleton className="h-4 w-14 ml-auto" />
                        </td>
                        <td className="py-3 px-4">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    data?.data.slice(-10).reverse().map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">
                          {item.consumption}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          ₹{item.cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {item.category}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
