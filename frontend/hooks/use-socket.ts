'use client'

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEnergyStore } from '@/lib/store'
import { socket } from '@/lib/api'
import {
  type EnergyUpdatePayload,
  LIVE_ENERGY_QUERY_KEY,
  applyLiveReadingToSummary,
  extractEnergyReadings,
  mergeEnergyReadings,
} from '@/lib/live-energy'
import { toast } from 'sonner'
import type { Alert } from '@/lib/types'
import type { DashboardSummary } from '@/lib/types'

export function useSocket() {
  const queryClient = useQueryClient()
  const { setConnected, setLastSynced, addLiveAlert, settings } = useEnergyStore()

  const handleEnergyUpdate = useCallback((payload: EnergyUpdatePayload) => {
    const incomingReadings = extractEnergyReadings(payload)

    if (incomingReadings.length === 0) {
      return
    }

    console.log('Received update', payload)

    const nextReadings = queryClient.setQueryData(
      LIVE_ENERGY_QUERY_KEY,
      (current: typeof incomingReadings | undefined) =>
        mergeEnergyReadings(current, incomingReadings)
    )

    queryClient.setQueryData(
      ['dashboard-summary'],
      (current: DashboardSummary | undefined) =>
        applyLiveReadingToSummary(
          current,
          (nextReadings as typeof incomingReadings | undefined) || incomingReadings
        )
    )

    setLastSynced(new Date())
  }, [queryClient, setLastSynced])

  const handleAlert = useCallback(
    (payload: Alert | { message?: string; severity?: string; reading?: any }) => {
      const alert: Alert =
        'id' in payload
          ? payload
          : {
              id: `live:${payload.reading?._id || Date.now()}`,
              type: payload.severity === 'critical' ? 'critical' : 'warning',
              title:
                payload.severity === 'critical'
                  ? 'Critical spike detected'
                  : 'Spike detected',
              message: payload.message || 'A live anomaly was detected',
              timestamp: payload.reading?.timestamp || new Date().toISOString(),
              resolved: false,
              category: payload.reading?.category,
              value: payload.reading?.units,
            }

      addLiveAlert(alert)
      queryClient.invalidateQueries({ queryKey: ['alerts'] })

      if (settings.notifications.alerts) {
        toast.error(alert.title, {
          description: alert.message,
          duration: 5000,
        })
      }
    },
    [addLiveAlert, queryClient, settings.notifications.alerts]
  )

  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected')
      setConnected(true)
      setLastSynced(new Date())
    }

    const handleDisconnect = (reason?: string) => {
      console.log('Socket disconnected', reason)
      setConnected(false)
    }

    const handleRecommendationApplied = (payload: {
      impactReductionPercent?: number
    }) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })

      if (payload.impactReductionPercent) {
        toast.success('Optimization Applied', {
          description: `Energy reduced by ~${payload.impactReductionPercent}%`,
          duration: 3500,
        })
      }
    }

    const handleAlertResolved = () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    }

    const handleAnalysisUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-latest'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['trends'] })
      queryClient.invalidateQueries({ queryKey: ['impact'] })
      queryClient.invalidateQueries({ queryKey: ['category-usage'] })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('energy:update', handleEnergyUpdate)
    socket.on('energy:alert', handleAlert)
    socket.on('recommendation:applied', handleRecommendationApplied)
    socket.on('alert:resolved', handleAlertResolved)
    socket.on('analysis:update', handleAnalysisUpdate)

    if (socket.connected) {
      handleConnect()
    } else {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('energy:update', handleEnergyUpdate)
      socket.off('energy:alert', handleAlert)
      socket.off('recommendation:applied', handleRecommendationApplied)
      socket.off('alert:resolved', handleAlertResolved)
      socket.off('analysis:update', handleAnalysisUpdate)
      setConnected(false)
    }
  }, [setConnected, setLastSynced, handleEnergyUpdate, handleAlert, queryClient])

  return { socket }
}
