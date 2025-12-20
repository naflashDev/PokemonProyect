import { describe, it, expect, vi } from 'vitest'
import { MarkAsCaptured } from '../../src/application/use-cases/markAsCaptured'

class MockRepo {
  calls: any[] = []
  async updatePokedexPokemonStatus(pokedexSlug: string, pokemonId: number, captured: boolean, shiny: boolean, complete: boolean) {
    this.calls.push({ pokedexSlug, pokemonId, captured, shiny, complete })
  }
}

describe('MarkAsCaptured (unit)', () => {
  it('calls repo.updatePokedexPokemonStatus with correct params', async () => {
    const repo = new MockRepo() as any
    const usecase = new MarkAsCaptured(repo)
    await usecase.execute(1, 'my-pokedex', true, true, false)
    expect(repo.calls.length).toBe(1)
    expect(repo.calls[0]).toEqual({ pokedexSlug: 'my-pokedex', pokemonId: 1, captured: true, shiny: true, complete: false })
  })
})
