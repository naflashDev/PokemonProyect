import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"

export class MarkAsCaptured {
  constructor(private repo: IPokemonRepository) {}

  // Marks (or unmarks) a pokemon as captured for a specific pokedex (per-pokedex status)
  async execute(pokemonId: number, pokedexSlug: string, captured: boolean = true, shiny: boolean = false, complete: boolean = false) {
    if (!pokedexSlug) throw new Error('pokedexSlug required')

    // persist per-pokedex status on the join table
    await this.repo.updatePokedexPokemonStatus(pokedexSlug, pokemonId, captured, shiny, complete)

    return { pokemonId, pokedexSlug, captured, shiny, complete }
  }
}
