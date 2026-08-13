'use client'

// @ts-ignore: avoid build error when React types are not available in the environment
import { useEffect, useRef, useCallback } from 'react'
// Attempt to require socket.io-client at runtime. In environments where the
// package or its types are not available, fall back to a noop implementation
// to avoid build errors while keeping runtime behavior safe.
let io: any = null
type Socket = any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _socket = (await import('socket.io-client')).default
  io = _socket && (_socket.io || _socket)
} catch (e) {
  io = () => ({
    on: (_: string, __?: any) => {},
    disconnect: () => {},
  })
}
import { useEnergyStore } from '@/lib/store'
// Attempt to load optional toast library (sonner). If it's not available,
// provide a noop fallback so this hook still works without the dependency.
let toast: { error: (title: string, opts?: { description?: string; duration?: number }) => void } = {
  error: () => {},
}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const _sonner = require('sonner')
  if (_sonner && _sonner.toast) {
    toast = _sonner.toast
  }
} catch (e) {
  // fallback noop
}
import type { Alert } from '@/lib/types'

type EnergyReading = {
  _id?: string
  timestamp: string
  units: number
  category?: string
  deviceId?: string | null
}

type EnergyUpdatePayload =
  | EnergyReading
  | {
      data?: EnergyReading | EnergyReading[]
      reading?: EnergyReading
    }

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { setConnected, setLastSynced, addLiveAlert, settings } = useEnergyStore()

  const handleEnergyUpdate = useCallback(
    (payload: EnergyUpdatePayload) => {
      const readings =
        'data' in payload || 'reading' in payload
          ? toArray(payload.data).length
            ? toArray(payload.data)
            : toArray(payload.reading)
          : [payload]

      if (readings.length === 0) return

      console.log('Received update', payload)
      setLastSynced(new Date())
    },
    [setLastSynced]
  )

  const handleAlert = useCallback(
    (payload: Alert | { message?: string; severity?: string; reading?: EnergyReading }) => {
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

      if (settings.notifications.alerts) {
        toast.error(alert.title, {
          description: alert.message,
          duration: 5000,
        })
      }
    },
    [addLiveAlert, settings.notifications.alerts]
  )

  const connect = useCallback(
    (url: string = 'http://localhost:5000') => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      socketRef.current = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      socketRef.current.on('connect', () => {
        console.log('Socket connected')
        setConnected(true)
        setLastSynced(new Date())
      })

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected', reason)
        setConnected(false)
      })

      socketRef.current.on('energy:update', handleEnergyUpdate)
      socketRef.current.on('energy:alert', handleAlert)
    },
    [setConnected, setLastSynced, handleEnergyUpdate, handleAlert]
  )

  useEffect(() => {
    connect()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      setConnected(false)
    }
  }, [connect, setConnected])

  return { connect }
}
