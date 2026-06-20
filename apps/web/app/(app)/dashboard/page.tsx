import Link from 'next/link'
import { currentTenant, currentRestaurant } from '@/lib/tenant'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ensureMaterialized, getDayTasks } from '@/lib/stories'
import { PushOptIn } from '@/components/push-optin'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const tenant = await currentTenant()
  if (!tenant) return null

  // Stories de hoje (X/9 feitos) — materializa idempotente e conta
  let doneToday = 0
  let totalToday = 0
  const restaurant = await currentRestaurant()
  if (restaurant) {
    const supabase = createServerSupabaseClient()
    await ensureMaterialized(supabase, restaurant, 7)
    const today = await getDayTasks(supabase, restaurant)
    totalToday = today.length
    doneToday = today.filter((t) => t.status === 'done').length
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bem-vindo ao {tenant.name}!</h2>
        <p className="text-gray-600">O resumo do dia do seu restaurante.</p>

        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <Link href="/stories" className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors">
            <div className="text-2xl font-bold text-gray-900">
              {totalToday > 0 ? `${doneToday}/${totalToday}` : '–'}
            </div>
            <div className="text-gray-600 mt-1">Stories de hoje (feitos)</div>
          </Link>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">–</div>
            <div className="text-gray-600 mt-1">Campanha ativa (M2)</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">–</div>
            <div className="text-gray-600 mt-1">Créditos disponíveis (M4)</div>
          </div>
        </div>

        <Link
          href="/stories"
          className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Ver stories de agora →
        </Link>
      </div>

      <div className="mt-6 max-w-md">
        <PushOptIn />
      </div>
    </div>
  )
}
