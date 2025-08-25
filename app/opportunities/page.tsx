'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import TitleSection from '../components/TitleSection'
import OpportunitiesTable from '../components/OpportunitiesTable'

interface YieldOpportunity {
  id: string
  name: string
  provider: string
  asset: string
  chain: 'ethereum' | 'solana'
  apr: number
  category: string
  liquidity: 'liquid' | 'locked'
  riskScore: number
  yieldDate: string
}

interface ApiResponse {
  success: boolean
  data: YieldOpportunity[]
  count: number
  timestamp: string
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('fetching opportunities')
      const response = await fetch('http://localhost:3000/api/earn/opportunities')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        // Sort by APR in descending order
        const sortedOpportunities = data.data.sort((a, b) => b.apr - a.apr)
        setOpportunities(sortedOpportunities)
      } else {
        throw new Error('API returned unsuccessful response')
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      setError(null)
      console.log('Refreshing data...')
      
      await fetchOpportunities() // Force refresh
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col px-2 py-4 min-h-0">
          <div className="flex-shrink-0 mb-4">
            <TitleSection />
          </div>
          <div className="flex-1 min-h-0">
            <OpportunitiesTable 
              opportunities={opportunities} 
              loading={loading} 
              error={error}
              onRefresh={refreshData}
              refreshing={refreshing}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
