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
  EnergyTrend,
} from './types'

// Create API instance
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Energy data interface
export interface EnergyReading {
  timestamp: string
  units: number
  category: string
}

// Response format from backend
interface EnergyResponse {
  success: boolean
  data: EnergyReading[]
}

// Socket connection
export const socket = io('http://localhost:5000')

// Fetch energy data from backend
export async function fetchEnergyData(): Promise<EnergyReading[]> {
  try {
    const response = await API.get<EnergyResponse>('/energy')
    if (response.data.success) {
      return response.data.data
    }
    throw new Error('API response not successful')
  } catch (error) {
    console.error('Error fetching energy data:', error)
    throw error
  }
}
})

// Energy data interface
export interface EnergyReading {
  timestamp: string
  units: number
  category: string
}

// Response format from backend
interface EnergyResponse {
  success: boolean
  data: EnergyReading[]
}

// Socket connection
export const socket = io('http://localhost:5000')

// Fetch energy data from backend
export async function fetchEnergyData(): Promise<EnergyReading[]> {
  try {
    const response = await API.get<EnergyResponse>('/energy')
    if (response.data.success) {
      return response.data.data
    }
    throw new Error('API response not successful')
  } catch (error) {
    console.error('Error fetching energy data:', error)
    throw error
  }
}

// Create API instance
const API = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Energy data interface
export interface EnergyReading {
  timestamp: string
  units: number
  category: string
}

// Response format from backend
interface EnergyResponse {
  success: boolean
  data: EnergyReading[]
}

// Socket connection
export const socket = io('http://localhost:5000')

// Fetch energy data from backend
export async function fetchEnergyData(): Promise<EnergyReading[]> {
  try {
    const response = await API.get<EnergyResponse>('/energy')
    if (response.data.success) {
      return response.data.data
    }
    throw new Error('API response not successful')
  } catch (error) {
    console.error('Error fetching energy data:', error)
    throw error
  }
}

// Simulated API delay for compatibility
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Generate realistic mock data for other functions (keeping existing behavior)
function generateTrendData(range: TimeRange): EnergyTrend[] {
  const points = range === 'daily' ? 24 : range === 'weekly' ? 7 : 30
  const now = new Date()
  const data: EnergyTrend[] = []

  const categories = ['HVAC', 'Lighting', 'Equipment', 'Other']

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now)
    if (range === 'daily') {
      date.setHours(date.getHours() - i)
    } else {
      date.setDate(date.getDate() - i)
    }

    // Create realistic consumption patterns
    const hour = date.getHours()
    let baseConsumption = 150

    // Peak hours pattern
    if (hour >= 9 && hour <= 18) {
      baseConsumption = 280 + Math.random() * 80
    } else if (hour >= 6 && hour <= 8) {
      baseConsumption = 180 + Math.random() * 40
    } else if (hour >= 19 && hour <= 22) {
      baseConsumption = 200 + Math.random() * 50
    } else {
      baseConsumption = 100 + Math.random() * 30
    }

    const consumption = Math.round(baseConsumption)
    const cost = Math.round(consumption * 0.08 * 100) / 100

    data.push({
      timestamp: date.toISOString(),
      consumption,
      cost,
      category: categories[Math.floor(Math.random() * categories.length)],
    })
  }

  return data
}

// API Functions (keeping existing for compatibility)
export async function fetchTrends(range: TimeRange): Promise<TrendsResponse> {
  await delay(600)
  const data = generateTrendData(range)
  const total = data.reduce((sum, d) => sum + d.consumption, 0)

  return {
    data,
    summary: {
      totalConsumption: total,
      averageConsumption: Math.round(total / data.length),
      peakConsumption: Math.max(...data.map((d) => d.consumption)),
    },
  }
}

export async function fetchPeakUsage(): Promise<PeakUsage> {
  await delay(400)
  return {
    time: '14:30',
    value: 342,
    date: new Date().toISOString().split('T')[0],
    percentageOfDaily: 12.4,
  }
}

export async function fetchCategoryUsage(): Promise<CategoryUsage[]> {
  await delay(500)
  return [
    { category: 'HVAC', consumption: 1245, percentage: 42, trend: 'up', color: 'var(--chart-1)' },
    { category: 'Lighting', consumption: 567, percentage: 19, trend: 'down', color: 'var(--chart-2)' },
    { category: 'Equipment', consumption: 834, percentage: 28, trend: 'stable', color: 'var(--chart-3)' },
    { category: 'Other', consumption: 324, percentage: 11, trend: 'down', color: 'var(--chart-4)' },
  ]
}

export async function fetchImpact(): Promise<EnergyImpact> {
  await delay(450)
  return {
    totalConsumption: 2970,
    totalCost: 237.6,
    carbonFootprint: 1.42,
    efficiency: 78,
    comparedToPrevious: {
      consumption: -5.2,
      cost: -4.8,
    },
  }
}

export async function fetchAlerts(): Promise<Alert[]> {
  await delay(500)
  const now = new Date()
  return [
    {
      id: '1',
      type: 'critical',
      title: 'Peak Usage Exceeded',
      message: 'HVAC consumption exceeded threshold by 15% during peak hours',
      timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      resolved: false,
      category: 'HVAC',
      value: 385,
      threshold: 335,
    },
    {
      id: '2',
      type: 'warning',
      title: 'Unusual Pattern Detected',
      message: 'Lighting consumption increased 23% compared to typical Tuesday',
      timestamp: new Date(now.getTime() - 1000 * 60 * 32).toISOString(),
      resolved: false,
      category: 'Lighting',
    },
    {
      id: '3',
      type: 'info',
      title: 'Efficiency Milestone',
      message: 'Monthly efficiency target reached ahead of schedule',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      resolved: true,
    },
    {
      id: '4',
      type: 'warning',
      title: 'Equipment Standby Power',
      message: 'High standby power detected from Equipment category after hours',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4).toISOString(),
      resolved: false,
      category: 'Equipment',
    },
    {
      id: '5',
      type: 'critical',
      title: 'Abnormal Spike',
      message: 'Sudden 40% spike detected in overall consumption',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(),
      resolved: true,
    },
  ]
}

