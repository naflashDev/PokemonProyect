"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
// PokemonCard removed from admin page; keep component if used elsewhere

export default function AdminPage() {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const router = useRouter()

  // Require session (client-side). Redirect to /signin if unauthenticated
  useSession({ required: true, onUnauthenticated() { router.push('/signin') } })

  async function createPokedex(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Creando...')
    const res = await fetch('/api/admin/pokedex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, name, game, initialPokemonNames: selectedNames }) })
    const json = await res.json()
    if (res.ok) setMessage('Pokedex creada: ' + json.slug)
    else setMessage('Error: ' + json.error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Panel Admin</h1>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Crear Pokédex</h2>
        <form onSubmit={createPokedex} className="space-y-2 max-w-md">
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Nombre" value={name} onChange={(e) => {
            const v = e.target.value
            setName(v)
            if (!slugTouched) {
              // generate slug automatically
              const s = v.normalize('NFKD').replace(/\u0300-\u036f/g, '')
                .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
                .replace(/-+/g, '-')
              setSlug(s)
            }
          }} />
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Juego / Generación" value={game} onChange={(e) => setGame(e.target.value)} />
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Slug (url-friendly, ej: hoenn)" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }} />

          <div>
            <label className="text-sm text-gray-300">Seleccionar Pokémon (por nombre)</label>
            <div className="flex gap-2 mt-1">
              <input list="names" className="flex-1 p-2 rounded bg-gray-800 text-white" placeholder="Buscar nombre..." value={search} onChange={async (e) => {
                const v = e.target.value
                setSearch(v)
                if (v.length < 1) { setSuggestions([]); return }
                try {
                  const r = await fetch('/api/public/pokemon/names?q=' + encodeURIComponent(v))
                  const js = await r.json()
                  setSuggestions(js || [])
                } catch (err) { setSuggestions([]) }
              }} />
              <datalist id="names">
                {suggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
              <button type="button" className="px-3 py-2 bg-sky-600 rounded" onClick={() => {
                if (!search) return
                if (!selectedNames.includes(search)) setSelectedNames([...selectedNames, search])
                setSearch('')
                setSuggestions([])
              }}>Añadir</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedNames.map(n => (
                <div key={n} className="px-2 py-1 bg-gray-700 rounded text-sm flex items-center gap-2">
                  <span className="capitalize">{n}</span>
                  <button onClick={() => setSelectedNames(selectedNames.filter(x => x !== n))} className="text-xs bg-red-500 px-1 rounded">x</button>
                </div>
              ))}
            </div>
          </div>

          <button className="px-4 py-2 bg-blue-600 rounded" type="submit">Crear</button>
        </form>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold mb-2">Catálogo (asignar a Pokédex)</h2>
        <CatalogManager />
      </section>

      <section>
        <div className="mt-4">
          <h4 className="font-semibold">Importar catálogo completo</h4>
          <p className="text-sm text-gray-400">Descarga y guarda en la base de datos todos los Pokémon (se almacenan en la Pokédex interna <strong>catalog</strong>).</p>
          <div className="flex gap-2 mt-2">
            <button className="px-4 py-2 bg-rose-600 rounded" onClick={async () => {
              if (!confirm('Esto importará TODOS los Pokémon desde PokeAPI a la pokedex interna `catalog`. Continuar?')) return
              setMessage('Importando catálogo... esto puede tardar varios minutos')
              try {
                const r = await fetch('/api/admin/import/pokeapi-catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ concurrency: 8 }) })
                const j = await r.json()
                if (r.ok) setMessage(`Importados: ${j.imported}/${j.total}`)
                else setMessage('Error: ' + j.error)
              } catch (e:any) { setMessage('Error: ' + e.message) }
            }}>Importar catálogo (todos)</button>
          </div>
        </div>
      </section>
    </div>
  )
}

// AddPokemonForm removed from admin page

// ImportFromPokeAPI removed from admin page

function CatalogManager() {
  const [items, setItems] = useState<Array<any>>([])
  const [pokedexes, setPokedexes] = useState<Array<any>>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedMap, setSelectedMap] = useState<Record<number, string[]>>({})

  async function load(p = page, q = query) {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/catalog/list?page=${p}&perPage=${perPage}&q=${encodeURIComponent(q)}`),
        fetch('/api/admin/pokedex/list')
      ])
        const js1 = await r1.json()
        const js2 = await r2.json()
        if (!r1.ok) {
          setMsg('Error cargando catálogo: ' + (js1.error || r1.status))
          setItems([])
        } else {
          setItems(js1.items || [])
          setTotal(js1.total || 0)
        }
        if (!r2.ok) {
          setMsg('Error cargando pokedex list: ' + (js2.error || r2.status))
          setPokedexes([])
        } else {
          setPokedexes(js2 || [])
        }
    } catch (e:any) {
        setMsg('Error cargando catálogo: ' + String(e))
    } finally { setLoading(false) }
  }

  // auto-load on mount
  useEffect(() => { load(1, '') }, [])

  async function assignMultiple(pokemonId: number, slugs: string[]) {
    setMsg('Asignando...')
    try {
      const r = await fetch('/api/admin/catalog/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pokemonId, pokedexSlugs: slugs }) })
      const j = await r.json()
      if (r.ok) {
        setMsg('Asignado: ' + pokemonId)
        // remove from list (considered assigned)
        setItems(items.filter(i => i.id !== pokemonId))
      } else setMsg('Error: ' + j.error)
    } catch (e:any) { setMsg('Error: ' + e.message) }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button className="px-3 py-2 bg-sky-600 rounded" onClick={load} disabled={loading}>{loading ? 'Cargando...' : 'Cargar catálogo'}</button>
        <div className="text-sm text-gray-400">{msg}</div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-gray-800 p-3 rounded flex flex-col items-stretch">
            <div className="flex-1 flex items-center justify-center mb-2">
              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-contain" /> : <div className="w-20 h-20 bg-gray-700 rounded" />}
            </div>
            <div className="text-center capitalize font-semibold">{item.name}</div>
            <div className="text-sm text-gray-400 text-center">#{item.nationalId}</div>
            <div className="mt-2">
              <label className="text-xs text-gray-300">Asignar a (multiple)</label>
              <select multiple className="w-full mt-1 p-1 bg-gray-700 rounded h-24" value={selectedMap[item.id] || []} onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(o => o.value)
                setSelectedMap({ ...selectedMap, [item.id]: opts })
              }}>
                {pokedexes.map(p => <option key={p.slug} value={p.slug}>{p.name} ({p.slug})</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <button className="flex-1 px-2 py-1 bg-green-600 rounded" onClick={() => assignMultiple(item.id, selectedMap[item.id] || [])}>Asignar</button>
                <button className="px-2 py-1 bg-gray-600 rounded" onClick={() => { const m = { ...selectedMap }; delete m[item.id]; setSelectedMap(m) }}>Limpiar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-300">Mostrando {(page-1)*perPage+1} - {Math.min(page*perPage, total)} de {total}</div>
        <div className="flex gap-2">
          <button disabled={page<=1} onClick={() => { setPage(page-1); load(page-1) }} className="px-3 py-1 bg-gray-700 rounded">Prev</button>
          <button disabled={page*perPage>=total} onClick={() => { setPage(page+1); load(page+1) }} className="px-3 py-1 bg-gray-700 rounded">Next</button>
        </div>
      </div>
    </div>
  )
}
