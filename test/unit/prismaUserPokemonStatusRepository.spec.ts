import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma client
vi.mock('../../src/prisma/client', () => {
  const userPokemonStatus = { upsert: vi.fn(), count: vi.fn(), findUnique: vi.fn() }
  return { default: { userPokemonStatus } }
})

import prisma from '../../src/prisma/client'
import { PrismaUserPokemonStatusRepository } from '../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'

const mockUpsert = (prisma as any).userPokemonStatus.upsert as jest.Mock
const mockCount = (prisma as any).userPokemonStatus.count as jest.Mock

describe('PrismaUserPokemonStatusRepository (unit)', () => {
  beforeEach(() => {
    mockUpsert.mockReset()
    mockCount.mockReset()
  })

  it('upsertPartial includes pokedexId in where clause when provided', async () => {
    mockUpsert.mockResolvedValue({ id: 10, userId: 1, pokemonId: 2, has: true, seen: false })
    const repo = new PrismaUserPokemonStatusRepository()
    const res = await repo.upsertPartial(1, 2, { has: true }, 7)

    expect(mockUpsert).toHaveBeenCalled()
    const callArg = mockUpsert.mock.calls[0][0]
    expect(callArg.where).toHaveProperty('userId_pokemonId_pokedexId')
    expect(callArg.where.userId_pokemonId_pokedexId).toEqual({ userId: 1, pokemonId: 2, pokedexId: 7 })
    expect(res).toBeTruthy()
  })

  it('countCapturedByUserAndPokedex uses nested pokemon.pokedexPokemons filter', async () => {
    mockCount.mockResolvedValue(5)
    const repo = new PrismaUserPokemonStatusRepository()
    const count = await repo.countCapturedByUserAndPokedex(42, 'national')
    expect(mockCount).toHaveBeenCalled()
    const callArg = mockCount.mock.calls[0][0]
    expect(callArg.where).toEqual({ userId: 42, has: true, pokemon: { pokedexPokemons: { some: { pokedex: { slug: 'national' } } } } })
    expect(count).toBe(5)
  })
})
