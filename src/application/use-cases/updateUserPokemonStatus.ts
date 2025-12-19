import { IUserPokemonStatusRepository } from "../../domain/repositories/IUserPokemonStatusRepository"
import { UserPokemonStatus } from "../../domain/entities/UserPokemonStatus"

export type UpdateStatusDTO = {
  userId: number
  pokemonId: number
  has?: boolean
  shinyOnly?: boolean
  allForms?: boolean
}

export class UpdateUserPokemonStatus {
  constructor(private repo: IUserPokemonStatusRepository) {}

  async execute(dto: UpdateStatusDTO): Promise<UserPokemonStatus> {
    const status = new UserPokemonStatus({
      userId: dto.userId,
      pokemonId: dto.pokemonId,
      has: dto.has ?? false,
      shinyOnly: dto.shinyOnly ?? false,
      allForms: dto.allForms ?? false
    })

    return this.repo.upsert(status)
  }
}
