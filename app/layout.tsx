import type { Metadata } from 'next'
import './globals.css'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'

export const metadata: Metadata = {
  title: 'Yield Opportunities',
  description: 'Discover and compare yield opportunities across DeFi protocols',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💰</text></svg>'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <DynamicContextProvider
          settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || '',
            walletConnectors: [SolanaWalletConnectors],
            enableVisitTrackingOnConnectOnly: true,
          }}
        >
          {children}
        </DynamicContextProvider>
        {/* Portal target for modals */}
        <div id="modal-root" />
      </body>
    </html>
  )
}
