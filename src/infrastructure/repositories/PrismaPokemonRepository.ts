import prisma from "../../prisma/client"
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"
import { Pokemon } from "../../domain/entities/Pokemon"

function mapRowToEntity(row: any, slugOverride?: string): Pokemon {
  const pokedexSlug = row.pokedex?.slug ?? slugOverride ?? ''
  return new Pokemon({
    id: row.id,
    nationalId: row.nationalId,
    name: row.name,
    types: row.types.split(','),
    pokedexSlug,
    captured: row.captured,
    shiny: row.shiny,
    complete: row.complete,
    form: row.form,
    notes: row.notes,
    imageUrl: row.imageUrl ?? null
  })
}

function mapJoinToEntity(joinRow: any, slugOverride?: string): Pokemon {
  const pk = joinRow.pokemon
  const pokedexSlug = slugOverride ?? (joinRow.pokedex?.slug ?? '')
  return new Pokemon({
    id: pk.id,
    nationalId: pk.nationalId,
    name: pk.name,
    types: pk.types.split(','),
    pokedexSlug,
    captured: joinRow.captured ?? false,
    shiny: joinRow.shiny ?? false,
    complete: joinRow.complete ?? false,
    form: pk.form,
    notes: pk.notes,
    imageUrl: pk.imageUrl ?? null
  })
}

export class PrismaPokemonRepository implements IPokemonRepository {
  async create(pokemon: Pokemon): Promise<Pokemon> {
    // ensure pokedex exists or create a simple one
    let pokedex = await prisma.pokedex.findUnique({ where: { slug: pokemon.pokedexSlug } })
    if (!pokedex) {
      pokedex = await prisma.pokedex.create({ data: { slug: pokemon.pokedexSlug, name: pokemon.pokedexSlug } })
    }

    const row = await prisma.pokemon.create({
      data: {
        nationalId: pokemon.nationalId,
        name: pokemon.name,
        types: pokemon.types.join(','),
        pokedexId: pokedex.id,
        captured: pokemon.captured,
        shiny: pokemon.shiny,
        complete: pokemon.complete,
        form: pokemon.form,
        notes: pokemon.notes,
        imageUrl: (pokemon as any).imageUrl ?? null
      },
      include: { pokedex: true }
    })

    return mapRowToEntity(row)
  }

  async update(pokemon: Pokemon): Promise<Pokemon> {
    const row = await prisma.pokemon.update({
      where: { id: pokemon.id! },
      data: {
        captured: pokemon.captured,
        shiny: pokemon.shiny,
        complete: pokemon.complete,
        form: pokemon.form,
        notes: pokemon.notes
      },
      include: { pokedex: true }
    })

    return mapRowToEntity(row)
  }

  async findById(id: number): Promise<Pokemon | null> {
    const row = await prisma.pokemon.findUnique({ where: { id }, include: { pokedex: true } })
    if (!row) return null
    return mapRowToEntity(row)
  }

  async findByPokedexSlug(slug: string): Promise<Pokemon[]> {
    // fallback simple list: return first page of 25 ordered by addition
    const res = await this.findByPokedexSlugPaged(slug, 1, 25)
    return res.items
  }

  async findByPokedexSlugPaged(slug: string, page: number, perPage: number, q?: string): Promise<{ items: Pokemon[]; total: number }> {
    const skip = Math.max(0, page - 1) * perPage

    const whereAny: any = { pokedex: { slug } }
    if (q && q.trim().length > 0) {
      const qnum = Number(q)
        whereAny.OR = [
          { pokemon: { name: { contains: q } } },
          ...(Number.isFinite(qnum) ? [{ pokemon: { nationalId: qnum } }] : [])
        ]
    }

    const [rows, total] = await Promise.all([
      prisma.pokedexPokemon.findMany({
        where: whereAny,
        include: { pokemon: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: perPage
      }),
      prisma.pokedexPokemon.count({ where: { pokedex: { slug }, ...(q && q.trim().length > 0 ? { OR: whereAny.OR } : {}) } })
    ])

    const items = rows.map((r) => mapJoinToEntity(r, slug))
    return { items, total }
  }

  async countCapturedByPokedex(slug: string): Promise<number> {
    const count = await prisma.pokedexPokemon.count({ where: { pokedex: { slug }, captured: true } })
    return count
  }

  async countTotalByPokedex(slug: string): Promise<number> {
    const count = await prisma.pokedexPokemon.count({ where: { pokedex: { slug } } })
    return count
  }

  async updatePokedexPokemonStatus(pokedexSlug: string, pokemonId: number, captured: boolean, shiny: boolean, complete: boolean): Promise<void> {
    const pokedex = await prisma.pokedex.findUnique({ where: { slug: pokedexSlug } })
    if (!pokedex) throw new Error('Pokedex not found')

    const pokedexId = pokedex.id

    // upsert by compound unique (pokedexId, pokemonId)
    await prisma.pokedexPokemon.upsert({
      where: { pokedexId_pokemonId: { pokedexId, pokemonId } },
      create: { pokedexId, pokemonId, captured, shiny, complete },
      update: { captured, shiny, complete }
    })
  }
}
