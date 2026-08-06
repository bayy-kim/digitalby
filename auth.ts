import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import argon2 from 'argon2'
import { verifyTotpToken } from '@/lib/totp'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'Kode 2FA', type: 'text' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password, totpCode } = parsed.data

        const admin = await prisma.adminUser.findUnique({
          where: { email },
        })

        if (!admin) {
          return null
        }

        // Verify Password with Argon2id
        const passwordMatch = await argon2.verify(admin.passwordHash, password)
        if (!passwordMatch) {
          return null
        }

        // Verify 2FA TOTP Code using AES-256-GCM decrypted secret
        const isTotpValid = verifyTotpToken(totpCode, admin.totpSecret)

        if (!isTotpValid) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          name: 'Admin Bayu Digital Store',
        }
      },
    }),
  ],
  trustHost: true,
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
})
