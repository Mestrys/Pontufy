'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { GraduationCap, Loader2, UserPlus, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';

// A landing page vive no projeto irmão (pontufy.com), fora deste app
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? 'https://pontufy.com';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao criar a conta.');

      // Conta criada — autentica direto e segue para o dashboard
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) throw new Error('Conta criada, mas o login falhou. Entre manualmente.');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar a conta.');
      setSubmitting(false);
    }
  };

  const field = (
    id: string,
    label: string,
    type: string,
    value: string,
    setValue: (v: string) => void,
    placeholder: string,
    autoComplete?: string
  ) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4 py-10">
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
            <h1 className="text-xl font-semibold tracking-tight text-ink">Criar conta</h1>
            <p className="mt-1 text-sm text-ink-faint">
              O acesso ao Pontufy é por convite da sua empresa
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-edge bg-surface-1 p-6"
        >
          <div className="rounded-xl border border-mint/20 bg-mint/5 p-4">
            <label
              htmlFor="inviteCode"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-mint"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Código de acesso
            </label>
            <input
              id="inviteCode"
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="PNTF-XXXX-XXXX"
              className="w-full rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm font-semibold tracking-wider text-ink placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
              Fornecido pelo RH ou gestor. Define seu perfil de acesso.
            </p>
          </div>

          {field('name', 'Nome completo', 'text', name, setName, 'Maria da Silva', 'name')}
          {field('email', 'E-mail corporativo', 'email', email, setEmail, 'voce@empresa.com.br', 'email')}
          {field('password', 'Senha (mín. 8 caracteres)', 'password', password, setPassword, '••••••••', 'new-password')}

          {error && (
            <p
              data-testid="register-error"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-testid="register-submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-dim">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-mint hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
