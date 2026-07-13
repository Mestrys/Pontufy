import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { rpc, type DbUser } from '@/lib/supabase-rpc';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        const user = await rpc<DbUser | null>('auth_login', {
          p_email: email,
          p_password: password,
        });
        return user ?? null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      }
      // update() do cliente NÃO é confiável por si só: recarrega do banco.
      if (trigger === 'update' && token.id) {
        const fresh = await rpc<DbUser | null>('auth_get_user', { p_user_id: token.id });
        if (fresh) {
          token.name = fresh.name;
          token.role = fresh.role;
          token.mustChangePassword = fresh.mustChangePassword;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as DbUser['role'];
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      return session;
    },
  },
});
