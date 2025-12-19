"use client"
import { useState } from 'react'

export default function AdminPage() {
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [message, setMessage] = useState('')

  async function createPokedex(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Creando...')
    const res = await fetch('/api/admin/pokedex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, name, game }) })
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
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="slug (ej: hoenn)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Juego / Generación" value={game} onChange={(e) => setGame(e.target.value)} />
          <button className="px-4 py-2 bg-blue-600 rounded" type="submit">Crear</button>
        </form>
        {message && <div className="mt-2 text-sm">{message}</div>}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Añadir Pokémon (ejemplo)</h2>
        <AddPokemonForm />
      </section>
    </div>
  )
}

function AddPokemonForm() {
  const [pokedexSlug, setPokedexSlug] = useState('')
  const [name, setName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [types, setTypes] = useState('')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Guardando...')
    const res = await fetch('/api/admin/pokemon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pokedexSlug, nationalId: Number(nationalId), name, types: types.split(',').map(s => s.trim()), imageUrl }) })
    const json = await res.json()
    if (res.ok) setMessage('Añadido: ' + json.name)
    else setMessage('Error: ' + json.error)
  }

  return (
    <form onSubmit={submit} className="space-y-2 max-w-md">
      <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="pokedex slug" value={pokedexSlug} onChange={(e) => setPokedexSlug(e.target.value)} />
      <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="National ID" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
      <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Tipos (separados por coma)" value={types} onChange={(e) => setTypes(e.target.value)} />
      <input className="w-full p-2 rounded bg-gray-800 text-white" placeholder="Imagen URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-green-600 rounded" type="submit">Añadir</button>
        <button type="button" className="px-4 py-2 bg-indigo-600 rounded" onClick={async () => {
          if (!pokedexSlug) return alert('slug requerido')
          const r = await fetch('/api/admin/pokedex', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish', slug: pokedexSlug }) })
          const j = await r.json()
          if (r.ok) setMessage('Publicado: ' + j.slug)
          else setMessage('Error: ' + j.error)
        }}>Publicar</button>
      </div>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </form>
  )
}
