'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDynamicContext, DynamicWidget } from '@dynamic-labs/sdk-react-core'
import { getAuthToken } from "@dynamic-labs/sdk-react-core";
import { useEffect } from 'react'

export default function Header() {
  const pathname = usePathname()
  const { user, primaryWallet } = useDynamicContext()

  const tabs = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'opportunities', label: 'Opportunities', href: '/opportunities' },
    { id: 'portfolio', label: 'Portfolio', href: '/portfolio' },
    { id: 'user', label: 'User', href: '/user' },
    // Future tabs can be added here
    // { id: 'analytics', label: 'Analytics', href: '/analytics' },
  ]

  const getActiveTab = () => {
    if (pathname === '/') return 'home'
    if (pathname === '/opportunities') return 'opportunities'
    if (pathname === '/portfolio') return 'portfolio'
    if (pathname === '/user') return 'user'
    return 'home' // fallback
  }

  // Store wallet address and JWT token when user connects
  useEffect(() => {
    if (user && primaryWallet) {
      console.log('User connected:', user)
      console.log('Wallet:', primaryWallet?.address)
      
      // Store wallet address in localStorage
      localStorage.setItem('wallet_address', primaryWallet?.address || '')
      
      // Try to get JWT token from Dynamic
      // Note: This is a workaround since Dynamic doesn't expose JWT directly
      // In a real implementation, you'd get this from Dynamic's auth flow
      const jwt = getAuthToken()
      console.log('jwt', jwt)
      
      console.log('Wallet address and JWT token stored in localStorage')
    } else {
      // Clear data when disconnected
      localStorage.removeItem('wallet_address')
      localStorage.removeItem('dynamic_auth_token')
    }
  }, [user, primaryWallet])

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          {/* Navigation - Left side */}
          <nav className="nav-left">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`nav-button ${getActiveTab() === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {/* Logo/Brand and Wallet - Right side */}
          <div className="brand-right">
            <h2 className="logo">YieldFinder</h2>
            <div className="ml-4">
              <DynamicWidget 
                buttonClassName="connect-wallet-btn"
                innerButtonComponent={
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    {user ? `Connected: ${primaryWallet?.address?.slice(0, 6)}...${primaryWallet?.address?.slice(-4)}` : 'Connect Wallet'}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
