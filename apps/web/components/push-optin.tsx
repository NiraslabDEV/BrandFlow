'use client'

import { useState } from 'react'
import { enablePush } from '@/lib/push/subscribe'

const MESSAGES: Record<string, string> = {
  unsupported: 'Este aparelho/navegador não suporta notificações.',
  denied: 'Permissão negada. Ative as notificações nas definições do navegador.',
  'no-vapid': 'Notificações ainda não configuradas no servidor.',
  error: 'Não foi possível ativar. Tente novamente.',
}

export function PushOptIn() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState<string>('')

  async function handleClick() {
    setState('loading')
    const res = await enablePush()
    if (res.ok) {
      setState('done')
      setMsg('Notificações ativadas neste aparelho.')
    } else {
      setState('error')
      setMsg(MESSAGES[res.reason] ?? 'Erro ao ativar.')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900">Alertas no celular</h3>
      <p className="mt-1 text-sm text-gray-600">
        Receba &quot;Faz story AGORA&quot; nos horários certos, como notificação de sistema.
      </p>
      <button
        onClick={handleClick}
        disabled={state === 'loading' || state === 'done'}
        className="mt-3 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {state === 'done' ? 'Ativado ✓' : state === 'loading' ? 'A ativar…' : 'Ativar notificações'}
      </button>
      {msg && (
        <p className={`mt-2 text-sm ${state === 'error' ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
      )}
    </div>
  )
}
