'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { GraduationCap, Loader2, LogIn, AlertTriangle, ArrowLeft } from 'lucide-react';

// A landing page vive no projeto irmão (pontufy.com), fora deste app
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? 'https://pontufy.com';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      setError('E-mail ou senha incorretos.');
      setSubmitting(false);
      return;
    }
    // O middleware cuida do redirect para /force-reset-password se necessário
    const callbackUrl = searchParams.get('callbackUrl');
    router.push(callbackUrl && callbackUrl.startsWith('/') ? callbackUrl : '/dashboard');
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <a
        href={LANDING_URL}
        data-testid="back-to-home"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para a página inicial
      </a>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-edge bg-surface-1">
          <GraduationCap className="h-6 w-6 text-mint" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Entrar no Pontufy</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Sua plataforma de aprendizado e recompensas
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-edge bg-surface-1 p-6"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-ink-muted">
            E-mail corporativo
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com.br"
            className="w-full rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
          />
        </div>

        {error && (
          <p
            data-testid="login-error"
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          data-testid="login-submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-dim">
        Recebeu um código de acesso?{' '}
        <Link href="/register" className="font-medium text-mint hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
