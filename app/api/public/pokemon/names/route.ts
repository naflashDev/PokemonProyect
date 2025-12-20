import { NextResponse } from 'next/server'
import prisma from '../../../../src/prisma/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') ?? ''
    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {}
    const rows = await prisma.pokemon.findMany({ where, select: { name: true }, take: 50 })
    return NextResponse.json(rows.map(r => r.name))
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
