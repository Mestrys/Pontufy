'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const SECTORS = [
  { value: 'tech', label: 'Tecnologia' },
  { value: 'health', label: 'Saúde' },
  { value: 'retail', label: 'Varejo' },
  { value: 'industry', label: 'Indústria' },
] as const;

export default function TenantRegisterPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [sector, setSector] = useState<string>('tech');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/tenants/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          sector,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erro ao criar a empresa.');
      }
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-center">
        <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
        <p className="text-white font-bold mb-2">Empresa criada com sucesso!</p>
        <p className="text-sm text-gray-500 mb-1">
          Seu período de teste de 14 dias já está ativo.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Faça login com o email do administrador para começar.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-3 px-4 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 70%)',
        }}
      />

      <Link href="/" className="mb-8 text-3xl font-black tracking-tight text-white">
        <span className="text-emerald-400">Pontu</span>fy
      </Link>

      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Crie sua conta empresarial</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre sua empresa e comece com 14 dias grátis
          </p>
        </div>

        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Nome da empresa
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: TechCorp LTDA"
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Setor
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
              >
                {SECTORS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Seu nome
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Email corporativo
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Criar senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 pr-11 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Confirmar senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={18} /> Criando empresa...</>
              ) : (
                'Criar minha empresa'
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              Fazer login
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Recebeu um convite da sua empresa?{' '}
            <Link href="/register" className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}