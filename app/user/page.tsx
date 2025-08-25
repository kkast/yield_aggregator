import Header from '../components/Header'
import MatchConfig from '../components/User'

export default function UserPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <MatchConfig />
        </div>
      </main>
    </div>
  )
}
