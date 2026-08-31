/* eslint-disable @typescript-eslint/no-explicit-any */
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/app/utils/prisma'
import { AuthOptions } from 'next-auth'
import { sendAuthVerificationRequest } from '@/app/utils/authEmail'

const AUTH_FROM =
  process.env.AUTH_FROM_EMAIL ||
  process.env.BILLING_FROM_EMAIL ||
  'Spenpo <billing@spenpo.com>'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: 'email',
      name: 'Email',
      type: 'email' as const,
      from: AUTH_FROM,
      maxAge: 24 * 60 * 60,
      sendVerificationRequest: sendAuthVerificationRequest,
    },
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  callbacks: {
    async signIn() {
      // { user, account, profile, email, credentials }: any
      return true
    },
    async redirect({ url, baseUrl }: any) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, user }: any) {
      // , token
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }
      return newSession
    },
    async jwt({ token }: any) {
      // , user, account, profile, isNewUser
      return token
    },
  },
} as AuthOptions
