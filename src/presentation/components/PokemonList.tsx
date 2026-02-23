"use client"
import { useEffect, useState } from 'react'
import markQueue, { enqueueMark } from '../../lib/markQueue'

type Pokemon = {
  id: number
  nationalId: number
  name: string
  types: string[]
  captured: boolean
  shiny: boolean
  seen?: boolean
}

export default function PokemonList({ pokedexSlug, onProgressUpdate }: { pokedexSlug: string, onProgressUpdate?: (percent: number) => void }) {
  const [items, setItems] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 25
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('pokedex', pokedexSlug)
    params.set('page', String(page))
    params.set('perPage', String(perPage))
    if (q.trim()) params.set('q', q.trim())

    fetch(`/api/pokemon?${params.toString()}`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) {
          // try to parse error body, fallback to status
          try {
            const err = await r.json()
            throw new Error(err?.error || err?.message || `HTTP ${r.status}`)
          } catch (_) {
            throw new Error(`HTTP ${r.status}`)
          }
        }

        // handle empty body or invalid JSON safely
        const text = await r.text()
        if (!text) return { items: [], total: 0 }
        try {
          return JSON.parse(text)
        } catch (e) {
          console.error('Failed to parse JSON from /api/pokemon response:', text)
          return { items: [], total: 0 }
        }
      })
      .then((data) => {
        setItems((data as any).items ?? [])
        setTotal(Number((data as any).total || 0))
      })
      .catch((e) => {
        console.error('Error fetching pokemons:', e)
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [pokedexSlug, page, q])

  // listen for global user-pokedex-changed events and refetch if this pokedex was invalidated
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const d = e?.detail
        if (!d || d.pokedex !== pokedexSlug) return
        // if server provided authoritative percent update, update progress via prop
        if (typeof d.percent === 'number') {
          try { onProgressUpdate?.(d.percent) } catch (_) {}
        }
        // if invalidation requested, reload current page of items
        if (d.invalidate) {
          setLoading(true)
          const params = new URLSearchParams()
          params.set('pokedex', pokedexSlug)
          params.set('page', String(page))
          params.set('perPage', String(perPage))
          if (q.trim()) params.set('q', q.trim())
          fetch(`/api/pokemon?${params.toString()}`, { credentials: 'include' })
            .then(async (r) => r.json().catch(() => ({ items: [], total: 0 })))
            .then((data) => {
              setItems((data as any).items ?? [])
              setTotal(Number((data as any).total || 0))
            })
            .catch((e) => console.error('Error reloading pokemons after invalidate', e))
            .finally(() => setLoading(false))
        }
      } catch (_) {}
    }

    window.addEventListener('user-pokedex-changed', handler as EventListener)
    return () => window.removeEventListener('user-pokedex-changed', handler as EventListener)
  }, [pokedexSlug, page, perPage, q, onProgressUpdate])

  

  async function markCaptured(pokemonId: number) {
    try {
      const current = items.find(it => it.id === pokemonId)
      const targetCaptured = current ? !current.captured : true
      // optimistic update locally
      const updated = items.map(it => it.id === pokemonId ? { ...it, captured: targetCaptured } : it)
      setItems(updated)

      // compute optimistic percent and dispatch immediately
      try {
        const capturedCount = updated.filter(i => i.captured).length
        const percentOptimistic = total === 0 ? 0 : Math.round((capturedCount / total) * 100)
        try {
          // keep the highest known progress to avoid accidental overwrite by stale server responses
          const existing = Number(localStorage.getItem(`pokedex-progress:${pokedexSlug}`) || 0)
          const toStore = Math.max(existing || 0, percentOptimistic)
          localStorage.setItem(`pokedex-progress:${pokedexSlug}`, String(toStore))
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('user-pokedex-changed', { detail: { pokedex: pokedexSlug, percent: percentOptimistic } }))
        try { onProgressUpdate?.(percentOptimistic) } catch (_) {}
      } catch (_) {}

      // enqueue change to reduce DB calls
      try { enqueueMark({ pokemonId, pokedex: pokedexSlug, captured: targetCaptured }) } catch (e) { console.error(e) }
    } catch (e) { console.error(e) }
  }

  async function toggleSeen(pokemonId: number) {
    try {
      const current = items.find(it => it.id === pokemonId)
      const targetSeen = current ? !(current.seen ?? false) : true
      const updated = items.map(it => it.id === pokemonId ? { ...it, seen: targetSeen } : it)
      setItems(updated)
      try {
        const capturedCount = updated.filter(i => i.captured).length
        const percentOptimistic = total === 0 ? 0 : Math.round((capturedCount / total) * 100)
        try { localStorage.setItem(`pokedex-progress:${pokedexSlug}`, String(percentOptimistic)) } catch (_) {}
        window.dispatchEvent(new CustomEvent('user-pokedex-changed', { detail: { pokedex: pokedexSlug, percent: percentOptimistic } }))
        try { onProgressUpdate?.(percentOptimistic) } catch (_) {}
      } catch (_) {}
      try { enqueueMark({ pokemonId, pokedex: pokedexSlug, seen: targetSeen }) } catch (e) { console.error(e) }
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      {loading && <p className="text-gray-400">Cargando...</p>}
      <div className="mb-4 flex items-center gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Buscar por nombre o #" className="border px-3 py-2 rounded flex-1" />
      </div>

      {!loading && (
        <ul className="grid grid-cols-5 gap-4">
          {items.map((p) => (
            <li key={p.id} className="card hover:shadow-md transition p-4 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
                  {/* placeholder for image if available */}
                  <img src={(p as any).imageUrl || '/placeholder.png'} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg capitalize">{p.name}</div>
                  <div className="text-sm text-gray-500">#{p.nationalId}</div>
                  <div className="text-sm text-gray-600 mt-1">{p.types.join(', ')}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">
                  {p.captured ? <span className="text-green-600 font-medium">Capturado</span> : <span className="text-gray-600">No capturado</span>}<br />
                  {(p.seen ?? false) ? <span className="text-indigo-600 font-medium">Visto</span> : <span className="text-gray-500">No visto</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markCaptured(p.id)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300">{p.captured ? 'Desmarcar' : 'Marcar capturado'}</button>
                  <button onClick={() => toggleSeen(p.id)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">{(p.seen ?? false) ? 'Marcar no visto' : 'Marcar visto'}</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">Mostrando {(page-1)*perPage+1} - {Math.min(page*perPage, total)} de {total}</div>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">Anterior</button>
          <button disabled={page*perPage>=total} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
