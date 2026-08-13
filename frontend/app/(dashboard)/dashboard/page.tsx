'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingDown, Gauge, Bell, IndianRupee } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { MiniTrendChart } from '@/components/dashboard/mini-trend-chart'
import { PeakUsageSummary } from '@/components/dashboard/peak-usage-summary'
import { AlertsPreview } from '@/components/dashboard/alerts-preview'
import { RecommendationsPreview } from '@/components/dashboard/recommendations-preview'
import { useDashboardSummary, useImpact } from '@/hooks/use-energy-data'
import { EnergyReadings } from '@/components/dashboard/energy-readings'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
  const { data: impact, isLoading: impactLoading } = useImpact()

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
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Executive overview of your energy consumption
        </p>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={itemVariants}
      >
        {summaryLoading || impactLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <KpiCard
              title="Current Usage"
              value={summary?.currentUsage || 0}
              unit="kWh"
              icon={Zap}
              variant="primary"
            />
            <KpiCard
              title="Monthly Total"
              value={(summary?.monthlyTotal || 0).toLocaleString()}
              unit="kWh"
              change={impact?.comparedToPrevious.consumption}
              changeLabel="vs last month"
              icon={TrendingDown}
            />
            <KpiCard
              title="Efficiency Score"
              value={summary?.efficiency || 0}
              unit="%"
              icon={Gauge}
              variant="success"
            />
            <KpiCard
              title="Est. Savings"
              value={`₹${((summary?.savings || 0) / 1000).toFixed(1)}k`}
              icon={IndianRupee}
              variant="success"
            />
          </>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Peak Usage */}
        <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
          {/* Live Trend Chart */}
          <Card className="overflow-hidden">
            <CardContent className="p-5 h-72">
              <MiniTrendChart />
            </CardContent>
          </Card>

          {/* Alerts & Recommendations Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <AlertsPreview />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <RecommendationsPreview />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Right Column - Peak Summary */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardContent className="p-5">
              <PeakUsageSummary />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
