import prisma from "../../prisma/client"
import { IPokedexRepository } from "../../domain/repositories/IPokedexRepository"
import { Pokedex } from "../../domain/entities/Pokedex"

export class PrismaPokedexRepository implements IPokedexRepository {
  async create(p: Pokedex): Promise<Pokedex> {
    const row = await prisma.pokedex.create({ data: { slug: p.slug, name: p.name, game: p.game } })
    return new Pokedex({ id: row.id, slug: row.slug, name: row.name, game: row.game ?? undefined })
  }

  async findBySlug(slug: string): Promise<Pokedex | null> {
    const row = await prisma.pokedex.findUnique({ where: { slug } })
    if (!row) return null
    return new Pokedex({ id: row.id, slug: row.slug, name: row.name, game: row.game ?? undefined })
  }

  async publish(slug: string): Promise<Pokedex> {
    const row = await prisma.pokedex.update({ where: { slug }, data: { status: 'published' } })
    return new Pokedex({ id: row.id, slug: row.slug, name: row.name, game: row.game ?? undefined })
  }

  async update(slug: string, data: { name?: string; game?: string; status?: string }): Promise<Pokedex> {
    const row = await prisma.pokedex.update({ where: { slug }, data: { ...(data.name ? { name: data.name } : {}), ...(data.game ? { game: data.game } : {}), ...(data.status ? { status: data.status } : {}) } })
    return new Pokedex({ id: row.id, slug: row.slug, name: row.name, game: row.game ?? undefined })
  }

  async removePokemon(slug: string, pokemonId: number): Promise<void> {
    const pokedex = await prisma.pokedex.findUnique({ where: { slug } })
    if (!pokedex) throw new Error('Pokedex not found')
    await prisma.pokedexPokemon.deleteMany({ where: { pokedexId: pokedex.id, pokemonId } })
  }

  async listPublished(): Promise<Pokedex[]> {
    const rows = await prisma.pokedex.findMany({ where: { status: 'published' } })
    return rows.map((r) => new Pokedex({ id: r.id, slug: r.slug, name: r.name, game: r.game ?? undefined }))
  }
}
