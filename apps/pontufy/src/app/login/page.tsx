import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

// Ecrã de login — shell estático (server) + formulário interativo (client).
// Tokens de design: fundo #0a0a0a, card #141414, bordas #2a2a2a, destaque
// esmeralda #10B981 (ver componentes/auth/LoginForm.tsx).
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <Link href="/" className="mb-10 text-3xl font-black tracking-tight text-white">
        <span className="text-emerald-400">Pontu</span>fy
      </Link>

      <div className="w-full max-w-sm">
        {/* LoginForm usa useSearchParams (callbackUrl/error) — Next 16 exige
            Suspense boundary no cliente (missing-suspense-with-csr-bailout). */}
        <Suspense
          fallback={
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl shadow-black/50">
              <div className="h-6 w-24 bg-[#2a2a2a] rounded mb-2 animate-pulse" />
              <div className="h-4 w-40 bg-[#2a2a2a] rounded mb-6 animate-pulse" />
              <div className="h-11 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg mb-4 animate-pulse" />
              <div className="h-11 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg mb-6 animate-pulse" />
              <div className="h-12 bg-[#2a2a2a] rounded-full animate-pulse" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-5 text-center text-sm text-gray-600">
          Recebeu um convite?{' '}
          <Link
            href="/register"
            className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Criar minha conta
          </Link>
        </p>
      </div>
    </main>
  );
}