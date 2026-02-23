import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaPokemonRepository } from '../../../src/infrastructure/repositories/PrismaPokemonRepository'
import prisma from '../../../src/prisma/client'
import { GetPokedexProgress } from '../../../src/application/use-cases/getPokedexProgress'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    // Resolve userId/role from token or fallback to session endpoint using cookies if needed
    let isAdmin = (token as any)?.role === 'ADMIN'
    let fallbackUserId: number | undefined
    if (!token) {
      try {
        const cookieHeader = req.headers.get('cookie') || ''
        const sessionUrl = process.env.NEXTAUTH_URL ? new URL('/api/auth/session', process.env.NEXTAUTH_URL).toString() : undefined
        if (sessionUrl) {
          const sr = await fetch(sessionUrl, { headers: { cookie: cookieHeader } })
          const sj = await sr.json().catch(() => null)
          if (sj?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: sj.user.email } })
            if (dbUser) {
              fallbackUserId = dbUser.id
              isAdmin = dbUser.role === 'ADMIN'
            }
          }
        }
      } catch (_) {}
    }

    // Non-admin users should not see the internal `catalog` pokedex and only see published ones
    const whereClause = isAdmin ? {} : { AND: [{ slug: { not: 'catalog' } }, { status: 'published' }] }

    const pokedexes = await prisma.pokedex.findMany({ where: whereClause, select: { slug: true, name: true }, orderBy: { name: 'asc' } })
    const repo = new PrismaPokemonRepository()
    const usecase = new GetPokedexProgress(repo)

    const userId = token?.sub ? Number((token as any).sub) : fallbackUserId
    const results = await Promise.all(pokedexes.map(async (p) => {
      const progress = await usecase.execute(p.slug, userId)
      return { slug: p.slug, name: p.name, progress }
    }))

    return NextResponse.json(results)
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
