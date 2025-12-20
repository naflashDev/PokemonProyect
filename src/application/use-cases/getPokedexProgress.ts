import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"
import { PrismaUserPokemonStatusRepository } from "../../infrastructure/repositories/PrismaUserPokemonStatusRepository"

export type PokedexProgress = {
  total: number
  captured: number
  percent: number
}

export class GetPokedexProgress {
  constructor(private repo: IPokemonRepository) {}

  /**
   * If userId is provided, progress is calculated per-user (using user statuses).
   * Otherwise falls back to repository-level aggregated counts.
   */
  async execute(slug: string, userId?: number): Promise<PokedexProgress> {
    const total = await this.repo.countTotalByPokedex(slug)

    let captured = 0
    // Only compute captured per-user. If no userId provided, do NOT return global counts.
    if (typeof userId === 'number') {
      const userStatusRepo = new PrismaUserPokemonStatusRepository()
      captured = await userStatusRepo.countCapturedByUserAndPokedex(userId, slug)
    } else {
      captured = 0
    }

    const percent = total === 0 ? 0 : Math.round((captured / total) * 100)

    return { total, captured, percent }
  }
}
