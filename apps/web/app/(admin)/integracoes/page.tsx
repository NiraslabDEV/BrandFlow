'use client'

import { useState, useEffect, useCallback } from 'react'

interface PublicSettings {
  subscription_provider: 'zumbopay' | 'paysuite' | 'mock'
  credits_provider: 'zumbopay' | 'paysuite' | 'mock'
  gtm_container_id: string
  meta_pixel_id: string
  ga4_measurement_id: string
  gads_conversion_id: string
  gads_conversion_label: string
}

interface SecretMeta {
  set: boolean
  masked: string
}

type SecretKey =
  | 'zumbopay_api_key' | 'zumbopay_webhook_secret' | 'zumbopay_wallet_id' | 'zumbopay_merchant_id'
  | 'paysuite_api_key' | 'paysuite_webhook_secret'
  | 'resend_api_key' | 'meta_capi_token' | 'gads_developer_token'

type SecretDraft = Partial<Record<SecretKey, string>>

const SECRET_LABELS: Record<SecretKey, { label: string; placeholder: string }> = {
  zumbopay_api_key: { label: 'ZumboPay API Key', placeholder: 'zumbo_live_...' },
  zumbopay_webhook_secret: { label: 'ZumboPay Webhook Secret', placeholder: 'wh_...' },
  zumbopay_wallet_id: { label: 'ZumboPay Wallet ID', placeholder: '' },
  zumbopay_merchant_id: { label: 'ZumboPay Merchant ID', placeholder: '' },
  paysuite_api_key: { label: 'Paysuite API Key', placeholder: '' },
  paysuite_webhook_secret: { label: 'Paysuite Webhook Secret', placeholder: 'wh_...' },
  resend_api_key: { label: 'Resend API Key', placeholder: 're_...' },
  meta_capi_token: { label: 'Meta CAPI Token', placeholder: 'EAAB...' },
  gads_developer_token: { label: 'Google Ads Developer Token', placeholder: '' },
}

