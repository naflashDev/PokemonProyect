import { Pokemon } from "../entities/Pokemon"

export interface IPokemonRepository {
  create(pokemon: Pokemon): Promise<Pokemon>
  update(pokemon: Pokemon): Promise<Pokemon>
  findById(id: number): Promise<Pokemon | null>
  findByPokedexSlug(slug: string): Promise<Pokemon[]>
  findByPokedexSlugPaged(slug: string, page: number, perPage: number, q?: string): Promise<{ items: Pokemon[]; total: number }>
  countCapturedByPokedex(slug: string): Promise<number>
  countTotalByPokedex(slug: string): Promise<number>
  updatePokedexPokemonStatus(pokedexSlug: string, pokemonId: number, captured: boolean, shiny: boolean, complete: boolean): Promise<void>
}
