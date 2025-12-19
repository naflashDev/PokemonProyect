import { IPokedexRepository } from "../../domain/repositories/IPokedexRepository"
import { Pokedex } from "../../domain/entities/Pokedex"

export type CreatePokedexDTO = {
  slug: string
  name: string
  game?: string
}

export class CreatePokedex {
  constructor(private repo: IPokedexRepository) {}

  async execute(dto: CreatePokedexDTO): Promise<Pokedex> {
    const p = new Pokedex({ slug: dto.slug, name: dto.name, game: dto.game })
    return this.repo.create(p)
  }
}
