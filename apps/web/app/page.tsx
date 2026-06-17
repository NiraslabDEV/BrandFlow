'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackViewLanding } from '@/lib/analytics/track';

/**
 * Landing page
 * Dispara view_landing ao carregar
 */
export default function HomePage() {
  useEffect(() => {
    trackViewLanding();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">BrandFlow</h1>
            <nav className="flex gap-4">
              <Link 
                href="/pricing" 
                className="text-gray-600 hover:text-gray-900"
              >
                Preços
              </Link>
              <Link 
                href="/login" 
                className="text-gray-600 hover:text-gray-900"
              >
                Entrar
              </Link>
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Começar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Automatize o seu Marketing com IA
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Plataforma completa para campanhas de marketing, lead generation e pagamentos integrados.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
            >
              Começar Grátis
            </Link>
            <Link 
              href="/pricing"
              className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold border-2 border-gray-200"
            >
              Ver Preços
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Automação com IA</h3>
            <p className="text-gray-600">
              Crie campanhas inteligentes que se adaptam automaticamente ao seu público.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Pagamentos Integrados</h3>
            <p className="text-gray-600">
              Aceite pagamentos via M-Pesa, banco e cartões em Moçambique.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Analytics em Tempo Real</h3>
            <p className="text-gray-600">
              Acompanhe o desempenho das suas campanhas com métricas detalhadas.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}