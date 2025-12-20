import { NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') ?? ''
    const page = Number(url.searchParams.get('page') ?? '1')
    const perPage = Number(url.searchParams.get('perPage') ?? '25')
    const where: any = {
      OR: [
        { pokedex: { slug: 'catalog' } },
        { pokedexPokemons: { some: { pokedex: { slug: 'catalog' } } } }
      ]
    }
    if (q) where.name = { contains: q }
    const total = await prisma.pokemon.count({ where })
    const rows = await prisma.pokemon.findMany({ where, take: perPage, skip: (page - 1) * perPage, orderBy: { nationalId: 'asc' }, include: { pokedex: true } })
    return NextResponse.json({ items: rows.map(r => ({ id: r.id, name: r.name, nationalId: r.nationalId, imageUrl: r.imageUrl })), total })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
