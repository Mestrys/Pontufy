'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import MobileTabBar from './MobileTabBar';
import { hasAppShell } from './shell-routes';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!hasAppShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-[calc(72px+env(safe-area-inset-top))] flex-1">
        {/* Transição de página M3 (fade + subida curta), chaveada por rota. CSS
            em vez de framer-motion: useReducedMotion dava um estado no servidor
            e outro no navegador (erro de hidratação com movimento reduzido); o
            globals.css desliga a animação em prefers-reduced-motion. */}
        <main key={pathname} className="min-h-[60vh] animate-[fadeIn_0.28s_var(--ease-standard)]">
          {children}
        </main>
      </div>
      {/* O rodapé jurídico saiu das telas do app (fica no Perfil e no login).
          Espaço para a barra inferior no celular não cobrir o fim da página. */}
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] md:h-0" />
      <MobileTabBar />
    </>
  );
}