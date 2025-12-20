import { NextRequest, NextResponse } from 'next/server'
import { PrismaPokemonRepository } from '../../../../../src/infrastructure/repositories/PrismaPokemonRepository'

// Protected by middleware (/api/admin/*)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pokedexSlug: string = body.pokedexSlug
    const concurrency: number = body.concurrency ?? 8
    if (!pokedexSlug) return NextResponse.json({ error: 'pokedexSlug required' }, { status: 400 })

    const repo = new PrismaPokemonRepository()

    // fetch list of all pokemon
    const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    if (!listRes.ok) return NextResponse.json({ error: 'Failed to fetch list' }, { status: 502 })
    const listJson = await listRes.json()
    const entries: Array<{ name: string, url: string }> = listJson.results || []

    // process in batches with limited concurrency
    const results: any[] = []
    let idx = 0
    async function worker() {
      while (idx < entries.length) {
        const i = idx++
        const e = entries[i]
        try {
          const detailRes = await fetch(e.url)
          if (!detailRes.ok) continue
          const d = await detailRes.json()
          const image = d.sprites?.other?.['official-artwork']?.front_default || d.sprites?.front_default || null
          const types = (d.types || []).map((t:any) => t.type.name)
          const payload = {
            pokedexSlug,
            nationalId: d.id,
            name: d.name,
            types,
            imageUrl: image
          }
          await repo.create(payload as any)
          results.push({ name: d.name, ok: true })
        } catch (e) {
          results.push({ name: e?.name ?? `idx-${i}`, ok: false })
        }
      }
    }

    const workers = Array.from({ length: concurrency }).map(() => worker())
    await Promise.all(workers)

    return NextResponse.json({ ok: true, imported: results.length })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
