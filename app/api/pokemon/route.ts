import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaPokemonRepository } from '../../../src/infrastructure/repositories/PrismaPokemonRepository'
import prisma from '../../../src/prisma/client'
import { RegisterPokemon } from '../../../src/application/use-cases/registerPokemon'

const registerSchema = z.object({
  nationalId: z.number().int().positive(),
  name: z.string().min(1),
  types: z.array(z.string()).min(1),
  pokedexSlug: z.string().min(1),
  form: z.string().optional(),
  notes: z.string().optional()
})

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const repo = new PrismaPokemonRepository()
  const urlObj = new URL(req.url)
  const listPublished = urlObj.searchParams.get('listPublished')
  if (listPublished) {
    // return pokemons from all published pokedexes
    const pokedexes = await prisma.pokedex.findMany({ where: { status: 'published' }, include: { pokemons: true } })
    const items = pokedexes.flatMap((p) => p.pokemons.map((pk) => ({ id: pk.id, name: pk.name, nationalId: pk.nationalId, types: pk.types.split(','), imageUrl: pk.imageUrl })))
    return NextResponse.json(items)
  }

  const slug = urlObj.searchParams.get('pokedex') || undefined
  if (!slug) {
    return NextResponse.json({ error: 'pokedex query required' }, { status: 400 })
  }

  const list = await repo.findByPokedexSlug(slug)
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.parse(body)

    const repo = new PrismaPokemonRepository()
    const usecase = new RegisterPokemon(repo)
    const created = await usecase.execute(parsed)

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
