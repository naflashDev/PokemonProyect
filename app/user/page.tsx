import PokemonCard from '../../src/presentation/components/PokemonCard'

async function fetchPublishedPokedexes() {
  const res = await fetch('/api/pokemon?listPublished=1', { cache: 'no-store' })
  return res.json()
}

export default async function UserPage() {
  // For simplicity fetch published pokedexes and show first one
  const data = await fetchPublishedPokedexes()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Panel Usuario</h1>
      <section>
        <h2 className="font-semibold mb-2">Pokedex publicada (ejemplo)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.isArray(data) && data.length > 0 ? (
            data.map((p: any) => (
              <div key={p.id}>
                <PokemonCard name={p.name} imageUrl={p.imageUrl ?? null} />
              </div>
            ))
          ) : (
            <div>No hay Pokédex publicadas.</div>
          )}
        </div>
      </section>
    </div>
  )
}
