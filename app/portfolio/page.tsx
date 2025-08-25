'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import TitleSection from '../components/TitleSection'
import OpportunitiesTable from '../components/OpportunitiesTable'
import { MatchRequest, defaultUserData } from '../../src/types/user'

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

export default function PortfolioPage() {
  const [matchSettings, setMatchSettings] = useState<MatchRequest>(defaultUserData)
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (field: keyof MatchRequest, value: any) => {
    setMatchSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleWalletBalanceChange = (asset: string, amount: number) => {
    setMatchSettings(prev => ({
      ...prev,
      walletBalance: {
        ...prev.walletBalance,
        [asset]: amount
      }
    }))
  }

  const submitMatchSettings = async () => {
    try {
      setSubmitting(true)
      setError(null)
      setLoading(true)
      
      const response = await fetch('http://localhost:3000/api/earn/opportunities/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchSettings)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: ApiResponse = await response.json()
      
      if (data.success) {
        // Sort by APR in descending order
        const sortedOpportunities = data.data.sort((a, b) => b.apr - a.apr)
        setOpportunities(sortedOpportunities)
        setHasSearched(true)
      } else {
        throw new Error('API returned unsuccessful response')
      }
    } catch (err) {
      console.error('Error matching opportunities:', err)
      setError(err instanceof Error ? err.message : 'Failed to match opportunities')
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  const refreshData = async () => {
    if (hasSearched) {
      await submitMatchSettings()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col px-2 py-4 min-h-0">
          <div className="flex-shrink-0 mb-4">
            <TitleSection />
          </div>
          
          {/* Portfolio Settings Form */}
          <div className="flex-shrink-0 mb-6">
            <div className="card">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Portfolio Matching Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Configure your preferences to find matching yield opportunities
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Wallet Balance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ETH Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={matchSettings.walletBalance.ETH || 0}
                    onChange={(e) => handleWalletBalanceChange('ETH', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SOL Balance
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={matchSettings.walletBalance.SOL || 0}
                    onChange={(e) => handleWalletBalanceChange('SOL', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>
                
                {/* Risk Tolerance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Tolerance (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={matchSettings.riskTolerance}
                    onChange={(e) => handleInputChange('riskTolerance', parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1 = Conservative, 10 = Aggressive
                  </p>
                </div>
                
                {/* Max Allocation Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Allocation (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={matchSettings.maxAllocationPct}
                    onChange={(e) => handleInputChange('maxAllocationPct', parseInt(e.target.value) || 20)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    % of portfolio to allocate
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Investment Horizon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Horizon (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={matchSettings.investmentHorizon}
                    onChange={(e) => handleInputChange('investmentHorizon', parseInt(e.target.value) || 365)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long you plan to invest (affects liquidity matching)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={submitMatchSettings}
                  disabled={submitting}
                  className="btn btn-primary px-6 py-2"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <div className="spinner-small"></div>
                      <span className="ml-2">Finding Matches...</span>
                    </span>
                  ) : (
                    'Find Matching Opportunities'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results Section */}
          {(hasSearched || loading) && (
            <div className="flex-1 min-h-0">
              <OpportunitiesTable 
                opportunities={opportunities} 
                loading={loading} 
                error={error}
                onRefresh={refreshData}
                refreshing={loading}
              />
            </div>
          )}
          
          {/* Empty State */}
          {!hasSearched && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                  Configure your settings and find matching opportunities
                </div>
                <div className="text-gray-400 text-sm">
                  Set your wallet balances, risk tolerance, and investment preferences above
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
