"use client"
import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditPokedexPage() {
  const router = useRouter()
  const params = useParams() as { slug: string }
  const slug = params.slug
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [status, setStatus] = useState('draft')
  const [pokemons, setPokemons] = useState<Array<any>>([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/admin/pokedex/${encodeURIComponent(slug)}`, { credentials: 'include' })
        const j = await r.json()
        if (!r.ok) { setMsg('Error: ' + (j.error || r.status)); return }
        setName(j.name || '')
        setGame(j.game || '')
        setStatus(j.status || 'draft')
        setPokemons(j.pokemons || [])
      } catch (e:any) { setMsg(String(e)) }
      finally { setLoading(false) }
    }
    load()
  }, [slug])

  async function save() {
    setMsg('Guardando...')
    try {
      const r = await fetch('/api/admin/pokedex', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', slug, name, game, status }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Error')
      setMsg('Guardado')
    } catch (e:any) { setMsg('Error: ' + e.message) }
  }

  async function removePokemon(pokemonId: number) {
    if (!confirm('Eliminar este Pokémon de la pokedex?')) return
    setMsg('Eliminando...')
    try {
      const r = await fetch('/api/admin/pokedex', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'removePokemon', slug, pokemonId }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Error')
      setPokemons(pokemons.filter(p => p.id !== pokemonId))
      setMsg('Eliminado')
    } catch (e:any) { setMsg('Error: ' + e.message) }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Editar Pokédex: {slug}</h1>
      <div className="space-y-2 max-w-md mb-4">
        <input className="w-full p-2 rounded bg-gray-800 text-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />
        <input className="w-full p-2 rounded bg-gray-800 text-white" value={game} onChange={(e) => setGame(e.target.value)} placeholder="Juego / Generación" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 rounded bg-gray-800 text-white">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-1 bg-blue-600 rounded">Guardar</button>
          <button onClick={() => router.push('/admin')} className="px-3 py-1 bg-gray-600 rounded">Volver</button>
        </div>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </div>

      <section>
        <h2 className="font-semibold mb-2">Pokémon en esta Pokédex</h2>
        <div className="grid grid-cols-5 gap-3">
          {pokemons.map((p:any) => (
            <div key={p.id} className="bg-gray-800 p-3 rounded">
              <div className="font-semibold capitalize">{p.name}</div>
              <div className="text-sm text-gray-400">#{p.nationalId}</div>
              <div className="mt-2 flex gap-2">
                <button className="px-2 py-1 bg-red-600 rounded" onClick={() => removePokemon(p.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
