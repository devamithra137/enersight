'use client'

import { useTheme } from 'next-themes'
import { format } from 'date-fns'
import { Moon, Sun, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { useEnergyStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function TopNavbar() {
  const { theme, setTheme } = useTheme()
  const { isConnected, lastSynced } = useEnergyStore()

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between gap-4 border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden" />
        <Separator orientation="vertical" className="h-6 lg:hidden" />
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            isConnected
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {isConnected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>

        {/* Last Synced */}
        {lastSynced && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3" />
            <span>Synced {format(lastSynced, 'HH:mm:ss')}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-lg"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  )
}
