import { NextResponse } from 'next/server'
import prisma from '../../../../src/prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const bodySchema = z.object({
  // name is optional; allow empty string and normalize later
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8)
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = bodySchema.parse(json)

    const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await bcrypt.hash(parsed.password, 10)

    // If this is the first user, make them ADMIN
    const usersCount = await prisma.user.count()
    const role = usersCount === 0 ? 'ADMIN' : 'USER'

    const user = await prisma.user.create({
      data: {
        name: parsed.name && String(parsed.name).trim() !== '' ? parsed.name : null,
        email: parsed.email,
        password: hashed,
        role
      }
    })

    // Do not return password
    const { password, ...safe } = user as any
    return NextResponse.json(safe)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 400 })
  }
}
