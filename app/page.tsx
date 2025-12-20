"use client"
import { useEffect, useState } from 'react'
import PokemonList from '../src/presentation/components/PokemonList'

function PokedexCards({ onSelect }: { onSelect: (slug: string) => void }) {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/pokedexes', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json().catch(() => null)
        if (!r.ok) {
          const msg = j?.error || j?.message || `HTTP ${r.status}`
          throw new Error(msg)
        }
        const data = Array.isArray(j) ? j : (j?.data ?? j?.results ?? [])
        const listData = Array.isArray(data) ? data : []
        setList(normalizeList(listData))
      })
      .catch((e: any) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  function normalizeList(listData: any[]) {
    return listData.map((px: any) => {
      try {
        const stored = localStorage.getItem(`pokedex-progress:${px.slug}`)
        const percentFromStore = stored != null ? Number(stored) : undefined
        const existingPercent = px?.progress && (typeof px.progress === 'number' ? px.progress : px.progress.percent)
        const percent = typeof percentFromStore === 'number' && !Number.isNaN(percentFromStore) ? percentFromStore : (typeof existingPercent === 'number' ? existingPercent : 0)
        return { ...px, progress: { percent: Math.max(0, Math.min(100, Number(percent || 0))) } }
      } catch (_) {
        return { ...px, progress: { percent: px?.progress?.percent ?? 0 } }
      }
    })
  }

  useEffect(() => {
      const handler = (e: any) => {
        try {
          const detail = e?.detail
          console.log('[Page] received user-pokedex-changed', detail)
          if (!detail || !detail.pokedex) return

          // full percent update
          if (typeof detail.percent === 'number') {
            try { localStorage.setItem(`pokedex-progress:${detail.pokedex}`, String(detail.percent)) } catch (_) {}
            const p = Math.max(0, Math.min(100, Number(detail.percent)))
            setList(prev => prev.map(px => px.slug === detail.pokedex ? { ...px, progress: { percent: p } } : px))
            return
          }

          // optimistic delta update when server didn't return full percent
          if (typeof detail.deltaCaptured === 'number' && typeof detail.total === 'number') {
            setList(prev => prev.map(px => {
              if (px.slug !== detail.pokedex) return px
              const cur = px?.progress && (typeof px.progress === 'number' ? px.progress : px.progress.percent)
              const prevPercent = typeof cur === 'number' ? cur : 0
              const prevCount = Math.round((prevPercent / 100) * detail.total)
              const newCount = prevCount + detail.deltaCaptured
              const newPercent = detail.total === 0 ? 0 : Math.round((newCount / detail.total) * 100)
              return { ...px, progress: { percent: Math.max(0, Math.min(100, newPercent)) } }
            }))
            return
          }

          // fallback: refetch list and normalize
          setLoading(true)
          fetch('/api/pokedexes', { credentials: 'include', cache: 'no-store' })
            .then(async (r) => {
              const j = await r.json().catch(() => null)
              if (!r.ok) {
                const msg = j?.error || j?.message || `HTTP ${r.status}`
                throw new Error(msg)
              }
              const data = Array.isArray(j) ? j : (j?.data ?? j?.results ?? [])
              const listData = Array.isArray(data) ? data : []
              setList(normalizeList(listData))
            })
            .catch((err: any) => setError(String(err)))
            .finally(() => setLoading(false))
        } catch (_) {
          // ignore malformed events
        }
      }

    window.addEventListener('user-pokedex-changed', handler as EventListener)
    return () => window.removeEventListener('user-pokedex-changed', handler as EventListener)
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Pokédex</h1>
      {loading && <div className="text-gray-500">Cargando pokedex...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(Array.isArray(list) ? list : []).map(px => (
          <button key={px.slug} onClick={() => onSelect(px.slug)} className="text-left bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition flex flex-col">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg">{px.name}</div>
              <div className="text-sm text-gray-500">{px.slug}</div>
            </div>
            <div className="mt-3">
              <div className="text-sm text-gray-600">Progreso: <span className="font-medium">{px.progress?.percent ?? 0}%</span></div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 mt-2 overflow-hidden">
                <div style={{ width: `${px.progress?.percent ?? 0}%` }} className="h-2 bg-gradient-to-r from-green-400 to-blue-600" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null)

  // when selecting a pokedex, fetch its current progress so we can show it
  useEffect(() => {
    if (!selected) return
    let mounted = true
    // try to show any locally persisted optimistic percent immediately
    try {
      const stored = localStorage.getItem(`pokedex-progress:${selected}`)
      if (stored != null) setSelectedPercent(Number(stored))
    } catch (_) {}
    fetch(`/api/pokedexes/progress?slug=${encodeURIComponent(selected)}`, { credentials: 'include' })
      .then(async (r) => r.json().catch(() => null))
      .then((j) => {
        if (!mounted) return
        const p = j?.progress?.percent
        setSelectedPercent(typeof p === 'number' ? p : null)
      })
      .catch(() => {
        if (!mounted) return
        setSelectedPercent(null)
      })
    return () => { mounted = false }
  }, [selected])

  // listen for progress changes so the selected view updates immediately
  useEffect(() => {
    const handler = (e: any) => {
      const d = e?.detail
      if (!d || !d.pokedex) return
      if (d.pokedex === selected) {
        if (typeof d.percent === 'number') {
          setSelectedPercent(d.percent)
          return
        }
        if (typeof d.deltaCaptured === 'number' && typeof d.total === 'number') {
          setSelectedPercent((prevPercentRaw) => {
            const prevPercent = Number(prevPercentRaw ?? 0)
            const prevCount = Math.round((prevPercent / 100) * d.total)
            const newCount = prevCount + d.deltaCaptured
            const newPercent = d.total === 0 ? 0 : Math.round((newCount / d.total) * 100)
            return Math.max(0, Math.min(100, newPercent))
          })
          return
        }
        // if only total is provided (e.g., seen toggle), ensure selectedPercent is not left null
        if (typeof d.total === 'number' && selectedPercent === null) {
          setSelectedPercent(0)
        }
      }
    }
    window.addEventListener('user-pokedex-changed', handler as EventListener)
    return () => window.removeEventListener('user-pokedex-changed', handler as EventListener)
  }, [selected])

  // persist and log selectedPercent changes for debugging
  useEffect(() => {
    console.log('[Page] selectedPercent changed', { selected, selectedPercent })
    if (!selected) return
    try { localStorage.setItem(`pokedex-progress:${selected}`, String(selectedPercent ?? 0)) } catch (_) {}
  }, [selectedPercent, selected])

  return (
    <div className="space-y-6">
      {!selected && <PokedexCards onSelect={(s) => setSelected(s)} />}
      {selected && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setSelected(null)}>← Volver</button>
            <h2 className="text-xl font-semibold">Pokédex: {selected}</h2>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-600">Progreso: <span className="font-medium">{selectedPercent ?? 0}%</span></div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 mt-2 overflow-hidden">
              <div style={{ width: `${selectedPercent ?? 0}%` }} className="h-2 bg-gradient-to-r from-green-400 to-blue-600" />
            </div>
          </div>
          <PokemonList pokedexSlug={selected} onProgressUpdate={(p) => setSelectedPercent(p)} />
        </div>
      )}
    </div>
  )
}
