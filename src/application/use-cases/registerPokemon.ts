import { Pokemon } from "../../domain/entities/Pokemon"
import { IPokemonRepository } from "../../domain/repositories/IPokemonRepository"

export type RegisterPokemonDTO = {
  nationalId: number
  name: string
  types: string[]
  pokedexSlug: string
  form?: string | null
  notes?: string | null
}

export class RegisterPokemon {
  constructor(private repo: IPokemonRepository) {}

  async execute(dto: RegisterPokemonDTO): Promise<Pokemon> {
    const pokemon = new Pokemon({
      nationalId: dto.nationalId,
      name: dto.name,
      types: dto.types,
      pokedexSlug: dto.pokedexSlug,
      form: dto.form ?? null,
      notes: dto.notes ?? null
    })

    return this.repo.create(pokemon)
  }
}
