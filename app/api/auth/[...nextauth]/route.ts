import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '../../../../src/prisma/client'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || ''
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // attach role to token from DB user
        token.role = (user as any).role ?? 'USER'
      }
      return token
    },
    async session({ session, token }) {
      // expose role to the client
      (session as any).user = { ...(session as any).user, role: (token as any).role }
      return session
    }
  }
})

export { handler as GET, handler as POST }
