import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '../prisma/client'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString() ?? ''
        const password = credentials?.password?.toString() ?? ''
        if (!email || !password) return null

        console.log('[Auth] authorize attempt for', email)
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.password) {
          console.log('[Auth] user not found or no password for', email)
          return null
        }

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) {
          console.log('[Auth] invalid password for', email)
          return null
        }

        const { password: _p, ...userSafe } = user as any
        console.log('[Auth] authorize success for', email, 'id=', user.id)
        return userSafe
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt'
  },
  // Explicit cookie settings for development to ensure cookie is set on localhost
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  events: {
    async signIn(message: any) {
      console.log('[Auth][event][signIn]', message)
    },
    async createUser(message: any) {
      console.log('[Auth][event][createUser]', message)
    }
  },
  callbacks: {
    async jwt({ token, user }: any) {
      console.log('[Auth][jwt] token before:', { token, user: !!user })
      if (user) token.role = (user as any).role ?? 'USER'

      if (!token.role && token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: Number(token.sub) } })
          token.role = dbUser?.role ?? 'USER'
        } catch (e) {
          token.role = 'USER'
        }
      }

      console.log('[Auth][jwt] token after:', token)
      return token
    },
    async session({ session, token }: any) {
      console.log('[Auth][session] session before:', { session, token })
      const role = token?.role ?? 'USER'
      const out = { ...(session ?? {}), user: { ...(session?.user ?? {}), role } }
      console.log('[Auth][session] session after:', out)
      return out
    }
  }
}

export default authOptions
