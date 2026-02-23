import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { PrismaUserPokemonStatusRepository } from '../../../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'
import prisma from '../../../../src/prisma/client'

type MarkItem = { pokemonId: number; pokedex: string; captured?: boolean; seen?: boolean; shiny?: boolean; complete?: boolean }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const items = Array.isArray(body?.items) ? (body.items as MarkItem[]) : []
    if (!items.length) return NextResponse.json({ error: 'items required' }, { status: 400 })

    // Try token first
    let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    // fallback: attempt to resolve user id via session endpoint if token missing
    let resolvedUserId: number | undefined
    if (!token) {
      try {
        const cookieHeader = req.headers.get('cookie') || ''
        const sessionUrl = process.env.NEXTAUTH_URL ? new URL('/api/auth/session', process.env.NEXTAUTH_URL).toString() : undefined
        if (sessionUrl) {
          const sr = await fetch(sessionUrl, { headers: { cookie: cookieHeader } })
          const sj = await sr.json().catch(() => null)
          if (sj?.user?.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: sj.user.email } })
            if (dbUser) resolvedUserId = dbUser.id
          }
        }
      } catch (_) {}
    }

    const userId = resolvedUserId ?? (token?.sub ? Number((token as any).sub) : undefined)
    if (!userId) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const repo = new PrismaUserPokemonStatusRepository()

    // apply updates sequentially (keeps logic simple). Use upsertPartial to avoid overwriting unrelated fields.
    const failures: any[] = []
    for (const it of items) {
      try { console.log('[API][pokemon/marks] incoming item', it) } catch (_) {}
      const pid = Number(it.pokemonId)
      if (!pid) continue
      const data: any = {}
      if (typeof it.captured !== 'undefined') data.has = Boolean(it.captured)
      if (typeof it.seen !== 'undefined') data.seen = Boolean(it.seen)
      if (typeof it.shiny !== 'undefined') data.shinyOnly = Boolean(it.shiny)
      if (typeof it.complete !== 'undefined') data.allForms = Boolean(it.complete)

      // resolve pokedex id for this slug so we can store status per-pokedex
      let pokedexId: number | null = null
      try {
        if (it.pokedex) {
          const pd = await prisma.pokedex.findUnique({ where: { slug: it.pokedex } })
          if (pd) pokedexId = pd.id
          try { console.log('[API][pokemon/marks] resolved pokedex', { slug: it.pokedex, pokedexId }) } catch (_) {}
          if (!pd) try { console.warn('[API][pokemon/marks] pokedex slug not found', it.pokedex) } catch (_) {}
        }
      } catch (err) {
        console.error('failed resolving pokedex for item', it, err)
      }

      try {
        await repo.upsertPartial(userId, pid, data, pokedexId)
        try { console.log('[API][pokemon/marks] persisted item', { pokemonId: pid, pokedexId, data }) } catch (_) {}
      } catch (e) {
        console.error('upsertPartial failed for item', it, e)
        failures.push({ item: it, error: String(e) })
      }
    }

    if (failures.length) {
      // Return 500 so client knows persistence failed; include failures for debugging
      return NextResponse.json({ ok: false, failures }, { status: 500 })
    }

    // compute progress per unique pokedex referenced in items
    const pokedexes = Array.from(new Set(items.map(i => i.pokedex).filter(Boolean)))
    const progress: Array<{ pokedex: string; percent: number; captured: number; total: number }> = []
    for (const slug of pokedexes) {
      try {
        const total = await repo.countTotalByPokedex(slug)
        const captured = await repo.countCapturedByUserAndPokedex(userId, slug)
        const percent = total === 0 ? 0 : Math.round((captured / total) * 100)
        progress.push({ pokedex: slug, percent, captured, total })
      } catch (_) {}
    }

    return NextResponse.json({ ok: true, progress })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
