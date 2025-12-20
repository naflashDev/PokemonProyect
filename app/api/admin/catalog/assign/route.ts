import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

const bodySchema = (data: any) => ({
  pokemonId: Number(data.pokemonId),
  pokedexSlugs: Array.isArray(data.pokedexSlugs) ? data.pokedexSlugs.map(String) : (data.pokedexSlugs ? [String(data.pokedexSlugs)] : [])
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const { pokemonId, pokedexSlugs } = bodySchema(json)
    if (!pokemonId || !pokedexSlugs || pokedexSlugs.length === 0) return NextResponse.json({ error: 'pokemonId and pokedexSlugs required' }, { status: 400 })

    const catalogPokemon = await prisma.pokemon.findUnique({ where: { id: pokemonId } })
    if (!catalogPokemon) return NextResponse.json({ error: 'catalog pokemon not found' }, { status: 404 })

    const results: any[] = []
    for (const slug of pokedexSlugs) {
      // ensure pokedex exists
      let pokedex = await prisma.pokedex.findUnique({ where: { slug } })
      if (!pokedex) {
        pokedex = await prisma.pokedex.create({ data: { slug, name: slug } })
      }

      // avoid duplicate link
      const existsLink = await prisma.pokedexPokemon.findFirst({ where: { pokedexId: pokedex.id, pokemonId: catalogPokemon.id } })
      if (existsLink) {
        results.push({ slug, ok: false, reason: 'link_exists' })
        continue
      }

      // create link row in PokedexPokemon to associate existing catalog pokemon to target pokedex
      const link = await prisma.pokedexPokemon.create({ data: { pokedexId: pokedex.id, pokemonId: catalogPokemon.id } })
      results.push({ slug, ok: true, linkId: link.id })
    }

    return NextResponse.json({ ok: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
