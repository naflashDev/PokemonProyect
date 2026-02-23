import prisma from "../../prisma/client"
import { IUserPokemonStatusRepository } from "../../domain/repositories/IUserPokemonStatusRepository"
import { UserPokemonStatus } from "../../domain/entities/UserPokemonStatus"

export class PrismaUserPokemonStatusRepository implements IUserPokemonStatusRepository {
  async upsert(status: UserPokemonStatus): Promise<UserPokemonStatus> {
    const pokedexId = (status as any).pokedexId ?? null

    // Try to find existing row first (safer than upsert with nullable composite keys)
    const existing = await prisma.userPokemonStatus.findFirst({ where: { userId: status.userId, pokemonId: status.pokemonId, pokedexId } })
    let row
    if (existing) {
      row = await prisma.userPokemonStatus.update({ where: { id: existing.id }, data: { has: status.has, shinyOnly: status.shinyOnly, allForms: status.allForms, seen: status.seen } })
    } else {
      row = await prisma.userPokemonStatus.create({ data: { userId: status.userId, pokemonId: status.pokemonId, pokedexId, has: status.has, shinyOnly: status.shinyOnly, allForms: status.allForms, seen: status.seen } })
    }

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
  async upsertPartial(userId: number, pokemonId: number, data: { has?: boolean; shinyOnly?: boolean; allForms?: boolean; seen?: boolean }, pokedexId?: number | null): Promise<UserPokemonStatus> {
    const createData: any = {
      userId,
      pokemonId,
      pokedexId: typeof pokedexId !== 'undefined' ? pokedexId : null,
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

    const targetPokedexId = typeof pokedexId !== 'undefined' ? pokedexId : null

    const existing = await prisma.userPokemonStatus.findFirst({ where: { userId, pokemonId, pokedexId: targetPokedexId } })
    let row
    if (existing) {
      row = await prisma.userPokemonStatus.update({ where: { id: existing.id }, data: updateData })
    } else {
      row = await prisma.userPokemonStatus.create({ data: createData })
    }

    return new UserPokemonStatus({ id: row.id, userId: row.userId, pokemonId: row.pokemonId, has: row.has, shinyOnly: row.shinyOnly, allForms: row.allForms, seen: row.seen })
  }

  async findByUserAndPokemon(userId: number, pokemonId: number, pokedexId?: number | null): Promise<UserPokemonStatus | null> {
    const whereClause: any = { userId, pokemonId }
    whereClause.pokedexId = typeof pokedexId !== 'undefined' ? pokedexId : null

    const row = await prisma.userPokemonStatus.findFirst({ where: whereClause })
    if (!row) return null
    return new UserPokemonStatus({ id: row.id, userId: row.userId, pokemonId: row.pokemonId, has: row.has, shinyOnly: row.shinyOnly, allForms: row.allForms, seen: row.seen })
  }

  async countCapturedByUserAndPokedex(userId: number, pokedexSlug: string): Promise<number> {
    // The project stores per-pokedex membership in the PokedexPokemon join table.
    // Counting captured statuses must consider that a Pokemon may be linked to a Pokedex
    // via the join table rather than the Pokemon.pokedex relation. Use a relation
    // filter through `pokemon.pokedexPokemons` to ensure we count correctly.
    // Count captured statuses that belong to the specific pokedex
    const count = await prisma.userPokemonStatus.count({ where: { userId, has: true, pokedex: { slug: pokedexSlug } } })

    return count
  }

  async countTotalByPokedex(pokedexSlug: string): Promise<number> {
    const count = await prisma.pokedexPokemon.count({ where: { pokedex: { slug: pokedexSlug } } })
    return count
  }
}
