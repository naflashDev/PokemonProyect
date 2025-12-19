import { Pokedex } from "../entities/Pokedex"

export interface IPokedexRepository {
  create(p: Pokedex): Promise<Pokedex>
  findBySlug(slug: string): Promise<Pokedex | null>
  publish(slug: string): Promise<Pokedex>
  listPublished(): Promise<Pokedex[]>
}
