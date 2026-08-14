'use client';

import { useState } from 'react';
import { Loader2, Save, Zap } from 'lucide-react';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  aiCredits: number;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
  createdAt: Date;
  _count: { users: number; courses: number };
}

const PLAN_STYLES: Record<string, string> = {
  trial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

function planStyle(plan: string): string {
  return PLAN_STYLES[plan] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

export default function TenantsConsole({ initialTenants }: { initialTenants: TenantRow[] }) {
  const [tenants, setTenants] = useState<TenantRow[]>(initialTenants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSave = async (tenantId: string) => {
    setError('');
    setSavingId(tenantId);
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/credits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiCredits: draft }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTenants((prev) =>
          prev.map((t) =>
            t.id === tenantId ? { ...t, aiCredits: data.tenant.aiCredits } : t,
          ),
        );
        setEditingId(null);
      } else {
        setError(data.error || 'Erro ao ajustar créditos.');
      }
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
      <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
        <Zap size={16} className="text-emerald-400" /> Empresas
      </h2>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-[#2a2a2a]">
              <th className="pb-3 pr-4 font-semibold">Empresa</th>
              <th className="pb-3 pr-4 font-semibold">Plano</th>
              <th className="pb-3 pr-4 font-semibold">Assinatura</th>
              <th className="pb-3 pr-4 font-semibold">Utilizadores</th>
              <th className="pb-3 pr-4 font-semibold">Cursos</th>
              <th className="pb-3 pr-4 font-semibold">Trial até</th>
              <th className="pb-3 font-semibold">Créditos IA</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const isEditing = editingId === tenant.id;
              return (
                <tr key={tenant.id} className="border-b border-[#1f1f1f] last:border-0 align-top">
                  <td className="py-3 pr-4">
                    <p className="text-white font-medium">{tenant.name}</p>
                    <p className="text-xs text-gray-600 font-mono">{tenant.slug}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${planStyle(tenant.plan)}`}
                    >
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-gray-400">{tenant.subscriptionStatus ?? '—'}</td>
                  <td className="py-3 pr-4 text-gray-300">{tenant._count.users}</td>
                  <td className="py-3 pr-4 text-gray-300">{tenant._count.courses}</td>
                  <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                    {tenant.trialEndsAt
                      ? new Date(tenant.trialEndsAt).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td className="py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={draft}
                          onChange={(e) => setDraft(Number.parseInt(e.target.value, 10) || 0)}
                          className="w-24 px-3 py-1.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSave(tenant.id)}
                          disabled={savingId === tenant.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                          {savingId === tenant.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Save size={12} />
                          )}
                          Salvar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(tenant.id);
                          setDraft(tenant.aiCredits);
                        }}
                        className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                      >
                        {tenant.aiCredits}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}