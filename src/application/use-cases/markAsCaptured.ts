import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"

export class MarkAsCaptured {
  constructor(private repo: IPokemonRepository) {}

  async execute(pokemonId: number, shiny: boolean = false, complete: boolean = false) {
    const p = await this.repo.findById(pokemonId)
    if (!p) throw new Error('Pokemon not found')

    p.captured = true
    p.shiny = shiny
    p.complete = complete

    return this.repo.update(p)
  }
}
