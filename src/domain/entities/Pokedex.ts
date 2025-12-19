export interface PokedexProps {
  id?: number
  slug: string
  name: string
  game?: string
}

export class Pokedex {
  readonly id?: number
  readonly slug: string
  readonly name: string
  readonly game?: string

  constructor(props: PokedexProps) {
    this.id = props.id
    this.slug = props.slug
    this.name = props.name
    this.game = props.game
  }
}
