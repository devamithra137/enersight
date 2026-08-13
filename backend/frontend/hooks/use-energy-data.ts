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
} from '@/lib/api'
import type { TimeRange } from '@/lib/types'

export function useTrends(range: TimeRange) {
  return useQuery({
    queryKey: ['trends', range],
    queryFn: () => fetchTrends(range),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
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
    refetchInterval: 30 * 1000,
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
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
