import crypto from 'crypto';
import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/backend/db';
import { authConfig } from '@/auth.config';

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

// Pontufy scrypt specification: `salt:hash` (hex), 16-byte salt, 64-byte key.
// Matches prisma/seed.ts, register, forgot-password and every other hashing path.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error('[Crypto Error]:', err);
    return false;
  }
}

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

          const isValid = await verifyPassword(
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