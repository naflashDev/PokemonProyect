import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaPokemonRepository } from '../../../../src/infrastructure/repositories/PrismaPokemonRepository'
import { AddPokemonToPokedex } from '../../../../src/application/use-cases/addPokemonToPokedex'

const schema = z.object({
  nationalId: z.number().int(),
  name: z.string(),
  types: z.array(z.string()),
  pokedexSlug: z.string(),
  imageUrl: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.parse(body)
    const repo = new PrismaPokemonRepository()
    const usecase = new AddPokemonToPokedex(repo)
    const created = await usecase.execute(parsed)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
