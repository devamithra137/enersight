'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'success' | 'warning'
}

export function KpiCard({
  title,
  value,
  unit,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
}: KpiCardProps) {
  const isPositiveChange = change && change > 0
  const isNegativeChange = change && change < 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5',
        variant === 'primary' && 'border-primary/20 bg-primary/5',
        variant === 'success' && 'border-success/20 bg-success/5',
        variant === 'warning' && 'border-warning/20 bg-warning/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-muted-foreground">
                {unit}
              </span>
            )}
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {isPositiveChange ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : isNegativeChange ? (
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isPositiveChange && 'text-success',
                  isNegativeChange && 'text-destructive',
                  !isPositiveChange && !isNegativeChange && 'text-muted-foreground'
                )}
              >
                {isPositiveChange && '+'}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            variant === 'default' && 'bg-secondary',
            variant === 'primary' && 'bg-primary/10',
            variant === 'success' && 'bg-success/10',
            variant === 'warning' && 'bg-warning/10'
          )}
        >
          <Icon
            className={cn(
              'w-5 h-5',
              variant === 'default' && 'text-muted-foreground',
              variant === 'primary' && 'text-primary',
              variant === 'success' && 'text-success',
              variant === 'warning' && 'text-warning'
            )}
          />
        </div>
      </div>
    </motion.div>
  )
}
