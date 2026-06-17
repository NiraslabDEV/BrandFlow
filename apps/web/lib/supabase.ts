import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Chama o RPC get_public_tracking() — devolve só IDs públicos (A), nunca segredos (B)
export async function getPublicTracking(): Promise<Record<string, string> | null> {
  const { data, error } = await supabase.rpc('get_public_tracking')
  if (error) {
    console.error('[getPublicTracking]', error.message)
    return null
  }
  return data as Record<string, string>
}
