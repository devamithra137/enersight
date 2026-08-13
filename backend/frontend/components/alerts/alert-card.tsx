'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  Gauge,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

interface AlertCardProps {
  alert: Alert
  onResolve?: (id: string) => void
}

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-critical/5',
    border: 'border-critical/20',
    iconColor: 'text-critical',
    badge: 'bg-critical/10 text-critical',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    iconColor: 'text-warning',
    badge: 'bg-warning/10 text-warning',
  },
  info: {
    icon: Info,
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    iconColor: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
}

export function AlertCard({ alert, onResolve }: AlertCardProps) {
  const config = alertConfig[alert.type]
  const Icon = config.icon
  const timestamp = new Date(alert.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'relative p-4 rounded-xl border transition-colors',
        config.bg,
        config.border,
        alert.resolved && 'opacity-60'
      )}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
            alert.resolved ? 'bg-muted' : `${config.bg}`
          )}
        >
          {alert.resolved ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <Icon className={cn('w-5 h-5', config.iconColor)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-foreground line-clamp-1">
                {alert.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {alert.message}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-[10px] capitalize',
                alert.resolved ? 'bg-muted text-muted-foreground' : config.badge
              )}
            >
              {alert.resolved ? 'Resolved' : alert.type}
            </Badge>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(timestamp, { addSuffix: true })}
              </span>
            </div>
            <span className="hidden sm:inline">
              {format(timestamp, 'MMM d, HH:mm')}
            </span>
            {alert.category && (
              <div className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                <span>{alert.category}</span>
              </div>
            )}
            {alert.value && alert.threshold && (
              <span className="font-medium text-foreground">
                {alert.value} / {alert.threshold} kWh
              </span>
            )}
          </div>

          {/* Actions */}
          {!alert.resolved && onResolve && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResolve(alert.id)}
                className="h-7 text-xs"
              >
                Mark Resolved
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
