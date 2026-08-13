'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrends } from '@/hooks/use-energy-data'
import type { TimeRange } from '@/lib/types'

interface TrendsChartProps {
  range: TimeRange
  chartType: 'area' | 'bar' | 'line'
  showComparison: boolean
}

export function TrendsChart({ range, chartType, showComparison }: TrendsChartProps) {
  const { data, isLoading } = useTrends(range)

  const chartData = useMemo(() => {
    if (!data?.data) return []
    return data.data.map((item, index) => {
      const date = new Date(item.timestamp)
      const label =
        range === 'daily'
          ? format(date, 'HH:mm')
          : range === 'weekly'
          ? format(date, 'EEE')
          : format(date, 'MMM d')

      // Simulate previous period data for comparison
      const previousValue = Math.round(
        item.consumption * (0.85 + Math.random() * 0.3)
      )

      return {
        label,
        current: item.consumption,
        previous: showComparison ? previousValue : undefined,
        cost: item.cost,
      }
    })
  }, [data, range, showComparison])

  if (isLoading) {
    return <Skeleton className="w-full h-full" />
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 space-y-1.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.name === 'current' ? 'Current' : 'Previous'}:
            </span>
            <span className="text-xs font-medium text-foreground">
              {entry.value} kWh
            </span>
          </div>
        ))}
      </div>
    )
  }

  const commonProps = {
    data: chartData,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
  }

  const xAxisProps = {
    dataKey: 'label',
    tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
    axisLine: { stroke: 'var(--border)' },
    tickLine: false,
  }

  const yAxisProps = {
    tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
    axisLine: false,
    tickLine: false,
    tickFormatter: (value: number) => `${value}`,
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showComparison && <Legend />}
            <Bar
              dataKey="current"
              name="current"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
            />
            {showComparison && (
              <Bar
                dataKey="previous"
                name="previous"
                fill="var(--chart-2)"
                radius={[4, 4, 0, 0]}
                opacity={0.6}
              />
            )}
          </BarChart>
        )
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showComparison && <Legend />}
            <Line
              type="monotone"
              dataKey="current"
              name="current"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {showComparison && (
              <Line
                type="monotone"
                dataKey="previous"
                name="previous"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </LineChart>
        )
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip content={<CustomTooltip />} />
            {showComparison && <Legend />}
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previous"
                name="previous"
                stroke="var(--chart-2)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorPrevious)"
              />
            )}
            <Area
              type="monotone"
              dataKey="current"
              name="current"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCurrent)"
            />
          </AreaChart>
        )
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  )
}
