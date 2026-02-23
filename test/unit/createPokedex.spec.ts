import { describe, it, expect } from 'vitest'
import { CreatePokedex } from '../../src/application/use-cases/createPokedex'
import { Pokedex } from '../../src/domain/entities/Pokedex'

class FakeRepo {
  created: any = null
  async create(p: Pokedex) {
    this.created = p
    return new Pokedex({ id: 123, slug: p.slug, name: p.name, game: p.game })
  }
}

describe('CreatePokedex use-case', () => {
  it('calls repository.create and returns created pokedex', async () => {
    const repo = new FakeRepo()
    const uc = new CreatePokedex(repo as any)
    const dto = { slug: 'test-slug', name: 'Test Pokedex', game: 'Test Game' }
    const res = await uc.execute(dto)
    expect(res).toBeInstanceOf(Pokedex)
    expect(res.id).toBe(123)
    expect(repo.created.slug).toBe(dto.slug)
    expect(repo.created.name).toBe(dto.name)
  })
})
