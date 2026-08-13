'use client'

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopNavbar } from '@/components/layout/top-navbar'
import { useSocket } from '@/hooks/use-socket'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize socket connection
  useSocket()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
      <Toaster position="top-right" />
    </SidebarProvider>
  )
}
