import { describe, it } from 'vitest'
import { PrismaUserPokemonStatusRepository } from '../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'
import prisma from '../../src/prisma/client'

// Integration test: runs only when RUN_INTEGRATION=1
if (process.env.RUN_INTEGRATION === '1') {
  describe('PrismaUserPokemonStatusRepository (integration)', () => {
    it('upsertPartial and countCapturedByUserAndPokedex roundtrip', async () => {
      const repo = new PrismaUserPokemonStatusRepository()
      // This test will create the minimal fixtures it needs (user, pokedex, pokemon, join)
      const user = await prisma.user.create({ data: {} })
      const pokedex = await prisma.pokedex.create({ data: { slug: 'national', name: 'National' } })
      const pokemon = await prisma.pokemon.create({ data: { nationalId: 1, name: 'Testmon', types: 'normal', pokedexId: pokedex.id } })
      await prisma.pokedexPokemon.create({ data: { pokedexId: pokedex.id, pokemonId: pokemon.id } })

      const userId = user.id
      const pokemonId = pokemon.id

      await repo.upsertPartial(userId, pokemonId, { has: true, seen: true })
      const count = await repo.countCapturedByUserAndPokedex(userId, 'national')
      console.log('captured count:', count)
  })
  })
} else {
  describe.skip('PrismaUserPokemonStatusRepository (integration)', () => {
    it('skipped', () => {})
  })
}
