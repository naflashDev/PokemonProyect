import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaPokedexRepository } from '../../../../src/infrastructure/repositories/PrismaPokedexRepository'
import { CreatePokedex } from '../../../../src/application/use-cases/createPokedex'

const createSchema = z.object({ slug: z.string().min(1), name: z.string().min(1), game: z.string().optional() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createSchema.parse(body)
    const repo = new PrismaPokedexRepository()
    const usecase = new CreatePokedex(repo)
    const created = await usecase.execute(parsed)
    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

const patchSchema = z.object({ action: z.string(), slug: z.string() })
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = patchSchema.parse(body)
    if (parsed.action === 'publish') {
      const repo = new PrismaPokedexRepository()
      const updated = await repo.publish(parsed.slug)
      return NextResponse.json(updated)
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
