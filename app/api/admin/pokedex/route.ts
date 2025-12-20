import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaPokedexRepository } from '../../../../src/infrastructure/repositories/PrismaPokedexRepository'
import { CreatePokedex } from '../../../../src/application/use-cases/createPokedex'

const createSchema = z.object({ slug: z.string().min(1), name: z.string().min(1), game: z.string().optional(), initialPokemonNames: z.array(z.string()).optional() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)
    const repo = new PrismaPokedexRepository()
    const usecase = new CreatePokedex(repo)
    const created = await usecase.execute(parsed)
    // If initial pokemon names provided, attach existing pokemons to this pokedex
    if (parsed.initialPokemonNames && parsed.initialPokemonNames.length > 0) {
      try {
        // use prisma directly for bulk update
        const prisma = (await import('../../../../src/prisma/client')).default
        const p = await prisma.pokedex.findUnique({ where: { slug: parsed.slug } })
        if (p) {
          // For each named pokemon, create a link in PokedexPokemon instead of moving pokedexId.
          const pokemons = await prisma.pokemon.findMany({ where: { name: { in: parsed.initialPokemonNames } } })
          for (const pk of pokemons) {
            const exists = await prisma.pokedexPokemon.findFirst({ where: { pokedexId: p.id, pokemonId: pk.id } })
            if (!exists) {
              await prisma.pokedexPokemon.create({ data: { pokedexId: p.id, pokemonId: pk.id } })
            }
          }
        }
      } catch (e) {
        // non-fatal
        console.warn('Failed to attach initial pokemon names', e)
      }
    }
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

const patchSchema = z.object({ action: z.string(), slug: z.string(), name: z.string().optional(), game: z.string().optional(), pokemonId: z.number().optional(), status: z.string().optional() })
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const repo = new PrismaPokedexRepository()
    if (parsed.action === 'publish') {
      const updated = await repo.publish(parsed.slug)
      return NextResponse.json(updated)
    }

    if (parsed.action === 'update') {
      const updated = await repo.update(parsed.slug, { name: parsed.name, game: parsed.game, status: parsed.status })
      return NextResponse.json(updated)
    }

    if (parsed.action === 'removePokemon') {
      if (!parsed.pokemonId) return NextResponse.json({ error: 'pokemonId required' }, { status: 400 })
      await repo.removePokemon(parsed.slug, parsed.pokemonId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
