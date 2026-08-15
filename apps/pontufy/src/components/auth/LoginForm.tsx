'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';

// Mensagens diferenciadas por origem do erro (nunca expor detalhes internos).
function errorMessage(error: string | null): string | null {
  if (!error) return null;
  switch (error) {
    case 'CredentialsSignin':
    case 'credentials':
    case 'Credentials':
      return 'Email ou senha incorretos. Verifique e tente novamente.';
    case 'Configuration':
      return 'Falha de configuração da autenticação. Contate o administrador.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Erro vindo do fluxo de redirect do NextAuth (ex.: ?error=CredentialsSignin).
  const redirectError = errorMessage(searchParams.get('error'));
  const callbackUrlParam = searchParams.get('callbackUrl');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(errorMessage(res.error));
        return;
      }

      // callbackUrl só é aceito se for um caminho interno (evita open redirect).
      const callbackUrl =
        callbackUrlParam && callbackUrlParam.startsWith('/') && !callbackUrlParam.startsWith('//')
          ? callbackUrlParam
          : '/dashboard';

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const showError = error ?? redirectError;

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl shadow-black/50">
      <h1 className="text-xl font-bold text-white mb-1">Entrar</h1>
      <p className="text-gray-500 text-sm mb-6">Acesse sua conta corporativa</p>

      <form className="space-y-4" onSubmit={handleSubmit} noValidate={false}>
        {showError && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium"
          >
            {showError}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors disabled:opacity-60"
            placeholder="voce@empresa.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors disabled:opacity-60"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-gray-400 transition-colors"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-0.5">
          <Link
            href="/forgot-password"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#141414] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </div>
  );
}