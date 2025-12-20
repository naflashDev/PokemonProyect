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
        allForms: status.allForms,
        seen: status.seen
      },
      create: {
        userId: status.userId,
        pokemonId: status.pokemonId,
        has: status.has,
        shinyOnly: status.shinyOnly,
        allForms: status.allForms,
        seen: status.seen
      }
    })

    return new UserPokemonStatus({
      id: row.id,
      userId: row.userId,
      pokemonId: row.pokemonId,
      has: row.has,
      shinyOnly: row.shinyOnly,
      allForms: row.allForms,
      seen: row.seen
    })
  }

  // Upsert allowing partial fields so callers can update only `has` or only `seen` without overwriting other fields.
  async upsertPartial(userId: number, pokemonId: number, data: { has?: boolean; shinyOnly?: boolean; allForms?: boolean; seen?: boolean }): Promise<UserPokemonStatus> {
    const createData: any = {
      userId,
      pokemonId,
      user: {
        connectOrCreate: {
          where: { id: userId },
          create: { id: userId }
        }
      },
      pokemon: {
        connect: { id: pokemonId }
      },
      has: data.has ?? false,
      shinyOnly: data.shinyOnly ?? false,
      allForms: data.allForms ?? false,
      seen: data.seen ?? false
    }

    const updateData: any = {}
    if (typeof data.has !== 'undefined') updateData.has = data.has
    if (typeof data.shinyOnly !== 'undefined') updateData.shinyOnly = data.shinyOnly
    if (typeof data.allForms !== 'undefined') updateData.allForms = data.allForms
    if (typeof data.seen !== 'undefined') updateData.seen = data.seen

    const row = await prisma.userPokemonStatus.upsert({
      where: { userId_pokemonId: { userId, pokemonId } },
      create: createData,
      update: updateData
    })

    return new UserPokemonStatus({ id: row.id, userId: row.userId, pokemonId: row.pokemonId, has: row.has, shinyOnly: row.shinyOnly, allForms: row.allForms, seen: row.seen })
  }

  async findByUserAndPokemon(userId: number, pokemonId: number): Promise<UserPokemonStatus | null> {
    const row = await prisma.userPokemonStatus.findUnique({ where: { userId_pokemonId: { userId, pokemonId } } })
    if (!row) return null
    return new UserPokemonStatus({ id: row.id, userId: row.userId, pokemonId: row.pokemonId, has: row.has, shinyOnly: row.shinyOnly, allForms: row.allForms, seen: row.seen })
  }

  async countCapturedByUserAndPokedex(userId: number, pokedexSlug: string): Promise<number> {
    // The project stores per-pokedex membership in the PokedexPokemon join table.
    // Counting captured statuses must consider that a Pokemon may be linked to a Pokedex
    // via the join table rather than the Pokemon.pokedex relation. Use a relation
    // filter through `pokemon.pokedexPokemons` to ensure we count correctly.
    const count = await prisma.userPokemonStatus.count({
      where: {
        userId,
        has: true,
        pokemon: {
          pokedexPokemons: {
            some: { pokedex: { slug: pokedexSlug } }
          }
        }
      }
    })

    return count
  }

  async countTotalByPokedex(pokedexSlug: string): Promise<number> {
    const count = await prisma.pokemon.count({ where: { pokedex: { slug: pokedexSlug } } })
    return count
  }
}
