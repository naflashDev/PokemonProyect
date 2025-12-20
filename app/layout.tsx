import '../src/styles/globals.css'
import React from 'react'
import AuthProvider from '../src/presentation/components/AuthProvider'
import AuthHeader from '../src/presentation/components/AuthHeader'

export const metadata = {
  title: 'Pokémon Manager',
  description: 'Registro de Pokédex'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        <React.Suspense fallback={<div />}>
          <AuthProvider>
            <main className="container mx-auto p-4">
              <header className="mb-4 flex justify-between items-center">
                <div className="text-lg font-bold text-white">Pokémon Manager</div>
                <React.Suspense fallback={<div />}>
                  <AuthHeader />
                </React.Suspense>
              </header>
              {children}
            </main>
          </AuthProvider>
        </React.Suspense>
      </body>
    </html>
  )
}
