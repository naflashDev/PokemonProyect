import prisma from "../../prisma/client"
import { IUserPokemonStatusRepository } from "../../domain/repositories/IUserPokemonStatusRepository"
import { UserPokemonStatus } from "../../domain/entities/UserPokemonStatus"

export class PrismaUserPokemonStatusRepository implements IUserPokemonStatusRepository {
  async upsert(status: UserPokemonStatus): Promise<UserPokemonStatus> {
    const row = await prisma.userPokemonStatus.upsert({
      where: { userId_pokemonId: { userId: status.userId, pokemonId: status.pokemonId } },
      update: {
        has: status.has,
        shinyOnly: status.shinyOnly,
        allForms: status.allForms
      },
      create: {
        userId: status.userId,
        pokemonId: status.pokemonId,
        has: status.has,
        shinyOnly: status.shinyOnly,
        allForms: status.allForms
      }
    })

    return new UserPokemonStatus({
      id: row.id,
      userId: row.userId,
      pokemonId: row.pokemonId,
      has: row.has,
      shinyOnly: row.shinyOnly,
      allForms: row.allForms
    })
  }

  async findByUserAndPokemon(userId: number, pokemonId: number): Promise<UserPokemonStatus | null> {
    const row = await prisma.userPokemonStatus.findUnique({ where: { userId_pokemonId: { userId, pokemonId } } })
    if (!row) return null
    return new UserPokemonStatus({ id: row.id, userId: row.userId, pokemonId: row.pokemonId, has: row.has, shinyOnly: row.shinyOnly, allForms: row.allForms })
  }

  async countCapturedByUserAndPokedex(userId: number, pokedexSlug: string): Promise<number> {
    const count = await prisma.userPokemonStatus.count({ where: { userId, pokemon: { pokedex: { slug: pokedexSlug } }, has: true } })
    return count
  }

  async countTotalByPokedex(pokedexSlug: string): Promise<number> {
    const count = await prisma.pokemon.count({ where: { pokedex: { slug: pokedexSlug } } })
    return count
  }
}
