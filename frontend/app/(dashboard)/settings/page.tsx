'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Clock,
  Globe,
  Wifi,
  Database,
  Shield,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEnergyStore } from '@/lib/store'
import { cn } from '@/lib/utils'

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

type ApiStatus = 'checking' | 'available' | 'unavailable'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
const HEALTH_URL = new URL('/health', API_BASE_URL).toString()

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings, isConnected } = useEnergyStore()
  const [saved, setSaved] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()

    async function checkApiStatus() {
      try {
        const response = await fetch(HEALTH_URL, { signal: controller.signal })
        const health = await response.json()

        setApiStatus(response.ok && health.status === 'ok' ? 'available' : 'unavailable')
      } catch {
        if (!controller.signal.aborted) {
          setApiStatus('unavailable')
        }
      }
    }

    checkApiStatus()
    return () => controller.abort()
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and system configuration
        </p>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how EnerSight looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Theme</Label>
              <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <Label
                    key={value}
                    htmlFor={value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-colors',
                      theme === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <RadioGroupItem value={value} id={value} className="sr-only" />
                    <Icon className={cn('w-5 h-5', theme === value ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-medium">{label}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure which notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Alert Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about critical and warning alerts
                </p>
              </div>
              <Switch
                checked={settings.notifications.alerts}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, alerts: checked },
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Insight Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates when new insights are available
                </p>
              </div>
              <Switch
                checked={settings.notifications.insights}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: { ...settings.notifications, insights: checked },
                  })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Recommendation Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about new saving opportunities
                </p>
              </div>
              <Switch
                checked={settings.notifications.recommendations}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      recommendations: checked,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data & Sync */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Data & Sync
            </CardTitle>
            <CardDescription>
              Configure how often data is refreshed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Refresh Interval: {settings.refreshInterval}s
                </Label>
                <span className="text-xs text-muted-foreground">
                  10s - 120s
                </span>
              </div>
              <Slider
                value={[settings.refreshInterval]}
                onValueChange={([value]) => updateSettings({ refreshInterval: value })}
                min={10}
                max={120}
                step={10}
                className="w-full"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Timezone</Label>
                <p className="text-xs text-muted-foreground">
                  Used for displaying timestamps
                </p>
              </div>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSettings({ timezone: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Currency</Label>
                <p className="text-xs text-muted-foreground">
                  For displaying cost values
                </p>
              </div>
              <Select
                value={settings.currency}
                onValueChange={(value) => updateSettings({ currency: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Status */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              System Status
            </CardTitle>
            <CardDescription>
              Current connection and system information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-lg',
                    isConnected ? 'bg-success/10' : 'bg-destructive/10'
                  )}
                >
                  <Wifi
                    className={cn(
                      'w-4 h-4',
                      isConnected ? 'text-success' : 'text-destructive'
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Real-time Connection
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Socket.IO WebSocket
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  isConnected
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Security Configuration
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Managed by deployment environment
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Not verified
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    API Status
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Backend health check
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  apiStatus === 'available'
                    ? 'bg-success/10 text-success'
                    : apiStatus === 'unavailable'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {apiStatus === 'checking'
                  ? 'Checking'
                  : apiStatus === 'available'
                    ? 'Available'
                    : 'Unavailable'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div variants={itemVariants} className="flex justify-end">
        <Button onClick={handleSave} className="min-w-32">
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </motion.div>
    </motion.div>
  )
}