export async function fetchInsights(): Promise<Insight[]> {
  await delay(550)
  return [
    {
      id: '1',
      title: 'HVAC Driving Costs',
      description: 'HVAC accounts for 42% of total consumption, up 8% from last month. Peak usage occurs between 2-4 PM.',
      impact: 'high',
      metric: { value: 42, unit: '%', trend: 'up', changePercent: 8 },
      category: 'HVAC',
    },
    {
      id: '2',
      title: 'Weekend Efficiency Gap',
      description: 'Weekend consumption is only 12% lower than weekdays despite reduced occupancy. Potential optimization opportunity.',
      impact: 'medium',
      metric: { value: 12, unit: '%', trend: 'stable', changePercent: 0 },
      category: 'Overall',
    },
    {
      id: '3',
      title: 'Lighting Improvements',
      description: 'Automated lighting controls reduced evening consumption by 31% compared to previous quarter.',
      impact: 'medium',
      metric: { value: 31, unit: '%', trend: 'down', changePercent: -31 },
      category: 'Lighting',
    },
    {
      id: '4',
      title: 'Peak Hour Concentration',
      description: '68% of daily consumption occurs during peak tariff hours (9 AM - 6 PM), increasing costs significantly.',
      impact: 'high',
      metric: { value: 68, unit: '%', trend: 'up', changePercent: 5 },
      category: 'Overall',
    },
  ]
}

export async function fetchRecommendations(): Promise<Recommendation[]> {
  await delay(500)
  return [
    {
      id: '1',
      title: 'Shift HVAC Pre-cooling',
      description: 'Pre-cool spaces before 9 AM to reduce peak hour HVAC load by 20%',
      priority: 'high',
      estimatedSavings: 4500,
      savingsUnit: '₹/month',
      category: 'HVAC',
      actionType: 'immediate',
      roi: 340,
    },
    {
      id: '2',
      title: 'Implement Occupancy Sensors',
      description: 'Install occupancy-based lighting controls in meeting rooms and common areas',
      priority: 'medium',
      estimatedSavings: 2800,
      savingsUnit: '₹/month',
      category: 'Lighting',
      actionType: 'scheduled',
      roi: 180,
    },
    {
      id: '3',
      title: 'Equipment Power Management',
      description: 'Enable automatic standby shutdown for equipment during non-business hours',
      priority: 'high',
      estimatedSavings: 1900,
      savingsUnit: '₹/month',
      category: 'Equipment',
      actionType: 'immediate',
      roi: 450,
    },
    {
      id: '4',
      title: 'Peak Load Balancing',
      description: 'Stagger high-consumption equipment startup to flatten peak demand curve',
      priority: 'medium',
      estimatedSavings: 3200,
      savingsUnit: '₹/month',
      category: 'Overall',
      actionType: 'long-term',
      roi: 220,
    },
  ]
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  await delay(400)
  return {
    currentUsage: 287,
    dailyAverage: 2450,
    monthlyTotal: 73500,
    efficiency: 78,
    alerts: 3,
    savings: 12400,
  }
}
i m p o r t   a x i o s   f r o m   
 
 \ a x i o s \ ' 
 
 i m p o r t   {   i o   }   f r o m   \ s o c k e t . i o - c l i e n t \ ' 
 
 
 
 c o n s t   A P I   =   a x i o s . c r e a t e ( { 
 
     b a s e U R L :   \ h t t p : / / l o c a l h o s t : 5 0 0 0 / a p i \ ' 
 
 } ) 
 
 
 
 e x p o r t   i n t e r f a c e   E n e r g y R e a d i n g   { 
 
     t i m e s t a m p :   s t r i n g 
 
     u n i t s :   n u m b e r 
 
     c a t e g o r y :   s t r i n g 
 
 } 
 
 
 
 i n t e r f a c e   E n e r g y R e s p o n s e   { 
 
     s u c c e s s :   b o o l e a n 
 
     d a t a :   E n e r g y R e a d i n g [ ] 
 
 } 
 
 
 
 e x p o r t   c o n s t   s o c k e t   =   i o ( \ h t t p : / / l o c a l h o s t : 5 0 0 0 \ ' ) 
 
 
 
 e x p o r t   a s y n c   f u n c t i o n   f e t c h E n e r g y D a t a ( ) :   P r o m i s e < E n e r g y R e a d i n g [ ] >   { 
 
     t r y   { 
 
         c o n s t   r e s p o n s e   =   a w a i t   A P I . g e t < E n e r g y R e s p o n s e > ( \ / e n e r g y \ ' ) 
 
         i f   ( r e s p o n s e . d a t a . s u c c e s s )   { 
 
             r e t u r n   r e s p o n s e . d a t a . d a t a 
 
         } 
 
         t h r o w   n e w   E r r o r ( \ A P I 
 
 r e s p o n s e 
 
 n o t 
 
 s u c c e s s f u l \ ' ) 
 
     }   c a t c h   ( e r r o r )   { 
 
         c o n s o l e . e r r o r ( \ E r r o r 
 
 f e t c h i n g 
 
 e n e r g y 
 
 d a t a : \ ' ,   e r r o r ) 
 
         t h r o w   e r r o r 
 
     } 
 
 } 
 
 