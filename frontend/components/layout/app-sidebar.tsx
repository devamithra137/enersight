'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Lightbulb,
  Target,
  Settings,
  Calculator,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Energy Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quick Analysis', href: '/quick-analysis', icon: Calculator },
  { name: 'Usage Trends', href: '/trends', icon: TrendingUp },
  { name: 'Energy Alerts', href: '/alerts', icon: Bell },
  { name: 'Smart Insights', href: '/insights', icon: Lightbulb },
  { name: 'AI Recommendations', href: '/recommendations', icon: Target },
  { name: 'System Settings', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center justify-start px-6 border-b border-sidebar-border bg-sidebar">
        <Link href="/dashboard" className="flex items-center">
          <h1 className="font-bold text-xl tracking-tight text-sidebar-foreground">
            EnerSight
          </h1>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'h-10 px-3 rounded-lg transition-all relative',
                        isActive
                          ? 'text-sidebar-foreground font-medium bg-sidebar-accent/30 border-l-2 border-sidebar-accent'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20'
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            'w-4.5 h-4.5 transition-colors',
                            isActive ? 'text-sidebar-accent' : 'text-sidebar-foreground/50'
                          )}
                        />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent/40 flex items-center justify-center">
            <span className="text-xs font-bold text-sidebar-accent">E</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">
              EnerSight Pro
            </span>
            <span className="text-xs text-sidebar-foreground/50">v2.1.0</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
