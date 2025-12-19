import prisma from "../../prisma/client"
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"
import { Pokemon } from "../../domain/entities/Pokemon"

function mapRowToEntity(row: any): Pokemon {
  return new Pokemon({
    id: row.id,
    nationalId: row.nationalId,
    name: row.name,
    types: row.types.split(','),
    pokedexSlug: row.pokedex.slug,
    captured: row.captured,
    shiny: row.shiny,
    complete: row.complete,
    form: row.form,
    notes: row.notes,
    imageUrl: row.imageUrl ?? null
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
    const rows = await prisma.pokemon.findMany({ where: { pokedex: { slug } }, include: { pokedex: true } })
    return rows.map(mapRowToEntity)
  }

  async countCapturedByPokedex(slug: string): Promise<number> {
    const count = await prisma.pokemon.count({ where: { pokedex: { slug }, captured: true } })
    return count
  }

  async countTotalByPokedex(slug: string): Promise<number> {
    const count = await prisma.pokemon.count({ where: { pokedex: { slug } } })
    return count
  }
}
