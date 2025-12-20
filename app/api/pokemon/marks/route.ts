import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import prisma from '../../../../src/prisma/client'

type Item = {
  pokemonId: number
  pokedex: string
  captured?: boolean
  seen?: boolean
  shiny?: boolean
  complete?: boolean
}

async function resolveUserId(req: NextRequest) {
  let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (token) return Number((token as any).sub)

  // fallback: try fetch session using cookie
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    if (cookieHeader) {
      const sessionUrl = process.env.NEXTAUTH_URL ? new URL('/api/auth/session', process.env.NEXTAUTH_URL).toString() : undefined
      if (sessionUrl) {
        const sr = await fetch(sessionUrl, { headers: { cookie: cookieHeader } })
        const sj = await sr.json().catch(() => null)
        if (sj?.user?.email) {
          const dbUser = await prisma.user.findUnique({ where: { email: sj.user.email } })
          if (dbUser) return dbUser.id
        }
      }
    }
  } catch (_) {}
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const items = Array.isArray(body?.items) ? body.items as Item[] : []
    if (!items.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

    const userId = await resolveUserId(req)
    if (!userId) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    // group by pokedex slug to compute progress per pokedex after ops
    const pokedexSet = new Set(items.map(i => i.pokedex))

    // build upsert ops
    const ops: any[] = []
    for (const it of items) {
      if (!it.pokemonId) continue
      const createObj: any = { userId, pokemonId: Number(it.pokemonId), has: Boolean(it.captured ?? false), seen: Boolean(it.seen ?? false), shinyOnly: Boolean(it.shiny ?? false), allForms: Boolean(it.complete ?? false) }
      const updateObj: any = {}
      if (typeof it.captured !== 'undefined') updateObj.has = Boolean(it.captured)
      if (typeof it.seen !== 'undefined') updateObj.seen = Boolean(it.seen)
      if (typeof it.shiny !== 'undefined') updateObj.shinyOnly = Boolean(it.shiny)
      if (typeof it.complete !== 'undefined') updateObj.allForms = Boolean(it.complete)

      ops.push(prisma.userPokemonStatus.upsert({
        where: { userId_pokemonId: { userId, pokemonId: Number(it.pokemonId) } },
        create: createObj,
        update: Object.keys(updateObj).length ? updateObj : createObj
      }))
    }

    // execute in chunks to avoid too large transactions
    const CHUNK = 200
    for (let i = 0; i < ops.length; i += CHUNK) {
      const chunk = ops.slice(i, i + CHUNK)
      if (chunk.length) await prisma.$transaction(chunk)
    }

    // compute progress per pokedex slug
    const progress: Array<{ pokedex: string, percent: number, captured: number, total: number }> = []
    for (const slug of pokedexSet) {
      try {
        const p = await prisma.pokedex.findUnique({ where: { slug }, select: { id: true } })
        if (!p) continue
        const total = await prisma.pokemon.count({ where: { pokedexId: p.id } })
        const captured = await prisma.userPokemonStatus.count({ where: { userId, has: true, pokemon: { pokedexId: p.id } } })
        const percent = total === 0 ? 0 : Math.round((captured / total) * 100)
        progress.push({ pokedex: slug, percent, captured, total })
      } catch (_) {}
    }

    return NextResponse.json({ ok: true, progress })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
