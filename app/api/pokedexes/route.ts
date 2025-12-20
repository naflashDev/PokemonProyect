import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaPokemonRepository } from '../../../src/infrastructure/repositories/PrismaPokemonRepository'
import prisma from '../../../src/prisma/client'
import { GetPokedexProgress } from '../../../src/application/use-cases/getPokedexProgress'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isAdmin = (token as any)?.role === 'ADMIN'

    // Non-admin users should not see the internal `catalog` pokedex and only see published ones
    const whereClause = isAdmin ? {} : { AND: [{ slug: { not: 'catalog' } }, { status: 'published' }] }

    const pokedexes = await prisma.pokedex.findMany({ where: whereClause, select: { slug: true, name: true }, orderBy: { name: 'asc' } })
    const repo = new PrismaPokemonRepository()
    const usecase = new GetPokedexProgress(repo)

    const userId = token?.sub ? Number((token as any).sub) : undefined
    const results = await Promise.all(pokedexes.map(async (p) => {
      const progress = await usecase.execute(p.slug, userId)
      return { slug: p.slug, name: p.name, progress }
    }))

    return NextResponse.json(results)
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
