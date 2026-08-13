'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategoryUsage } from '@/hooks/use-energy-data'
import { cn } from '@/lib/utils'

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
]

export function CategoryBreakdownChart() {
  const { data, isLoading } = useCategoryUsage()

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Skeleton className="w-48 h-48 rounded-full" />
      </div>
    )
  }

  const chartData = data?.map((cat, index) => ({
    name: cat.category,
    value: cat.consumption,
    percentage: cat.percentage,
    trend: cat.trend,
    color: COLORS[index % COLORS.length],
  }))

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-critical" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-success" />
    return <Minus className="w-3 h-3 text-muted-foreground" />
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-medium text-foreground mb-4">
        Category Distribution
      </h3>
      <div className="flex-1 flex items-center gap-6">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} kWh`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          {chartData?.map((cat, index) => (
            <div key={cat.name} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {cat.name}
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TrendIcon trend={cat.trend} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {cat.value.toLocaleString()} kWh
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
