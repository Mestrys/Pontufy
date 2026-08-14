'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useUserStore } from '@/store/useUserStore';
import { Loader2, User, Coins, Save, ShieldCheck, Building2 } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const currentUser = useStore((s) => s.currentUser);
  const { currentPoints } = useUserStore();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const roleLabel =
    currentUser?.role === 'admin_rh' ? 'Administrador RH' : 'Colaborador';

  const handleSaveName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setMessage({ type: 'error', text: 'Nome deve ter pelo menos 2 caracteres.' });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar.' });
        return;
      }
      setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 pt-24 bg-[#0a0a0a]">
      <div className="max-w-[720px] mx-auto px-6 md:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">Meu Perfil</h1>
          <p className="text-gray-500 mt-1.5 text-sm">Gerencie suas informações pessoais.</p>
        </header>

        <div className="space-y-6">
          {/* Identity card */}
          <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                {session?.user?.name?.[0]?.toUpperCase() ?? <User size={28} />}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{session?.user?.name}</h2>
                <p className="text-sm text-gray-500 truncate">{session?.user?.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold px-2 py-0.5 rounded-full border bg-white/5 text-gray-300 border-white/10">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  {roleLabel}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Coins size={13} className="text-emerald-400" /> Saldo de Pontos
                </div>
                <div className="text-2xl font-black text-emerald-400">{currentPoints}</div>
              </div>
              <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Building2 size={13} className="text-emerald-400" /> Empresa
                </div>
                <div className="text-sm font-semibold text-white mt-1.5">{session?.user?.tenantId ? 'Conta corporativa' : '—'}</div>
              </div>
            </div>
          </section>

          {/* Edit name */}
          <section className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Editar Nome</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors text-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Salvar
              </button>
            </div>
            {message && (
              <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {message.text}
              </p>
            )}
          </section>

          <div className="text-center">
            <Link href="/wallet" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
              ← Ver histórico de pontos na Carteira
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}