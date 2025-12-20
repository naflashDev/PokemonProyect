import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaUserPokemonStatusRepository } from '../../../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pokemonId, captured, seen, shiny, complete } = body
    if (!pokemonId) return NextResponse.json({ error: 'pokemonId required' }, { status: 400 })

    // require authentication to write per-user statuses
    // Debug: log incoming cookie header to help diagnose missing token in prod
    try {
      const cookieHeader = req.headers.get('cookie')
      console.log('[API][pokemon/mark] cookie header:', cookieHeader)
    } catch (_) {}

    let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      // try extracting token from cookie header explicitly (helps in some deploy envs)
      try {
        const cookieHeader = req.headers.get('cookie') || undefined
        if (cookieHeader) {
          token = await getToken({ cookie: cookieHeader, secret: process.env.NEXTAUTH_SECRET } as any)
        }
      } catch (err) {
        try { console.log('[API][pokemon/mark] getToken fallback error:', String(err)) } catch (_) {}
      }
    }
    const userId = token?.sub ? Number((token as any).sub) : undefined
    if (!userId) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const repo = new PrismaUserPokemonStatusRepository()
    const data: any = {}
    if (typeof captured !== 'undefined') data.has = Boolean(captured)
    if (typeof seen !== 'undefined') data.seen = Boolean(seen)
    if (typeof shiny !== 'undefined') data.shinyOnly = Boolean(shiny)
    if (typeof complete !== 'undefined') data.allForms = Boolean(complete)

    // debug log: who is updating what
    try {
      console.log('[API][pokemon/mark] userId=%s pokemonId=%s data=%o', String(userId), String(pokemonId), data)
    } catch (_) {}

    const updated = await repo.upsertPartial(userId, Number(pokemonId), data)

    try {
      console.log('[API][pokemon/mark] upsert result=%o', updated)
    } catch (_) {}

    return NextResponse.json(updated)
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
