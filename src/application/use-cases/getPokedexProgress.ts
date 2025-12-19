import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"

export type PokedexProgress = {
  total: number
  captured: number
  percent: number
}

export class GetPokedexProgress {
  constructor(private repo: IPokemonRepository) {}

  async execute(slug: string): Promise<PokedexProgress> {
    const total = await this.repo.countTotalByPokedex(slug)
    const captured = await this.repo.countCapturedByPokedex(slug)
    const percent = total === 0 ? 0 : Math.round((captured / total) * 100)

    return { total, captured, percent }
  }
}
