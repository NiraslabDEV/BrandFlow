// DECISÃO: Layout do painel com shell + tabs
// Protege rotas (app) e verifica tenant

import { redirect } from 'next/navigation'
import { currentTenant } from '@/lib/tenant'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const tenant = await currentTenant()
  
  if (!tenant) {
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar com tabs */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">BrandFlow</h1>
            <p className="text-sm text-gray-500 mt-1">{tenant.name}</p>
          </div>
          
          <nav className="px-4 space-y-1">
            <NavItem href="/app/dashboard" icon="📊" label="Dashboard" />
            <NavItem href="/app/stories" icon="📱" label="Stories" disabled />
            <NavItem href="/app/calendar" icon="📅" label="Calendário" disabled />
            <NavItem href="/app/campaigns" icon="📢" label="Campanhas" disabled />
            <NavItem href="/app/studio" icon="🤖" label="Estúdio IA" disabled />
            <NavItem href="/app/credits" icon="💰" label="Créditos" disabled />
            <NavItem href="/app/settings" icon="⚙️" label="Definições" />
          </nav>
          
          <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
            <LogoutButton user={user.email} />
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavItem({ 
  href, 
  icon, 
  label, 
  disabled = false 
}: { 
  href: string
  icon: string
  label: string
  disabled?: boolean 
}) {
  const className = disabled
    ? 'flex items-center px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed'
    : 'flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors'
  
  return (
    <a
      href={href}
      className={className}
      aria-disabled={disabled}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </a>
  )
}

async function LogoutButton({ user }: { user: string | undefined }) {
  return (
    <form action="/api/auth/logout" method="POST">
      <div className="text-xs text-gray-500 mb-2">{user}</div>
      <button
        type="submit"
        className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        Terminar sessão
      </button>
    </form>
  )
}