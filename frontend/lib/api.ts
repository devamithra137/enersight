import axios from 'axios'
import { io } from 'socket.io-client'
import type {
  TrendsResponse,
  PeakUsage,
  CategoryUsage,
  EnergyImpact,
  Alert,
  Insight,
  Recommendation,
  TimeRange,
  DashboardSummary,
  AnalysisInput,
  AnalysisResult,
} from './types'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

const API = axios.create({
  baseURL: API_BASE_URL,
})

export interface EnergyReading {
  _id?: string
  id?: string
  timestamp: string
  units: number
  category: string
  deviceId?: string | null
}

interface EnergyResponse {
  success: boolean
  data: EnergyReading[]
}

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
})

function assertSuccess<T>(response: { data: { success: boolean } & T }): T {
  if (!response.data.success) {
    throw new Error('API response not successful')
  }
  return response.data
}

export async function createAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const response = await API.post('/analysis', input)
  return assertSuccess<{ data: AnalysisResult }>(response).data
}

export async function fetchLatestAnalysis(): Promise<AnalysisResult | null> {
  const response = await API.get('/analysis/latest')
  return assertSuccess<{ data: AnalysisResult | null }>(response).data
}

function buildEstimatedTrendData(
  analysis: AnalysisResult,
  range: TimeRange
): TrendsResponse {
  const points = range === 'daily' ? 24 : range === 'weekly' ? 7 : 30
  const now = new Date()
  const dailyAverage = analysis.currentUnits / 30
  const hourlyAverage = dailyAverage / 24
  const data = Array.from({ length: points }, (_, index) => {
    const date = new Date(now)
    if (range === 'daily') {
      date.setHours(now.getHours() - (points - 1 - index), 0, 0, 0)
    } else {
      date.setDate(now.getDate() - (points - 1 - index))
      date.setHours(0, 0, 0, 0)
    }

    const hour = date.getHours()
    const peakFactor =
      hour >= 18 && hour <= 22 ? 1.35 : hour >= 12 && hour <= 16 ? 1.15 : 0.85
    const consumption =
      range === 'daily'
        ? Number((hourlyAverage * peakFactor).toFixed(2))
        : Number((dailyAverage * (0.9 + (index % 5) * 0.05)).toFixed(2))

    return {
      timestamp: date.toISOString(),
      consumption,
      cost: Number((consumption * (analysis.assumptions?.rate || 8)).toFixed(2)),
      category: 'Household estimate',
    }
  })
  const total = data.reduce((sum, item) => sum + item.consumption, 0)

  return {
    data,
    summary: {
      totalConsumption: Number(total.toFixed(2)),
      averageConsumption: data.length ? Number((total / data.length).toFixed(2)) : 0,
      peakConsumption: data.length
        ? Math.max(...data.map((item) => item.consumption))
        : 0,
    },
  }
}

export async function fetchEnergyData(): Promise<EnergyReading[]> {
  const response = await API.get<EnergyResponse>('/energy')
  return assertSuccess(response).data
}

export async function fetchTrends(range: TimeRange): Promise<TrendsResponse> {
  const latestAnalysis = await fetchLatestAnalysis()
  if (latestAnalysis) {
    return buildEstimatedTrendData(latestAnalysis, range)
  }

  const response = await API.get(`/energy/trends?range=${range}`)
  const result = assertSuccess<{
    range: TimeRange
    groupedBy: string
    data: Array<{ period: string; totalUnits: number }>
  }>(response)

  const data = result.data.map((item) => ({
    timestamp:
      item.period.length === 10
        ? new Date(`${item.period}T00:00:00`).toISOString()
        : new Date(item.period).toISOString(),
    consumption: item.totalUnits,
    cost: Number((item.totalUnits * 8).toFixed(2)),
    category: 'Overall',
  }))
  const total = data.reduce((sum, item) => sum + item.consumption, 0)

  return {
    data,
    summary: {
      totalConsumption: Number(total.toFixed(2)),
      averageConsumption: data.length ? Number((total / data.length).toFixed(2)) : 0,
      peakConsumption: data.length
        ? Number(Math.max(...data.map((item) => item.consumption)).toFixed(2))
        : 0,
    },
  }
}

export async function fetchPeakUsage(): Promise<PeakUsage> {
  const response = await API.get('/energy/peak')
  const result = assertSuccess<{ data: any }>(response).data

  return {
    time: result.peakHour?.start || '--:--',
    value: result.peakUnits || 0,
    date: new Date().toISOString().split('T')[0],
    percentageOfDaily: result.percentageOfTotal || 0,
  }
}

export async function fetchCategoryUsage(): Promise<CategoryUsage[]> {
  const latestAnalysis = await fetchLatestAnalysis()
  if (latestAnalysis) {
    const colors = [
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
    ]

    return latestAnalysis.categoryBreakdown.map((item, index) => ({
      category: item.category,
      consumption: item.units,
      percentage: item.percentage,
      trend:
        latestAnalysis.efficiencyLevel === 'high'
          ? 'up'
          : latestAnalysis.efficiencyLevel === 'efficient'
            ? 'down'
            : 'stable',
      color: colors[index % colors.length],
    }))
  }

  const response = await API.get('/energy/category')
  const result = assertSuccess<{ data: any }>(response).data
  const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]

  return (result.categories || []).map((item: any, index: number) => ({
    category: item.category,
    consumption: item.totalUnits,
    percentage: item.percentageShare,
    trend: 'stable',
    color: colors[index % colors.length],
  }))
}

