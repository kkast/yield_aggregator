'use client'

import { useState } from 'react'

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

type SortField = keyof YieldOpportunity
type SortDirection = 'asc' | 'desc'

interface OpportunitiesTableProps {
  opportunities: YieldOpportunity[]
  loading: boolean
  error: string | null
  onRefresh?: () => void
  refreshing?: boolean
}

export default function OpportunitiesTable({ opportunities, loading, error, onRefresh, refreshing = false }: OpportunitiesTableProps) {
  const [sortField, setSortField] = useState<SortField>('apr')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const formatAPR = (apr: number) => {
    return `${(apr * 100).toFixed(2)}%`
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    let comparison = 0
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (aValue instanceof Date && bValue instanceof Date) {
      comparison = aValue.getTime() - bValue.getTime()
    } else {
      // Handle string dates
      comparison = new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="sort-icon">⇅</span>
    }
    return (
      <span className="sort-icon">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const getChainBadge = (chain: string) => {
    const baseClasses = "badge"
    switch (chain) {
      case 'ethereum':
        return `${baseClasses} badge-blue`
      case 'solana':
        return `${baseClasses} badge-green`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getLiquidityBadge = (liquidity: string) => {
    const baseClasses = "badge"
    switch (liquidity) {
      case 'liquid':
        return `${baseClasses} badge-green`
      case 'locked':
        return `${baseClasses} badge-yellow`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getRiskBadge = (riskScore: number) => {
    const baseClasses = "badge"
    if (riskScore <= 3) return `${baseClasses} badge-green`
    if (riskScore <= 6) return `${baseClasses} badge-yellow`
    return `${baseClasses} badge-red`
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600">Loading opportunities...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-red-500 mb-2">Error loading opportunities</div>
          <div className="text-gray-600 text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (opportunities.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-gray-500">No opportunities found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="responsive-table-card">
      <div className="table-header-section">
        <div className="table-title-group">
          <h3 className="text-lg font-semibold text-gray-900">
            Yield Opportunities ({opportunities.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Sorted by APY (highest to lowest)
          </p>
        </div>
        {onRefresh && (
          <button 
            className="btn btn-secondary refresh-btn"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="flex items-center">
                <div className="spinner-small"></div>
                <span className="ml-2">Refreshing...</span>
              </span>
            ) : (
              'Refresh Data'
            )}
          </button>
        )}
      </div>
      
      <div className="responsive-table-container">
        <table className="responsive-table">
          <thead>
            <tr>
              <th className="text-left sortable-header" onClick={() => handleSort('name')}>
                Name {getSortIcon('name')}
              </th>
              <th className="text-left sortable-header" onClick={() => handleSort('provider')}>
                Provider {getSortIcon('provider')}
              </th>
              <th className="text-left sortable-header" onClick={() => handleSort('asset')}>
                Asset {getSortIcon('asset')}
              </th>
              <th className="text-center sortable-header" onClick={() => handleSort('chain')}>
                Chain {getSortIcon('chain')}
              </th>
              <th className="text-right sortable-header" onClick={() => handleSort('apr')}>
                APR {getSortIcon('apr')}
              </th>
              <th className="text-center sortable-header" onClick={() => handleSort('category')}>
                Category {getSortIcon('category')}
              </th>
              <th className="text-center sortable-header" onClick={() => handleSort('liquidity')}>
                Liquidity {getSortIcon('liquidity')}
              </th>
              <th className="text-center sortable-header" onClick={() => handleSort('riskScore')}>
                Risk Score {getSortIcon('riskScore')}
              </th>
              <th className="text-center sortable-header" onClick={() => handleSort('yieldDate')}>
                Updated {getSortIcon('yieldDate')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedOpportunities.map((opportunity) => {
              const yieldDateTime = formatDateTime(opportunity.yieldDate)
              
              return (
                <tr key={opportunity.id}>
                  <td>
                    <div className="font-medium text-gray-900 truncate">{opportunity.name}</div>
                  </td>
                  <td>
                    <div className="text-gray-700 truncate">{opportunity.provider}</div>
                  </td>
                  <td>
                    <div className="font-mono text-sm text-gray-800 truncate">{opportunity.asset}</div>
                  </td>
                  <td className="text-center">
                    <span className={getChainBadge(opportunity.chain)}>
                      {opportunity.chain}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatAPR(opportunity.apr)}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-gray-700 capitalize text-sm">{opportunity.category}</div>
                  </td>
                  <td className="text-center">
                    <span className={getLiquidityBadge(opportunity.liquidity)}>
                      {opportunity.liquidity}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={getRiskBadge(opportunity.riskScore)}>
                      {opportunity.riskScore}/10
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="datetime-cell text-gray-500 text-xs">
                      <div className="font-medium">{yieldDateTime.date}</div>
                      <div className="text-gray-400">{yieldDateTime.time}</div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
