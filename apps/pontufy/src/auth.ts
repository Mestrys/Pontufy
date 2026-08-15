import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/backend/db';
import { authConfig } from '@/auth.config';
import { verifyPassword } from '@/lib/crypto';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    tenantId: string;
    role: string;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// auth.ts — configuração Node.js Runtime (único lugar autorizado a importar
// Prisma e crypto). auth.config.ts permanece Edge-safe (proxy/middleware).
// ═══════════════════════════════════════════════════════════════════════════

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = String(credentials.email).trim().toLowerCase();

          let user = await prisma.user.findUnique({
            where: { email },
          });

          // Fallback case-insensitive: PostgreSQL `=` é case-sensitive e dados
          // legados podem conter emails com maiúsculas.
          if (!user) {
            user = await prisma.user.findFirst({
              where: { email: { equals: email, mode: 'insensitive' } },
            });
          }

          if (!user || !user.passwordHash) {
            console.warn(`[auth] Login recusado: usuário não encontrado (${email}).`);
            return null;
          }

          const isValid = verifyPassword(
            credentials.password as string,
            user.passwordHash,
          );

          if (!isValid) {
            console.warn(`[auth] Login recusado: senha inválida (${email}).`);
            return null;
          }

          // Super admins must originate from the @pontufy.com domain.
          if (user.role === 'super_admin' && !user.email.endsWith('@pontufy.com')) {
            console.warn(`[auth] Login recusado: super_admin fora do domínio @pontufy.com (${email}).`);
            return null;
          }

          console.log(`[auth] Login OK: ${email} (${user.role}).`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            role: user.role,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],
});