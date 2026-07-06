import type { Metadata } from 'next';
import AuthProvider from '@/components/providers/AuthProvider';
import ThemeProvider from '@/components/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pontufy — Plataforma de Aprendizado',
  description:
    'Aprenda com trilhas geradas por IA, acumule pontos e troque por recompensas reais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: o next-themes escreve a classe do tema no <html>
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-surface-0 text-ink antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
