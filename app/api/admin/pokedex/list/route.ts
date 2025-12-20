import { NextResponse } from 'next/server'
import prisma from '../../../../../src/prisma/client'

export async function GET() {
  try {
    const rows = await prisma.pokedex.findMany({ select: { id: true, slug: true, name: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
