import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body  // DECISÃO: só 'name' vem do client — nunca userId/tenant_id (CLAUDE.md 1.2)

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome do restaurante é obrigatório' }, { status: 400 })
    }

    // userId vem sempre da sessão — nunca do payload do client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name: n, value, options }) =>
                cookieStore.set(n, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Service role para chamar create_tenant; userId vem da sessão, não do client
    const { data, error } = await supabaseServer.rpc('create_tenant', {
      p_name: name.trim(),
      p_user_id: user.id,
    })

    if (error) {
      console.error('create_tenant error:', error)
      return NextResponse.json({ error: 'Falha ao criar restaurante' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tenantId: data })
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
