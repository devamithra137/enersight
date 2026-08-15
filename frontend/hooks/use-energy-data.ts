import { useQuery } from '@tanstack/react-query'
import {
  fetchTrends,
  fetchPeakUsage,
  fetchCategoryUsage,
  fetchImpact,
  fetchAlerts,
  fetchInsights,
  fetchRecommendations,
  fetchDashboardSummary,
  fetchEnergyData,
  fetchLatestAnalysis,
  type EnergyReading,
} from '@/lib/api'
import {
  LIVE_ENERGY_QUERY_KEY,
  applyLiveReadingToSummary,
  normalizeEnergyReadings,
} from '@/lib/live-energy'
import type { TimeRange } from '@/lib/types'

export function useLiveEnergyFeed() {
  return useQuery({
    queryKey: LIVE_ENERGY_QUERY_KEY,
    queryFn: async () => normalizeEnergyReadings(await fetchEnergyData()),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useTrends(range: TimeRange) {
  return useQuery({
    queryKey: ['trends', range],
    queryFn: () => fetchTrends(range),
    staleTime: 60 * 1000,
  })
}

export function usePeakUsage() {
  return useQuery({
    queryKey: ['peak-usage'],
    queryFn: fetchPeakUsage,
    staleTime: 60 * 1000,
  })
}

export function useCategoryUsage() {
  return useQuery({
    queryKey: ['category-usage'],
    queryFn: fetchCategoryUsage,
    staleTime: 60 * 1000,
  })
}

export function useImpact() {
  return useQuery({
    queryKey: ['impact'],
    queryFn: fetchImpact,
    staleTime: 60 * 1000,
  })
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    staleTime: 30 * 1000,
  })
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 5 * 60 * 1000,
  })
}

export function useDashboardSummary() {
  const liveFeed = useLiveEnergyFeed()
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 30 * 1000,
  })

  return {
    ...summaryQuery,
    data: applyLiveReadingToSummary(summaryQuery.data, liveFeed.data || []),
  }
}

export function useLatestAnalysis() {
  return useQuery({
    queryKey: ['analysis-latest'],
    queryFn: fetchLatestAnalysis,
    staleTime: 30 * 1000,
  })
}

export function useEnergyData() {
  const liveFeed = useLiveEnergyFeed()
  const energyData = [...(liveFeed.data || [])].reverse()

  return {
    energyData,
    isLoading: liveFeed.isLoading,
    error: liveFeed.error
      ? liveFeed.error instanceof Error
        ? liveFeed.error.message
        : 'Failed to fetch energy data'
      : null,
  }
}

export type { EnergyReading }
