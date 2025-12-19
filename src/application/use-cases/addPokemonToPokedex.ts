import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"
import { Pokemon } from "../../domain/entities/Pokemon"

export type AddPokemonDTO = {
  nationalId: number
  name: string
  types: string[]
  imageUrl?: string | null
  pokedexSlug: string
}

export class AddPokemonToPokedex {
  constructor(private repo: IPokemonRepository) {}

  async execute(dto: AddPokemonDTO): Promise<Pokemon> {
    const p = new Pokemon({
      nationalId: dto.nationalId,
      name: dto.name,
      types: dto.types,
      pokedexSlug: dto.pokedexSlug,
      form: null,
      notes: null
    })

    // attach imageUrl via notes temporarily (or repo supports image)
    ;(p as any).imageUrl = dto.imageUrl ?? null

    return this.repo.create(p)
  }
}
