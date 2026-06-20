// Helpers de servidor para a tab Stories (M1.3).
// DECISÃO: a matriz é fonte única (story-matrix.ts). Aqui só materializamos
// (idempotente) e consultamos por intervalo de dia/semana.
import { generateStoryTasks, type Restaurant } from '@brandflow/core'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface StoryTaskRow {
  id: string
  scheduled_for: string
  week_of_month: number
  weekday: number
  hour: number
  theme: string
  title: string
  instructions: string
  status: 'pending' | 'sent' | 'done' | 'skipped'
  done_at: string | null
}

// UTC à meia-noite da DATA LOCAL (fuso do restaurante), deslocada offsetDays.
// DECISÃO (MVP Maputo, UTC+2 sem DST): os slots 15h–23h locais caem 13h–21h UTC
// no MESMO dia de calendário → o intervalo [meia-noite UTC, +24h) agrupa o dia.
export function localDateUTCMidnight(tz: string, offsetDays = 0): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  const d = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day'))))
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d
}

/** Materializa (idempotente) os próximos `days` dias para o restaurante. */
export async function ensureMaterialized(
  supabase: SupabaseClient,
  restaurant: Restaurant,
  days: number,
): Promise<void> {
  const tasks = generateStoryTasks(restaurant, localDateUTCMidnight(restaurant.timezone, 0), days)
  await supabase.rpc('materialize_story_tasks', {
    p_restaurant_id: restaurant.id,
    p_tasks: tasks,
  })
}

async function fetchRange(
  supabase: SupabaseClient,
  restaurantId: string,
  fromISO: string,
  toISO: string,
): Promise<StoryTaskRow[]> {
  const { data } = await supabase
    .from('story_tasks')
    .select('id, scheduled_for, week_of_month, weekday, hour, theme, title, instructions, status, done_at')
    .eq('restaurant_id', restaurantId)
    .gte('scheduled_for', fromISO)
    .lt('scheduled_for', toISO)
    .order('scheduled_for', { ascending: true })
  return (data as StoryTaskRow[]) ?? []
}

export async function getDayTasks(
  supabase: SupabaseClient,
  restaurant: Restaurant,
): Promise<StoryTaskRow[]> {
  const from = localDateUTCMidnight(restaurant.timezone, 0)
  const to = new Date(from.getTime() + 24 * 3600 * 1000)
  return fetchRange(supabase, restaurant.id, from.toISOString(), to.toISOString())
}

export async function getWeekTasks(
  supabase: SupabaseClient,
  restaurant: Restaurant,
): Promise<StoryTaskRow[]> {
  const from = localDateUTCMidnight(restaurant.timezone, 0)
  const to = new Date(from.getTime() + 7 * 24 * 3600 * 1000)
  return fetchRange(supabase, restaurant.id, from.toISOString(), to.toISOString())
}
