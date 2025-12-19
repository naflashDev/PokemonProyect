import { UserPokemonStatus } from "../entities/UserPokemonStatus"

export interface IUserPokemonStatusRepository {
  upsert(status: UserPokemonStatus): Promise<UserPokemonStatus>
  findByUserAndPokemon(userId: number, pokemonId: number): Promise<UserPokemonStatus | null>
  countCapturedByUserAndPokedex(userId: number, pokedexSlug: string): Promise<number>
  countTotalByPokedex(pokedexSlug: string): Promise<number>
}
