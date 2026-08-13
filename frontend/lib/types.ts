// Energy Data Types
export interface EnergyTrend {
  timestamp: string
  consumption: number
  cost: number
  category: string
}

export interface PeakUsage {
  time: string
  value: number
  date: string
  percentageOfDaily: number
}

export interface CategoryUsage {
  category: string
  consumption: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  color: string
}

export interface EnergyImpact {
  totalConsumption: number
  totalCost: number
  carbonFootprint: number
  efficiency: number
  comparedToPrevious: {
    consumption: number
    cost: number
  }
}

export interface Alert {
  id: string
  type: 'warning' | 'critical' | 'info'
  title: string
  message: string
  timestamp: string
  resolved: boolean
  status?: 'active' | 'resolved'
  resolvedAt?: string | null
  category?: string
  value?: number
  threshold?: number
}

export interface Insight {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metric: {
    value: number
    unit: string
    trend: 'up' | 'down' | 'stable'
    changePercent: number
  }
  category: string
}

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedSavings: number
  savingsUnit: string
  category: string
  actionType: 'immediate' | 'scheduled' | 'long-term'
  roi?: number
  status?: 'pending' | 'applied'
  appliedAt?: string | null
  impactReductionPercent?: number
}

export interface Settings {
  theme: 'light' | 'dark' | 'system'
  refreshInterval: number
  notifications: {
    alerts: boolean
    insights: boolean
    recommendations: boolean
  }
  currency: string
  timezone: string
}

// API Response Types
export interface TrendsResponse {
  data: EnergyTrend[]
  summary: {
    totalConsumption: number
    averageConsumption: number
    peakConsumption: number
  }
}

export interface DashboardSummary {
  currentUsage: number
  dailyAverage: number
  monthlyTotal: number
  efficiency: number
  alerts: number
  savings: number
}

export interface AnalysisInput {
  currentUnits: number
  previousUnits: number
  familyMembers: number
  houseType: '1BHK' | '2BHK' | '3BHK' | 'Villa'
}

export interface AnalysisResult extends AnalysisInput {
  _id?: string
  estimatedBill: number
  changePercent: number
  efficiencyScore: number
  efficiencyLevel: 'efficient' | 'moderate' | 'high'
  carbonFootprint: number
  suggestedSavings: number
  savingsPercent: number
  perPersonUsage: number
  recommendations: string[]
  categoryBreakdown: Array<{
    category: string
    percentage: number
    units: number
  }>
  assumptions?: {
    rate: number
    emissionFactor: number
  }
  createdAt?: string
}

// Time Range Types
export type TimeRange = 'daily' | 'weekly' | 'monthly'
