import crypto from 'crypto';
import { promisify } from 'util';
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

const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return crypto.timingSafeEqual(derivedKey, Buffer.from(key, 'hex'));
  } catch {
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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isValid) return null;

        // Super admins must originate from the @pontufy.com domain.
        if (user.role === 'super_admin' && !user.email.endsWith('@pontufy.com')) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
});