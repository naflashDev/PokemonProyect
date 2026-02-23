"use client"
import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Signing in...')
    // Sign in without automatic redirect so we can route based on role
    const res = await signIn('credentials', { redirect: false, email, password })
    if (res?.error) {
      setMessage(String(res.error))
      return
    }

    // Retrieve session to check role and redirect accordingly
    const session = await getSession()
    const role = (session as any)?.user?.role ?? 'USER'
    if (role === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-md bg-gray-900 p-6 rounded-lg">
        <h1 className="text-xl font-bold mb-4">Sign in</h1>
        <input className="w-full p-2 rounded mb-2 bg-gray-800 text-white" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 rounded mb-4 bg-gray-800 text-white" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">Sign in</button>
          <a href="/register" className="px-4 py-2 bg-slate-700 text-white rounded">Register</a>
        </div>
        {message && <div className="mt-3 text-sm">{message}</div>}
      </form>
    </div>
  )
}
