"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Registering...')
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Error')
      setMessage('Registered — signing in...')
      // Sign in without automatic redirect so we can route based on role
      const signInRes = await signIn('credentials', { redirect: false, email, password })
      if (signInRes?.error) {
        setMessage('Error signing in: ' + String(signInRes.error))
        return
      }
      const session = await getSession()
      const role = (session as any)?.user?.role ?? 'USER'
      if (role === 'ADMIN') router.push('/admin')
      else router.push('/')
    } catch (e:any) {
      setMessage('Error: ' + e.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-gray-900 p-6 rounded-lg">
        <h1 className="text-xl font-bold mb-4">Register</h1>
        <input className="w-full p-2 rounded mb-2 bg-gray-800 text-white" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full p-2 rounded mb-2 bg-gray-800 text-white" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 rounded mb-4 bg-gray-800 text-white" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 rounded" type="submit">Create account</button>
          <a href="/api/auth/signin" className="px-4 py-2 bg-slate-700 rounded">Sign in</a>
        </div>
        {message && <div className="mt-3 text-sm">{message}</div>}
      </form>
    </div>
  )
}
