// DECISÃO: Página de Definições para editar nome/logo/brand
// Usa Storage para upload de logo

'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Obter user atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Upload para storage bucket 'restaurant-logos'
      // Caminho: {user_id}/logo.{ext}
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-logos')
        .getPublicUrl(fileName)

      setLogoUrl(publicUrl)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Obter tenant atual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')

      // Obter membership
      const { data: membership } = await supabase
        .from('memberships')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!membership) throw new Error('Tenant não encontrado')

      // Atualizar tenant
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          name,
          settings: {
            logo_url: logoUrl,
            primary_color: primaryColor,
          }
        })
        .eq('id', membership.tenant_id)

      if (updateError) throw updateError

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar definições')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Definições</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Definições guardadas com sucesso!
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Nome do restaurante */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome do restaurante
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Restaurante Exemplo"
            />
          </div>

          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo do restaurante
            </label>
            <div className="flex items-start space-x-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🏪</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG ou WebP. Máx 5MB.
                </p>
                {uploading && (
                  <p className="mt-2 text-sm text-blue-600">A fazer upload...</p>
                )}
              </div>
            </div>
          </div>

          {/* Cor primária */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
              Cor da marca
            </label>
            <div className="flex items-center space-x-3">
              <input
                id="color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Botão guardar */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'A guardar...' : 'Guardar definições'}
            </button>
          </div>
        </form>
      </div>

      {/* Info do tenant */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">Informação do tenant:</p>
        <p>As definições são guardadas no campo <code>settings</code> da tabela <code>tenants</code>.</p>
        <p>O logo é armazenado no bucket Supabase Storage <code>restaurant-logos</code>.</p>
      </div>
    </div>
  )
}