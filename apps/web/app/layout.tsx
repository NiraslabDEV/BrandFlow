import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import ConsentBanner from '@/components/ConsentBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BrandFlow - Plataforma de Marketing Digital',
  description: 'Automatize o seu marketing com IA e pagamentos integrados',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="pt-PT">
      <body className={inter.className}>
        {children}
        <ConsentBanner />
      </body>
    </html>
  )
}
