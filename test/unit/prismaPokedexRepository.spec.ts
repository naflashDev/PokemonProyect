import { describe, it, expect, vi, beforeEach } from 'vitest'

// Provide a mocked prisma client via vi.mock factory (hoisted-safe)
vi.mock('../../src/prisma/client', () => {
  const pokedex = { findUnique: vi.fn(), create: vi.fn() }
  const pokedexPokemon = { deleteMany: vi.fn() }
  return { default: { pokedex, pokedexPokemon } }
})

import prisma from '../../src/prisma/client'
import { PrismaPokedexRepository } from '../../src/infrastructure/repositories/PrismaPokedexRepository'
import { Pokedex } from '../../src/domain/entities/Pokedex'

const mockFindUnique = (prisma as any).pokedex.findUnique as jest.Mock
const mockDeleteMany = (prisma as any).pokedexPokemon.deleteMany as jest.Mock
const mockCreate = (prisma as any).pokedex.create as jest.Mock

describe('PrismaPokedexRepository', () => {
  beforeEach(() => {
    mockFindUnique.mockReset()
    mockDeleteMany.mockReset()
    mockCreate.mockReset()
  })

  it('create calls prisma.pokedex.create and returns Pokedex', async () => {
    mockCreate.mockResolvedValue({ id: 5, slug: 's', name: 'n', game: 'g' })
    const repo = new PrismaPokedexRepository()
    const p = await repo.create(new Pokedex({ slug: 's', name: 'n', game: 'g' }))
    expect(p).toBeInstanceOf(Pokedex)
    expect(p.id).toBe(5)
    expect(mockCreate).toHaveBeenCalled()
  })

  it('removePokemon deletes pokedexPokemon rows when pokedex exists', async () => {
    mockFindUnique.mockResolvedValue({ id: 7 })
    const repo = new PrismaPokedexRepository()
    await repo.removePokemon('some-slug', 42)
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { slug: 'some-slug' } })
    expect(mockDeleteMany).toHaveBeenCalledWith({ where: { pokedexId: 7, pokemonId: 42 } })
  })
})
