import PokemonList from '../src/presentation/components/PokemonList'

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pokédex — Ejemplo</h1>
      <PokemonList pokedexSlug="kanto" />
    </div>
  )
}
