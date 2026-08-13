import type { EnergyReading } from './api'
import type { DashboardSummary, TrendsResponse } from './types'

export const LIVE_ENERGY_QUERY_KEY = ['live-energy'] as const
const LIVE_WINDOW_SIZE = 20

export type EnergyUpdatePayload =
  | EnergyReading
  | {
      data?: EnergyReading | EnergyReading[]
      reading?: EnergyReading
      timestamp?: string
    }

function isSocketEnvelope(
  payload: EnergyUpdatePayload
): payload is Exclude<EnergyUpdatePayload, EnergyReading> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    ('data' in payload || 'reading' in payload)
  )
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeTimestamp(timestamp: string | Date | undefined) {
  if (!timestamp) return new Date(0).toISOString()
  return new Date(timestamp).toISOString()
}

export function normalizeEnergyReadings(readings: EnergyReading[]): EnergyReading[] {
  const deduped = new Map<string, EnergyReading>()

  readings.forEach((reading) => {
    if (!reading?.timestamp) return
    const normalized: EnergyReading = {
      ...reading,
      timestamp: normalizeTimestamp(reading.timestamp),
    }
    const key =
      normalized._id ||
      normalized.id ||
      `${normalized.timestamp}-${normalized.deviceId || 'device'}-${normalized.category || 'category'}-${normalized.units}`

    deduped.set(key, normalized)
  })

  return Array.from(deduped.values())
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .slice(-LIVE_WINDOW_SIZE)
}

export function extractEnergyReadings(payload: EnergyUpdatePayload): EnergyReading[] {
  if (!payload) return []

  if (isSocketEnvelope(payload)) {
    const dataReadings = toArray(payload.data)
    const fallbackReadings = dataReadings.length ? dataReadings : toArray(payload.reading)
    return normalizeEnergyReadings(fallbackReadings)
  }

  return normalizeEnergyReadings([payload])
}

export function mergeEnergyReadings(
  current: EnergyReading[] | undefined,
  incoming: EnergyReading[]
): EnergyReading[] {
  return normalizeEnergyReadings([...(current || []), ...incoming])
}

export function buildLiveTrendResponse(readings: EnergyReading[]): TrendsResponse {
  const data = readings.map((reading) => ({
    timestamp: reading.timestamp,
    consumption: reading.units,
    cost: Number((reading.units * 8).toFixed(2)),
    category: reading.category || 'Overall',
  }))

  const total = data.reduce((sum, item) => sum + item.consumption, 0)
  const average = data.length ? total / data.length : 0
  const peak = data.length ? Math.max(...data.map((item) => item.consumption)) : 0

  return {
    data,
    summary: {
      totalConsumption: Number(total.toFixed(2)),
      averageConsumption: Number(average.toFixed(2)),
      peakConsumption: Number(peak.toFixed(2)),
    },
  }
}

export function applyLiveReadingToSummary(
  summary: DashboardSummary | undefined,
  readings: EnergyReading[]
): DashboardSummary | undefined {
  if (!summary || readings.length === 0) return summary

  const latest = readings[readings.length - 1]
  return {
    ...summary,
    currentUsage: latest.units,
  }
}
