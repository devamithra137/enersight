'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrends } from '@/hooks/use-energy-data'

export function MiniTrendChart() {
  const { data, isLoading } = useTrends('daily')

  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.slice(-12).map((item) => ({
      time: format(new Date(item.timestamp), 'HH:mm'),
      consumption: item.consumption,
    }))
  }, [data])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="flex-1" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Live Usage</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 12 readings</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg font-semibold text-foreground">
            {data?.summary.averageConsumption || 0}
          </p>
          <p className="font-mono text-xs text-muted-foreground">kWh avg</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value} kWh`, 'Usage']}
            />
            <Area
              type="monotone"
              dataKey="consumption"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConsumption)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
