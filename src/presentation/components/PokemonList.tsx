"use client"
import { useEffect, useState } from 'react'

type Pokemon = {
  id: number
  nationalId: number
  name: string
  types: string[]
  captured: boolean
  shiny: boolean
}

export default function PokemonList({ pokedexSlug }: { pokedexSlug: string }) {
  const [items, setItems] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pokemon?pokedex=${encodeURIComponent(pokedexSlug)}`)
      .then((r) => r.json())
      .then((data) => setItems(data ?? []))
      .finally(() => setLoading(false))
  }, [pokedexSlug])

  return (
    <div>
      {loading && <p>Cargando...</p>}
      {!loading && (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((p) => (
            <li key={p.id} className="p-3 border rounded bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.name} <span className="text-sm text-gray-500">#{p.nationalId}</span></div>
                  <div className="text-sm text-gray-600">{p.types.join(', ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{p.captured ? 'Capturado' : 'No'}</div>
                  {p.shiny && <div className="text-xs text-yellow-600">Variocolor</div>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
