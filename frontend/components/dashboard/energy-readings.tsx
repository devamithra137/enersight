'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEnergyData } from '@/hooks/use-energy-data'

export function EnergyReadings() {
  const { energyData, isLoading, error } = useEnergyData()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Energy Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center justify-between p-4 border rounded-lg'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
                <div className='text-right space-y-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Energy Readings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Failed to load energy data: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Zap className='h-5 w-5' />
          Energy Readings
          <Badge variant='secondary' className='ml-auto'>
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {energyData.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            No energy readings available
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Latest Reading */}
            <div className='p-4 border-2 border-primary/20 rounded-lg bg-primary/5'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-lg'>Latest Reading</h3>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(energyData[0].timestamp).toLocaleString()}
                  </p>
                </div>
                <div className='text-right'>
                  <div className='font-mono text-2xl font-bold text-primary'>
                    {energyData[0].units} kWh
                  </div>
                  <Badge variant='outline'>{energyData[0].category}</Badge>
                </div>
              </div>
            </div>

            {/* Reading List */}
            <div className='space-y-2'>
              <h4 className='font-medium text-sm text-muted-foreground uppercase tracking-wide'>
                Recent Readings
              </h4>
              {energyData.slice(1).map((reading, index) => (
                <div
                  key={`${reading._id || reading.timestamp}-${index}`}
                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='space-y-1'>
                    <div className='font-mono font-medium'>{reading.units} kWh</div>
                    <div className='text-sm text-muted-foreground'>
                      {new Date(reading.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant='secondary'>{reading.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