export async function fetchImpact(): Promise<EnergyImpact> {
  const latestAnalysis = await fetchLatestAnalysis()
  if (latestAnalysis) {
    return {
      totalConsumption: latestAnalysis.currentUnits,
      totalCost: latestAnalysis.estimatedBill,
      carbonFootprint: latestAnalysis.carbonFootprint,
      efficiency: latestAnalysis.efficiencyScore,
      comparedToPrevious: {
        consumption: latestAnalysis.changePercent,
        cost: latestAnalysis.changePercent,
      },
    }
  }

  const response = await API.get('/energy/impact')
  const result = assertSuccess<{ data: any }>(response).data
  const summary = result.summary || {}

  return {
    totalConsumption: summary.totalUnits || 0,
    totalCost: summary.totalCost || 0,
    carbonFootprint: summary.totalCarbonKg || 0,
    efficiency: 78,
    comparedToPrevious: {
      consumption: 0,
      cost: 0,
    },
  }
}

export async function fetchAlerts(): Promise<Alert[]> {
  const response = await API.get('/alerts')
  const result = assertSuccess<{ data: any }>(response).data

  return (result.alerts || [])
    .map((alert: any): Alert => ({
      id: alert.id || alert.alertId,
      type: alert.type === 'critical' ? 'critical' : alert.type === 'info' ? 'info' : 'warning',
      title: alert.title || (alert.type === 'critical' ? 'Critical anomaly' : 'Usage anomaly'),
      message: alert.message,
      timestamp: alert.timestamp || alert.reading?.timestamp || new Date().toISOString(),
      resolved: alert.resolved || alert.status === 'resolved',
      resolvedAt: alert.resolvedAt || null,
      status: alert.status || (alert.resolved ? 'resolved' : 'active'),
      category: alert.category || alert.reading?.category,
      value: alert.value || alert.reading?.units,
      threshold: alert.threshold,
    }))
    .sort((a: Alert, b: Alert) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })
}

export async function fetchInsights(): Promise<Insight[]> {
  const response = await API.get('/energy/insights')
  const result = assertSuccess<{ data: any }>(response).data

  return (result.insights || []).map((insight: any, index: number) => ({
    id: `${insight.type}-${index}`,
    title: insight.message.split(':')[0] || 'Energy insight',
    description: insight.message,
    impact: insight.value >= 30 ? 'high' : insight.value >= 10 ? 'medium' : 'low',
    metric: {
      value: insight.value,
      unit: insight.unit,
      trend:
        insight.type === 'decrease'
          ? 'down'
          : insight.type === 'increase'
            ? 'up'
            : 'stable',
      changePercent: insight.unit === '%' ? insight.value : 0,
    },
    category: insight.metadata?.category || 'Overall',
  }))
}

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const response = await API.get('/recommendations')
  const result = assertSuccess<{ data: any }>(response).data

  return (result.recommendations || []).map((rec: any) => ({
    id: rec.id,
    title: rec.title,
    description: rec.recommendation || rec.description,
    priority: rec.priority,
    estimatedSavings:
      rec.estimatedMonthlySavings?.cost ||
      rec.estimatedSavings ||
      0,
    savingsUnit: 'INR/month',
    category:
      rec.dataContext?.topCategoryDuringPeak ||
      rec.dataContext?.peakHour ||
      'Overall',
    actionType:
      rec.priority === 'high'
        ? 'immediate'
        : rec.priority === 'medium'
          ? 'scheduled'
          : 'long-term',
    roi: rec.estimatedMonthlySavings?.cost
      ? Math.round(rec.estimatedMonthlySavings.cost / 10)
      : undefined,
    status: rec.status || 'pending',
    appliedAt: rec.appliedAt || null,
    impactReductionPercent: rec.impactReductionPercent || 0,
  }))
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const latestAnalysis = await fetchLatestAnalysis()
  if (latestAnalysis) {
    const alerts = await fetchAlerts()

    return {
      currentUsage: latestAnalysis.currentUnits,
      dailyAverage: Number((latestAnalysis.currentUnits / 30).toFixed(2)),
      monthlyTotal: latestAnalysis.currentUnits,
      efficiency: latestAnalysis.efficiencyScore,
      alerts: alerts.filter((alert) => !alert.resolved).length,
      savings: latestAnalysis.suggestedSavings,
    }
  }

  const [readings, impact, alerts, recommendations] = await Promise.all([
    fetchEnergyData(),
    fetchImpact(),
    fetchAlerts(),
    fetchRecommendations(),
  ])

  const currentUsage = readings[0]?.units || 0
  const activeAlerts = alerts.filter((alert) => !alert.resolved).length
  const savings = recommendations
    .filter((rec) => rec.status === 'applied')
    .reduce((sum, rec) => sum + rec.estimatedSavings, 0)

  return {
    currentUsage,
    dailyAverage: impact.totalConsumption,
    monthlyTotal: impact.totalConsumption,
    efficiency: impact.efficiency,
    alerts: activeAlerts,
    savings,
  }
}

export async function applyRecommendation(recommendationId: string) {
  const response = await API.post('/recommendations/apply', { recommendationId })
  return assertSuccess<{
    data: {
      recommendationId: string
      status: 'applied'
      appliedAt: string
      impactReductionPercent: number
      optimizedReading?: EnergyReading
    }
    message: string
  }>(response)
}

export async function resolveAlert(id: string) {
  const response = await API.patch(`/alerts/${encodeURIComponent(id)}/resolve`)
  return assertSuccess<{ data: any }>(response)
}
