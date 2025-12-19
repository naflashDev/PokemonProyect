export type PokemonType = 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | string

export interface PokemonProps {
  id?: number
  nationalId: number
  name: string
  types: PokemonType[]
  pokedexSlug: string
  captured?: boolean
  shiny?: boolean
  complete?: boolean
  form?: string | null
  notes?: string | null
  imageUrl?: string | null
}

export class Pokemon {
  readonly id?: number
  readonly nationalId: number
  readonly name: string
  readonly types: PokemonType[]
  readonly pokedexSlug: string
  captured: boolean
  shiny: boolean
  complete: boolean
  form?: string | null
  notes?: string | null
  imageUrl?: string | null

  constructor(props: PokemonProps) {
    this.id = props.id
    this.nationalId = props.nationalId
    this.name = props.name
    this.types = props.types
    this.pokedexSlug = props.pokedexSlug
    this.captured = props.captured ?? false
    this.shiny = props.shiny ?? false
    this.complete = props.complete ?? false
    this.form = props.form ?? null
    this.notes = props.notes ?? null
    this.imageUrl = props.imageUrl ?? null
  }
}
