// PaharPahara — NextAuth configuration
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { verifyCredentials } from '@/lib/auth'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/' },
  providers: [
    CredentialsProvider({
      name: 'PaharPahara',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await verifyCredentials(credentials.email, credentials.password)
        if (!user) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          agency: user.agency,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.agency = (user as { agency?: string }).agency ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { role?: string }).role = token.role as string
        ;(session.user as { agency?: string }).agency = (token.agency as string) ?? null
      }
      return session
    },
    async signIn({ user }) {
      // Record an audit log entry on successful sign-in (best-effort, non-blocking)
      try {
        if (user?.id) {
          await db.auditLog.create({
            data: {
              actorId: user.id,
              action: 'user_signin',
              target: user.email,
              detailJson: JSON.stringify({ role: (user as { role: string }).role }),
              ipAddress: null,
            },
          })
        }
      } catch {
        // Never block sign-in on audit failure
      }
      return true
    },
  },
  events: {
    async signOut(message) {
      // Best-effort audit log for sign-out
      try {
        const token = message.token as { id?: string; email?: string; role?: string } | null
        if (token?.id) {
          await db.auditLog.create({
            data: {
              actorId: token.id,
              action: 'user_signout',
              target: token.email ?? null,
              detailJson: JSON.stringify({ role: token.role }),
              ipAddress: null,
            },
          })
        }
      } catch {
        /* ignore */
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'paharpahara-dev-secret-change-in-prod',
}

export type { Session } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      agency: string | null
    }
  }
  interface User {
    role: string
    agency?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    agency?: string | null
  }
}
