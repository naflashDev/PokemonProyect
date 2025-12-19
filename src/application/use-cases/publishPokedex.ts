import { IPokedexRepository } from "../../domain/repositories/IPokedexRepository"

export class PublishPokedex {
  constructor(private repo: IPokedexRepository) {}

  async execute(slug: string) {
    return this.repo.publish(slug)
  }
}
