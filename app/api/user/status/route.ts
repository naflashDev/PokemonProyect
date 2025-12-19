import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaUserPokemonStatusRepository } from '../../../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'
import { UpdateUserPokemonStatus } from '../../../../src/application/use-cases/updateUserPokemonStatus'
import prisma from '../../../../src/prisma/client'

const schema = z.object({ userEmail: z.string().email(), pokemonId: z.number().int(), has: z.boolean().optional(), shinyOnly: z.boolean().optional(), allForms: z.boolean().optional() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.parse(body)

    // find or create user by email (simplified)
    let user = await prisma.user.findUnique({ where: { email: parsed.userEmail } })
    if (!user) {
      user = await prisma.user.create({ data: { email: parsed.userEmail } })
    }

    const repo = new PrismaUserPokemonStatusRepository()
    const usecase = new UpdateUserPokemonStatus(repo)
    const result = await usecase.execute({ userId: user.id, pokemonId: parsed.pokemonId, has: parsed.has, shinyOnly: parsed.shinyOnly, allForms: parsed.allForms })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
