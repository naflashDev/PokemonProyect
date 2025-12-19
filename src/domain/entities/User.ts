export interface UserProps {
  id?: number
  email: string
  name?: string | null
  role?: 'USER' | 'ADMIN'
}

export class User {
  readonly id?: number
  readonly email: string
  name?: string | null
  role: 'USER' | 'ADMIN'

  constructor(props: UserProps) {
    this.id = props.id
    this.email = props.email
    this.name = props.name ?? null
    this.role = props.role ?? 'USER'
  }
}
