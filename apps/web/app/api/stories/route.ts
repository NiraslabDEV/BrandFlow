// GET /api/stories?view=day|week — stories do dia/semana do tenant da sessão.
// Materializa (idempotente) os próximos 7 dias e devolve o intervalo pedido.
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { currentRestaurant } from '@/lib/tenant'
import { ensureMaterialized, getDayTasks, getWeekTasks } from '@/lib/stories'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const restaurant = await currentRestaurant()
  if (!restaurant) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const view = request.nextUrl.searchParams.get('view') === 'week' ? 'week' : 'day'
  const supabase = createServerSupabaseClient()

  // garante a rotação dos próximos 7 dias (cobre dia e semana)
  await ensureMaterialized(supabase, restaurant, 7)

  const tasks =
    view === 'week'
      ? await getWeekTasks(supabase, restaurant)
      : await getDayTasks(supabase, restaurant)

  return NextResponse.json({ view, tz: restaurant.timezone, tasks })
}
