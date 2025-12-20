import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaUserPokemonStatusRepository } from '../../../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pokemonId, captured, seen, shiny, complete } = body
    if (!pokemonId) return NextResponse.json({ error: 'pokemonId required' }, { status: 400 })

    // require authentication to write per-user statuses
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.sub ? Number((token as any).sub) : undefined
    if (!userId) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const repo = new PrismaUserPokemonStatusRepository()
    const data: any = {}
    if (typeof captured !== 'undefined') data.has = Boolean(captured)
    if (typeof seen !== 'undefined') data.seen = Boolean(seen)
    if (typeof shiny !== 'undefined') data.shinyOnly = Boolean(shiny)
    if (typeof complete !== 'undefined') data.allForms = Boolean(complete)

    const updated = await repo.upsertPartial(userId, Number(pokemonId), data)
    return NextResponse.json(updated)
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
