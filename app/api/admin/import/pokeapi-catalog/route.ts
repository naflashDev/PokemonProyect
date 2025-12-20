import { NextRequest, NextResponse } from 'next/server'
import { PrismaPokemonRepository } from '../../../../../src/infrastructure/repositories/PrismaPokemonRepository'

// Import all Pokemon into a central 'catalog' pokedex so they can be assigned later
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const concurrency: number = body.concurrency ?? 8
    const pokedexSlug = 'catalog'

    const repo = new PrismaPokemonRepository()

    const listRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')
    if (!listRes.ok) return NextResponse.json({ error: 'Failed to fetch list' }, { status: 502 })
    const listJson = await listRes.json()
    const entries: Array<{ name: string, url: string }> = listJson.results || []

    let idx = 0
    const results: any[] = []

    async function worker() {
      while (idx < entries.length) {
        const i = idx++
        const e = entries[i]
        try {
          const detailRes = await fetch(e.url)
          if (!detailRes.ok) { results.push({ name: e.name, ok: false }); continue }
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
          // use repository to create (it will create the 'catalog' pokedex if missing)
          await repo.create(payload as any)
          results.push({ name: d.name, ok: true })
        } catch (err) {
          results.push({ name: e.name, ok: false })
        }
      }
    }

    const workers = Array.from({ length: concurrency }).map(() => worker())
    await Promise.all(workers)

    return NextResponse.json({ ok: true, imported: results.filter(r => r.ok).length, total: results.length })
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
