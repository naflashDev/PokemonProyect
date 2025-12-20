import { NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const slug = parts[parts.length - 1]
    const row = await prisma.pokedex.findUnique({ where: { slug }, include: { pokedexPokemons: { include: { pokemon: true } } } })
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const pokemons = row.pokedexPokemons.map((pp) => ({ id: pp.pokemon.id, name: pp.pokemon.name, nationalId: pp.pokemon.nationalId, imageUrl: pp.pokemon.imageUrl }))
    return NextResponse.json({ slug: row.slug, name: row.name, game: row.game, status: row.status, pokemons })
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
