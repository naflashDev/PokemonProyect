"use client"
import { useSession, signIn, signOut } from 'next-auth/react'
import React from 'react'
import Link from 'next/link'

export default function AuthHeader() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div className="text-sm text-gray-300">Loading...</div>

  return (
    <div className="flex items-center justify-end gap-3">
      {session?.user ? (
        <>
          <div className="text-sm text-gray-200">{session.user.name ?? session.user.email} <span className="text-xs text-gray-400">{(session as any).user?.role ?? ''}</span></div>
          <button onClick={() => signOut()} className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300">Sign out</button>
        </>
      ) : (
        <>
          <Link href="/signin" className="px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-300">Sign in</Link>
          <Link href="/register" className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">Register</Link>
        </>
      )}
    </div>
  )
}
