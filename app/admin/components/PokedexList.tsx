"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PokedexList() {
  const [list, setList] = useState<Array<any>>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/pokedex/list', { credentials: 'include' })
      const j = await r.json()
      if (!r.ok) { setMsg('Error: ' + (j.error || r.status)); setList([]); return }
      setList(j || [])
    } catch (e:any) { setMsg(String(e)); setList([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function publish(slug: string) {
    setMsg('Publicando...')
    try {
      const r = await fetch('/api/admin/pokedex', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', slug }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Error')
      setMsg('Publicado')
      load()
    } catch (e:any) { setMsg('Error: ' + e.message) }
  }

  return (
    <div>
      {msg && <div className="text-sm mb-2">{msg}</div>}
      <div className="grid gap-2">
        {list.map(p => (
          <div key={p.slug} className="flex items-center justify-between bg-gray-800 p-2 rounded">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-gray-400">{p.slug}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-yellow-600 rounded" onClick={() => router.push(`/admin/pokedex/${p.slug}/edit`)}>Editar</button>
              <button className="px-2 py-1 bg-green-600 rounded" onClick={() => publish(p.slug)}>Publicar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
