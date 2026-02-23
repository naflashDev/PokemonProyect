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
  useEffect(() => {
    const handler = (e: any) => {
      // reload list when pokedexes are created/updated/deleted elsewhere
      try { load() } catch (_) { /* ignore */ }
    }
    window.addEventListener('pokedex-changed', handler as EventListener)
    return () => window.removeEventListener('pokedex-changed', handler as EventListener)
  }, [])

  async function publish(slug: string) {
    setMsg('Publicando...')
    try {
      const r = await fetch('/api/admin/pokedex', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', slug }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Error')
      setMsg('Publicado')
      load()
      try { window.dispatchEvent(new CustomEvent('pokedex-changed', { detail: { action: 'published', slug } })) } catch (_) {}
    } catch (e:any) { setMsg('Error: ' + e.message) }
  }

  async function removePokedex(slug: string) {
    if (!confirm('¿Eliminar permanentemente esta Pokédex? Esta acción no se puede deshacer.')) return
    setMsg('Eliminando...')
    try {
      const r = await fetch(`/api/admin/pokedex/${encodeURIComponent(slug)}`, { method: 'DELETE', credentials: 'include' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Error')
      setMsg('Eliminada')
      load()
      try { window.dispatchEvent(new CustomEvent('pokedex-changed', { detail: { action: 'deleted', slug } })) } catch (_) {}
    } catch (e:any) { setMsg('Error: ' + (e?.message || String(e))) }
  }

  return (
    <div>
      {msg && <div className="text-sm mb-2">{msg}</div>}
      <div className="grid gap-3">
        {list.map(p => (
          <div key={p.slug} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-800 p-3 rounded shadow-sm hover:shadow-md transition">
            <div className="mb-2 sm:mb-0">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">{p.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{p.slug} {p.game ? `· ${p.game}` : ''}</div>
            </div>
            <div className="flex gap-2 items-center">
              <button aria-label={`Editar ${p.name}`} className="px-3 py-1.5 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300" onClick={() => router.push(`/admin/pokedex/${p.slug}/edit`)}>Editar</button>
              <button aria-label={`Publicar ${p.name}`} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-300" onClick={() => publish(p.slug)}>Publicar</button>
              <button aria-label={`Eliminar ${p.name}`} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300" onClick={() => removePokedex(p.slug)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
