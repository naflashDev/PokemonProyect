import { Pokemon } from "../entities/Pokemon"

export interface IPokemonRepository {
  create(pokemon: Pokemon): Promise<Pokemon>
  update(pokemon: Pokemon): Promise<Pokemon>
  findById(id: number): Promise<Pokemon | null>
  findByPokedexSlug(slug: string): Promise<Pokemon[]>
  countCapturedByPokedex(slug: string): Promise<number>
  countTotalByPokedex(slug: string): Promise<number>
}
