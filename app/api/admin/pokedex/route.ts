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

    // prevent duplicate slugs with explicit check to return a friendly error
    const exists = await repo.findBySlug(parsed.slug)
    if (exists) return NextResponse.json({ error: 'slug already exists' }, { status: 409 })

    const usecase = new CreatePokedex(repo)
    let created
    try {
      created = await usecase.execute(parsed)
    } catch (e:any) {
      console.error('create pokedex error', e)
      return NextResponse.json({ error: e?.message || String(e) }, { status: 500 })
    }

    // If initial pokemon names provided, attach existing pokemons to this pokedex
    if (parsed.initialPokemonNames && parsed.initialPokemonNames.length > 0) {
      try {
        const prisma = (await import('../../../../src/prisma/client')).default
        const p = await prisma.pokedex.findUnique({ where: { slug: parsed.slug } })
        if (p) {
          const pokemons = await prisma.pokemon.findMany({ where: { name: { in: parsed.initialPokemonNames } }, select: { id: true } })
          if (pokemons.length > 0) {
            const data = pokemons.map((pk: any) => ({ pokedexId: p.id, pokemonId: pk.id }))
            // skipDuplicates avoids unique constraint failures
            await prisma.pokedexPokemon.createMany({ data, skipDuplicates: true })
          }
        }
      } catch (e) {
        // non-fatal: creation succeeded but initial attach failed
        console.error('attach initial pokemons failed', e)
      }
    }

    return NextResponse.json({ slug: created.slug, id: created.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 400 })
  }
}

const patchSchema = z.object({ action: z.string(), slug: z.string().min(1), name: z.string().optional(), game: z.string().optional(), status: z.string().optional(), pokemonId: z.number().optional() })

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = patchSchema.parse(body)
    const repo = new PrismaPokedexRepository()

    if (parsed.action === 'publish') {
      const p = await repo.publish(parsed.slug)
      return NextResponse.json({ ok: true, slug: p.slug })
    }

    if (parsed.action === 'update') {
      const p = await repo.update(parsed.slug, { name: parsed.name, game: parsed.game, status: parsed.status })
      return NextResponse.json({ ok: true, slug: p.slug })
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

