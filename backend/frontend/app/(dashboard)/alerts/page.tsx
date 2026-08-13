'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Bell,
  Activity,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertCard } from '@/components/alerts/alert-card'
import { useAlerts } from '@/hooks/use-energy-data'
import { cn } from '@/lib/utils'
import type { Alert } from '@/lib/types'

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

type FilterType = 'all' | 'critical' | 'warning' | 'info' | 'resolved'

export default function AlertsPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const { data, isLoading } = useAlerts()

  const stats = useMemo(() => {
    if (!data) return { total: 0, critical: 0, warning: 0, info: 0, resolved: 0 }
    return {
      total: data.length,
      critical: data.filter((a) => a.type === 'critical' && !a.resolved).length,
      warning: data.filter((a) => a.type === 'warning' && !a.resolved).length,
      info: data.filter((a) => a.type === 'info' && !a.resolved).length,
      resolved: data.filter((a) => a.resolved).length,
    }
  }, [data])

  const filteredAlerts = useMemo(() => {
    if (!data) return []
    switch (filter) {
      case 'critical':
        return data.filter((a) => a.type === 'critical' && !a.resolved)
      case 'warning':
        return data.filter((a) => a.type === 'warning' && !a.resolved)
      case 'info':
        return data.filter((a) => a.type === 'info' && !a.resolved)
      case 'resolved':
        return data.filter((a) => a.resolved)
      default:
        return data
    }
  }, [data, filter])

  const handleResolve = (id: string) => {
    // In a real app, this would call an API
    console.log('[v0] Resolving alert:', id)
  }

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
          Alerts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring center for detecting and managing anomalies
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        <Card className="border-critical/20 bg-critical/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-critical/10">
                <AlertTriangle className="w-4 h-4 text-critical" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {isLoading ? '-' : stats.critical}
                </p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-warning/10">
                <AlertCircle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {isLoading ? '-' : stats.warning}
                </p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {isLoading ? '-' : stats.info}
                </p>
                <p className="text-xs text-muted-foreground">Info</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">
                  {isLoading ? '-' : stats.resolved}
                </p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters & Alert List */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                Alert Feed
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <ToggleGroup
                  type="single"
                  value={filter}
                  onValueChange={(val) => val && setFilter(val as FilterType)}
                  className="bg-secondary rounded-lg p-1"
                >
                  <ToggleGroupItem
                    value="all"
                    className="px-3 py-1 text-xs data-[state=on]:bg-card"
                  >
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="critical"
                    className="px-3 py-1 text-xs data-[state=on]:bg-card"
                  >
                    Critical
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="warning"
                    className="px-3 py-1 text-xs data-[state=on]:bg-card"
                  >
                    Warnings
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="resolved"
                    className="px-3 py-1 text-xs data-[state=on]:bg-card"
                  >
                    Resolved
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))
              ) : filteredAlerts.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No alerts match the current filter
                  </p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onResolve={handleResolve}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Timeline Summary */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              Incident Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 pl-8">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))
                ) : (
                  data?.slice(0, 5).map((alert, index) => (
                    <div key={alert.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div
                        className={cn(
                          'absolute left-2.5 w-3 h-3 rounded-full border-2 border-card',
                          alert.resolved
                            ? 'bg-success'
                            : alert.type === 'critical'
                            ? 'bg-critical'
                            : alert.type === 'warning'
                            ? 'bg-warning'
                            : 'bg-primary'
                        )}
                      />
                      <div className="pl-8">
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-foreground mt-0.5">
                          {alert.title}
                        </p>
                        {alert.resolved && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] bg-success/10 text-success"
                          >
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
