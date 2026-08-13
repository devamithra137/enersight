'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAlerts } from '@/hooks/use-energy-data'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

const alertIcons = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

const alertStyles = {
  critical: 'bg-critical/10 text-critical border-critical/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-primary/10 text-primary border-primary/20',
}

function AlertItem({ alert }: { alert: Alert }) {
  const Icon = alertIcons[alert.type]

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        alertStyles[alert.type]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {alert.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export function AlertsPreview() {
  const { data, isLoading } = useAlerts()

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    )
  }

  const recentAlerts = data?.filter((a) => !a.resolved).slice(0, 3) || []
  const unresolvedCount = data?.filter((a) => !a.resolved).length || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Recent Alerts</h3>
        {unresolvedCount > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-critical/10 text-critical">
            {unresolvedCount} active
          </span>
        )}
      </div>

      <div className="space-y-2">
        {recentAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No active alerts
          </p>
        ) : (
          recentAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))
        )}
      </div>

      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link href="/alerts">
          View all alerts
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
