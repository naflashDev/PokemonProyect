import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaPokemonRepository } from '../../../../src/infrastructure/repositories/PrismaPokemonRepository'
import { GetPokedexProgress } from '../../../../src/application/use-cases/getPokedexProgress'
import prisma from '../../../../src/prisma/client'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    // Resolve userId from token or, as a fallback, try to fetch session using the incoming cookie
    let userId = token?.sub ? Number((token as any).sub) : undefined
    if (!userId) {
      try {
        const cookieHeader = req.headers.get('cookie') || ''
        const sessionUrl = process.env.NEXTAUTH_URL ? new URL('/api/auth/session', process.env.NEXTAUTH_URL).toString() : undefined
        if (sessionUrl) {
          const sr = await fetch(sessionUrl, { headers: { cookie: cookieHeader } })
          const sj = await sr.json().catch(() => null)
          if (sj?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: sj.user.email } })
            if (dbUser) userId = dbUser.id
          }
        }
      } catch (_) {}
    }

    const repo = new PrismaPokemonRepository()
    const usecase = new GetPokedexProgress(repo)
    const progress = await usecase.execute(slug, userId)

    // debug log to help diagnose why progress may be 0 for a logged user
    try {
      console.log('[API][pokedexes/progress] slug=%s userId=%s -> progress=%o', slug, String(userId), progress)
    } catch (_) {}

    return NextResponse.json({ slug, progress })
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
