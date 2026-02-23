import { NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = await params
    const p = await prisma.pokedex.findUnique({ where: { slug }, include: { pokedexPokemons: { include: { pokemon: true } } } })
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const pokemons = (p.pokedexPokemons || []).map((pp: any) => ({ id: pp.pokemon.id, name: pp.pokemon.name, nationalId: pp.pokemon.nationalId }))
    return NextResponse.json({ id: p.id, slug: p.slug, name: p.name, game: p.game, status: p.status, pokemons })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = await params
    const pokedex = await prisma.pokedex.findUnique({ where: { slug } })
    if (!pokedex) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Remove dependent records first to ensure permanent deletion (avoid FK constraint)
    await prisma.$transaction([
      prisma.pokedexPokemon.deleteMany({ where: { pokedexId: pokedex.id } }),
      prisma.pokemon.deleteMany({ where: { pokedexId: pokedex.id } }),
      prisma.pokedex.delete({ where: { id: pokedex.id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
