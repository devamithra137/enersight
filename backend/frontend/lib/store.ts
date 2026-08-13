import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Alert } from './types'

interface EnergyState {
  // Connection status
  isConnected: boolean
  lastSynced: Date | null
  
  // Settings
  settings: Settings
  
  // Live alerts queue
  liveAlerts: Alert[]
  
  // Actions
  setConnected: (connected: boolean) => void
  setLastSynced: (date: Date) => void
  updateSettings: (settings: Partial<Settings>) => void
  addLiveAlert: (alert: Alert) => void
  clearLiveAlerts: () => void
}

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set) => ({
      isConnected: false,
      lastSynced: null,
      
      settings: {
        theme: 'system',
        refreshInterval: 30,
        notifications: {
          alerts: true,
          insights: true,
          recommendations: false,
        },
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
      
      liveAlerts: [],
      
      setConnected: (connected) => set({ isConnected: connected }),
      setLastSynced: (date) => set({ lastSynced: date }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      addLiveAlert: (alert) =>
        set((state) => ({
          liveAlerts: [alert, ...state.liveAlerts].slice(0, 10),
        })),
      clearLiveAlerts: () => set({ liveAlerts: [] }),
    }),
    {
      name: 'enersight-storage',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
