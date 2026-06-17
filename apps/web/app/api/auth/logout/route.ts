// DECISÃO: API route para logout
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  
  // Limpar cookies de sessão Supabase
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  cookieStore.delete('sb-is-admin')
  
  return NextResponse.json({ success: true })
}