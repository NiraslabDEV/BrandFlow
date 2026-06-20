// POST /api/stories/done — marca uma story_task como "Feito" (valida tenant na RPC).
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ task_id: z.string().uuid() })

export async function POST(request: NextRequest) {
  try {
    const { task_id } = schema.parse(await request.json())
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.rpc('mark_story_done', { p_task_id: task_id })
    if (error) {
      // RPC lança quando a task não é do tenant da sessão → 404
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
