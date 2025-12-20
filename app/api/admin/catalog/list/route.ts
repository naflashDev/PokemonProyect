import { NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') ?? ''
    const page = Number(url.searchParams.get('page') ?? '1')
    const perPage = Number(url.searchParams.get('perPage') ?? '50')
    const where: any = { pokedex: { slug: 'catalog' } }
    if (q) where.name = { contains: q, mode: 'insensitive' }

    const total = await prisma.pokemon.count({ where })
    const rows = await prisma.pokemon.findMany({ where, take: perPage, skip: (page - 1) * perPage, orderBy: { nationalId: 'asc' } })
    return NextResponse.json({ items: rows.map(r => ({ id: r.id, name: r.name, nationalId: r.nationalId, imageUrl: r.imageUrl })), total })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
