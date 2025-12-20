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
    const userId = token?.sub ? Number((token as any).sub) : undefined

    const repo = new PrismaPokemonRepository()
    const usecase = new GetPokedexProgress(repo)
    const progress = await usecase.execute(slug, userId)

    return NextResponse.json({ slug, progress })
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
