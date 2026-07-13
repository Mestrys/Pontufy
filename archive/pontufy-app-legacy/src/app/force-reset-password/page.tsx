'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { ShieldAlert, Loader2, KeyRound, AlertTriangle } from 'lucide-react';

export default function ForceResetPasswordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Falha ao alterar a senha.');

      // Re-login com a senha nova: gera um JWT limpo direto do banco,
      // já com mustChangePassword = false (mais confiável que update())
      const email = session?.user?.email;
      if (email) {
        await signIn('credentials', { email, password: newPassword, redirect: false });
      }
      window.location.assign('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar a senha.');
      setSubmitting(false);
    }
  };

  const field = (
    id: string,
    label: string,
    value: string,
    setValue: (v: string) => void
  ) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        type="password"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="••••••••"
        className="w-full rounded-xl border border-edge bg-surface-0 px-4 py-2.5 text-sm text-ink placeholder:text-ink-dim focus:border-mint/50 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
            <ShieldAlert className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Troca de senha obrigatória
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-ink-faint">
              Por segurança, defina uma nova senha antes de acessar a plataforma.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-edge bg-surface-1 p-6"
        >
          {field('current', 'Senha atual', currentPassword, setCurrentPassword)}
          {field('new', 'Nova senha (mín. 8 caracteres)', newPassword, setNewPassword)}
          {field('confirm', 'Confirmar nova senha', confirmPassword, setConfirmPassword)}

          {error && (
            <p
              data-testid="reset-error"
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            data-testid="reset-submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {submitting ? 'Salvando...' : 'Definir nova senha e continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