export default function IntegracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [pub, setPub] = useState<PublicSettings>({
    subscription_provider: 'zumbopay',
    credits_provider: 'paysuite',
    gtm_container_id: '', meta_pixel_id: '', ga4_measurement_id: '',
    gads_conversion_id: '', gads_conversion_label: '',
  })
  const [secretMeta, setSecretMeta] = useState<Record<SecretKey, SecretMeta>>({} as Record<SecretKey, SecretMeta>)
  // Campos que o utilizador quer alterar (valor em plaintext)
  const [secretDraft, setSecretDraft] = useState<SecretDraft>({})

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPub(data.public)
      setSecretMeta(data.secrets)
    } catch {
      console.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = { ...pub, ...secretDraft }
      const res = await fetch('/api/admin/integrations/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setSecretDraft({})
      await loadSettings()
      alert('Configurações guardadas.')
    } catch {
      alert('Erro ao guardar configurações.')
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async (type: string) => {
    setTesting(type)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/integrations/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      setTestResult(await res.json())
    } catch {
      setTestResult({ ok: false, message: 'Erro ao testar' })
    } finally {
      setTesting(null)
    }
  }

  if (loading) return <div className="p-8">A carregar...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-600 mt-1">
          Tags de tracking e chaves de API. Só acessível ao Niraslab.
        </p>
      </div>

      {/* IDs públicos (A) */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">IDs Públicos de Tracking</h2>
        <p className="text-xs text-gray-500">Carregados no frontend para GTM / Pixel / GA4 / Ads.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'gtm_container_id', label: 'GTM Container ID', placeholder: 'GTM-XXXXXX' },
            { key: 'meta_pixel_id', label: 'Meta Pixel ID', placeholder: '000000000000000' },
            { key: 'ga4_measurement_id', label: 'GA4 Measurement ID', placeholder: 'G-XXXXXXXXXX' },
            { key: 'gads_conversion_id', label: 'Google Ads Conversion ID', placeholder: 'AW-XXXXXXXXXX' },
            { key: 'gads_conversion_label', label: 'Google Ads Conversion Label', placeholder: 'xxxxx_xxxxx' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={pub[key as keyof PublicSettings] as string}
                onChange={e => setPub({ ...pub, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Seleção de gateway */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Gateway Ativo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assinatura recorrente</label>
            <select
              value={pub.subscription_provider}
              onChange={e => setPub({ ...pub, subscription_provider: e.target.value as PublicSettings['subscription_provider'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="zumbopay">ZumboPay</option>
              <option value="paysuite">Paysuite</option>
              <option value="mock">Mock (dev)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Créditos / avulso</label>
            <select
              value={pub.credits_provider}
              onChange={e => setPub({ ...pub, credits_provider: e.target.value as PublicSettings['credits_provider'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="paysuite">Paysuite</option>
              <option value="zumbopay">ZumboPay</option>
              <option value="mock">Mock (dev)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => testConnection('zumbopay')} disabled={testing === 'zumbopay'}
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            {testing === 'zumbopay' ? 'A testar...' : 'Testar ZumboPay'}
          </button>
          <button onClick={() => testConnection('paysuite')} disabled={testing === 'paysuite'}
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            {testing === 'paysuite' ? 'A testar...' : 'Testar Paysuite'}
          </button>
        </div>
        {testResult && (
          <p className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {testResult.ok ? '✓' : '✗'} {testResult.message}
          </p>
        )}
      </section>

      {/* Segredos (B) — mascarados, editáveis com "Substituir" */}
      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Segredos</h2>
        <p className="text-xs text-gray-500">
          Cifrados no Supabase Vault. Só acessíveis server-side. Clica "Substituir" para alterar.
        </p>
        <div className="space-y-4">
          {(Object.keys(SECRET_LABELS) as SecretKey[]).map((key) => {
            const meta = secretMeta[key]
            const draft = secretDraft[key]
            const { label, placeholder } = SECRET_LABELS[key]
            const editing = draft !== undefined
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {editing ? (
                    <input
                      type="text"
                      autoFocus
                      value={draft}
                      onChange={e => setSecretDraft({ ...secretDraft, [key]: e.target.value })}
                      placeholder={placeholder || 'Novo valor...'}
                      className="w-full px-3 py-2 border border-blue-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-500 bg-gray-50 font-mono">
                      {meta?.set ? meta.masked : '— não configurado —'}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-5">
                  {editing ? (
                    <button
                      onClick={() => setSecretDraft(d => { const n = { ...d }; delete n[key]; return n })}
                      className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <button
                      onClick={() => setSecretDraft({ ...secretDraft, [key]: '' })}
                      className="text-xs px-3 py-1.5 border rounded-md hover:bg-gray-50"
                    >
                      Substituir
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => testConnection('meta_capi')} disabled={testing === 'meta_capi'}
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            {testing === 'meta_capi' ? 'A testar...' : 'Testar Meta CAPI'}
          </button>
          <button onClick={() => testConnection('gads')} disabled={testing === 'gads'}
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50">
            {testing === 'gads' ? 'A testar...' : 'Testar Google Ads'}
          </button>
        </div>
      </section>

      {/* Preview dataLayer */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Preview dataLayer</h2>
        <pre className="bg-gray-50 rounded p-4 text-xs overflow-auto text-gray-700">
          {JSON.stringify({
            gtm_container_id: pub.gtm_container_id || 'GTM-XXXXXX',
            meta_pixel_id: pub.meta_pixel_id || '000000000000000',
            ga4_measurement_id: pub.ga4_measurement_id || 'G-XXXXXXXXXX',
            gads_conversion_id: pub.gads_conversion_id || 'AW-XXXXXXXXXX',
            gads_conversion_label: pub.gads_conversion_label || 'xxxxx_xxxxx',
          }, null, 2)}
        </pre>
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </div>
    </div>
  )
}
