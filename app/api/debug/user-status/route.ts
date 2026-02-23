import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import prisma from '../../../../src/prisma/client'

// Dev-only endpoint to inspect userPokemonStatus rows for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.sub ? Number((token as any).sub) : undefined
    if (!userId) return NextResponse.json({ error: 'authentication required' }, { status: 401 })

    const rows = await prisma.userPokemonStatus.findMany({ where: { userId }, include: { pokedex: true } })
    return NextResponse.json({ ok: true, rows })
  } catch (e:any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
