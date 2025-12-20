import { describe, it, expect, vi } from 'vitest'

class DummyRepo {
  async countTotalByPokedex(slug: string) { return 10 }
}

// Mock the PrismaUserPokemonStatusRepository module BEFORE importing the use-case
vi.mock('../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository', () => ({
  PrismaUserPokemonStatusRepository: class {
    async countCapturedByUserAndPokedex(userId: number, pokedexSlug: string) { return 4 }
  }
}))

import { GetPokedexProgress } from '../../src/application/use-cases/getPokedexProgress'

describe('GetPokedexProgress (unit)', () => {
  it('calculates per-user progress correctly', async () => {
    const repo = new DummyRepo() as any
    const usecase = new GetPokedexProgress(repo)

    const result = await usecase.execute('some-slug', 42)
    expect(result.total).toBe(10)
    expect(result.captured).toBe(4)
    expect(result.percent).toBe(Math.round((4/10)*100))
  })

  it('returns zero captured when no userId provided', async () => {
    const repo = new DummyRepo() as any
    const usecase = new GetPokedexProgress(repo)
    const result = await usecase.execute('some-slug')
    expect(result.total).toBe(10)
    expect(result.captured).toBe(0)
    expect(result.percent).toBe(0)
  })
})
