export type UserPokemonStatusProps = {
  id?: number
  userId: number
  pokemonId: number
  has?: boolean
  shinyOnly?: boolean
  allForms?: boolean
}

export class UserPokemonStatus {
  readonly id?: number
  readonly userId: number
  readonly pokemonId: number
  has: boolean
  shinyOnly: boolean
  allForms: boolean

  constructor(props: UserPokemonStatusProps) {
    this.id = props.id
    this.userId = props.userId
    this.pokemonId = props.pokemonId
    this.has = props.has ?? false
    this.shinyOnly = props.shinyOnly ?? false
    this.allForms = props.allForms ?? false
  }
}
