export default function Home() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        YieldFinder
      </h1>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
        Discover and compare the best yield opportunities across DeFi protocols. 
        Find high-APY staking, lending, and liquidity provision opportunities on Ethereum and Solana.
      </p>
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">🔍 Discover</h3>
            <p className="text-gray-600">
              Find the latest yield opportunities from trusted DeFi protocols across multiple blockchains.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">📊 Compare</h3>
            <p className="text-gray-600">
              Compare APRs, risk scores, and liquidity options to make informed investment decisions.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">⚡ Real-time</h3>
            <p className="text-gray-600">
              Access up-to-date yield data refreshed regularly from multiple DeFi protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
