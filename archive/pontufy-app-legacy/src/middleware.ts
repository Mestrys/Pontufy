import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/courses',
  '/tracks',
  '/rewards',
  '/studio',
  '/superadmin',
  '/app',
];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;

  const isProtected =
    PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path === '/force-reset-password';

  // 1. Não autenticado em rota protegida → /login (com retorno pós-login)
  if (!session?.user) {
    if (isProtected) {
      const login = new URL('/login', nextUrl);
      login.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const { role, mustChangePassword } = session.user;

  // 2. Reset forçado: nenhuma rota privada é acessível até trocar a senha
  if (mustChangePassword && path !== '/force-reset-password') {
    return NextResponse.redirect(new URL('/force-reset-password', nextUrl));
  }
  if (!mustChangePassword && path === '/force-reset-password') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // 3. RBAC por prefixo
  if ((path === '/superadmin' || path.startsWith('/superadmin/')) && role !== 'MASTER_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard?denied=superadmin', nextUrl));
  }
  if ((path === '/studio' || path.startsWith('/studio/')) && role === 'EMPLOYEE') {
    return NextResponse.redirect(new URL('/dashboard?denied=studio', nextUrl));
  }

  // 4. Autenticado não precisa de /login ou /register
  if (path === '/login' || path === '/register') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Tudo, exceto assets estáticos e as rotas de API (que validam sessão internamente)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
