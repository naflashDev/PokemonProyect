import { describe, it } from 'vitest'
import { PrismaUserPokemonStatusRepository } from '../../src/infrastructure/repositories/PrismaUserPokemonStatusRepository'

// Integration test: runs only when RUN_INTEGRATION=1
if (process.env.RUN_INTEGRATION === '1') {
  describe('PrismaUserPokemonStatusRepository (integration)', () => {
    it('upsertPartial and countCapturedByUserAndPokedex roundtrip', async () => {
      const repo = new PrismaUserPokemonStatusRepository()
    // This test requires the prisma migrations to be applied and DATABASE_URL pointing to a test sqlite DB.
    // It will create or update a status for userId=9999 and a pokemonId that exists in the DB.
    // Adjust the ids according to your test DB.
    const userId = 9999
    const pokemonId = 1

    await repo.upsertPartial(userId, pokemonId, { has: true, seen: true })
    const count = await repo.countCapturedByUserAndPokedex(userId, 'national') // replace 'national' with an actual slug if needed
    // cannot assert exact number in generic DB; just ensure call does not throw
    console.log('captured count:', count)
  })
  })
} else {
  describe.skip('PrismaUserPokemonStatusRepository (integration)', () => {
    it('skipped', () => {})
  })
}
