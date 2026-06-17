import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  // Autentica via cookies de sessão (nunca via service role)
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.app_metadata?.role !== 'super_admin') {
    return NextResponse.json({ ok: false, message: 'Acesso não autorizado' }, { status: 403 })
  }

  const { type } = await request.json()

  // Lê settings via service role (seguro, server-side)
  const { data: settings, error } = await supabaseServer
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !settings) {
    return NextResponse.json({ ok: false, message: 'Erro ao carregar configurações' }, { status: 500 })
  }

  const s = settings as Record<string, string | null>

  switch (type) {
    case 'meta_capi':
      if (!s.meta_capi_token) return NextResponse.json({ ok: false, message: 'Token não configurado' })
      if (s.meta_capi_token.length < 10) return NextResponse.json({ ok: false, message: 'Token inválido' })
      return NextResponse.json({ ok: true, message: 'Token configurado' })

    case 'gads':
      if (!s.gads_developer_token) return NextResponse.json({ ok: false, message: 'Token não configurado' })
      if (s.gads_developer_token.length < 10) return NextResponse.json({ ok: false, message: 'Token inválido' })
      return NextResponse.json({ ok: true, message: 'Token configurado' })

    case 'zumbopay':
      if (!s.zumbopay_api_key) return NextResponse.json({ ok: false, message: 'API key não configurada' })
      return NextResponse.json({ ok: true, message: 'ZumboPay configurado' })

    case 'paysuite':
      if (!s.paysuite_api_key) return NextResponse.json({ ok: false, message: 'API key não configurada' })
      return NextResponse.json({ ok: true, message: 'Paysuite configurado' })

    default:
      return NextResponse.json({ ok: false, message: 'Tipo desconhecido' })
  }
}
