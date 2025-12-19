"use client"
import { useSession, signIn, signOut } from 'next-auth/react'
import React from 'react'

export default function AuthHeader() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div className="text-sm text-gray-300">Loading...</div>

  return (
    <div className="flex items-center justify-end gap-3">
      {session?.user ? (
        <>
          <div className="text-sm text-gray-200">{session.user.name ?? session.user.email} <span className="text-xs text-gray-400">{(session as any).user?.role ?? ''}</span></div>
          <button onClick={() => signOut()} className="px-3 py-1 bg-red-600 rounded text-sm">Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn('github')} className="px-3 py-1 bg-green-600 rounded text-sm">Sign in with GitHub</button>
      )}
    </div>
  )
}
