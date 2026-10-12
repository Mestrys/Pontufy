// Rotas sem navbar, rodapé e barra de navegação inferior. O player tem barra
// própria e precisa da altura inteira da tela para a aula e para "Concluir".
export const NO_SHELL_ROUTES = [
  '/player',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/superadmin',
  '/admin',
];

export function hasAppShell(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return !NO_SHELL_ROUTES.some((r) => pathname.startsWith(r));
}

/** Ativo para a rota e para as filhas (/cursos/x ativa "Cursos"). */
export function isRouteActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Classe de distância do rodapé para elementos fixos (toast, avisos): acima da
 * barra de ações do player e da barra de navegação inferior no celular.
 */
export function bottomOffsetClass(pathname: string | null | undefined): string {
  if (pathname?.startsWith('/player')) return 'bottom-24';
  if (hasAppShell(pathname)) return 'bottom-24 md:bottom-4';
  return 'bottom-4';
}
