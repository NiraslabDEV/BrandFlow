// DECISÃO: Dashboard vazio (placeholder para M0.3)
// Será implementado em fases posteriores

import { currentTenant } from '@/lib/tenant'

export default async function DashboardPage() {
  const tenant = await currentTenant()
  
  if (!tenant) {
    return null
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Bem-vindo ao {tenant.name}!
        </h2>
        <p className="text-gray-600">
          O dashboard será implementado em fases posteriores.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-gray-600 mt-1">Stories esta semana</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-gray-600 mt-1">Campanhas ativas</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-gray-600 mt-1">Créditos disponíveis</div>
          </div>
        </div>
      </div>
    </div>
  )
}