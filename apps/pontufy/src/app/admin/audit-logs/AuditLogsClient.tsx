'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ScrollText, Download, ArrowLeft, Search } from 'lucide-react';

interface AuditLogRow {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  oldValue: unknown;
  newValue: unknown;
}

const ACTION_STYLES: Record<string, string> = {
  BRANDING_UPDATED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  INVITATION_CREATED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  INVITATION_REVOKED: 'bg-red-500/10 text-red-400 border-red-500/20',
  REWARD_REDEEMED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  USER_IMPORT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  TENANT_ONBOARDED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SUBSCRIPTION_ACTIVATED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function actionStyle(action: string): string {
  return ACTION_STYLES[action] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

function shortValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const json = JSON.stringify(value);
  return json.length > 60 ? `${json.slice(0, 60)}…` : json;
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (action) params.set('action', action);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      try {
        const res = await fetch(`/api/admin/audit-logs?${params}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setLogs(data.logs ?? []);
          setTotal(data.total ?? 0);
          setTotalPages(data.totalPages ?? 1);
          setAvailableActions(data.availableActions ?? []);
        } else {
          setError(data.error || 'Erro ao carregar logs.');
        }
      } catch {
        if (!cancelled) setError('Erro ao conectar ao servidor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [page, action, from, to]);

  const handleExport = () => {
    const params = new URLSearchParams({ format: 'csv', limit: '100' });
    if (action) params.set('action', action);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.location.href = `/api/admin/audit-logs?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-2"
            >
              <ArrowLeft size={15} /> Voltar ao painel
            </Link>
            <h1 className="text-2xl font-bold text-white">Trilha de Auditoria</h1>
            <p className="text-sm text-gray-500 mt-1">
              Registro imutável (append-only) das ações administrativas · {total} eventos
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <Download size={15} /> Exportar CSV
          </button>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────── */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Ação
              </label>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              >
                <option value="">Todas</option>
                {availableActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                De
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                Até
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-emerald-500 text-sm transition-colors"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {/* ── Tabela ─────────────────────────────────────────────────── */}
        <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <ScrollText size={16} className="text-emerald-400" /> Eventos
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-gray-600" size={22} />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-600">
              <Search size={22} className="mb-2" />
              <p className="text-sm">Nenhum evento encontrado para os filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-[#2a2a2a]">
                    <th className="pb-3 pr-4 font-semibold">Data</th>
                    <th className="pb-3 pr-4 font-semibold">Ação</th>
                    <th className="pb-3 pr-4 font-semibold">Entidade</th>
                    <th className="pb-3 pr-4 font-semibold">Utilizador</th>
                    <th className="pb-3 pr-4 font-semibold">IP</th>
                    <th className="pb-3 font-semibold">Alteração</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-[#1f1f1f] last:border-0 align-top">
                      <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${actionStyle(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        {log.entity}
                        {log.entityId ? (
                          <span className="block text-xs text-gray-600 font-mono">{log.entityId.slice(0, 12)}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-gray-400">
                        {log.userId ? (
                          <span className="font-mono text-xs">{log.userId.slice(0, 12)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td className="py-3 text-gray-300 max-w-[240px]">
                        <div className="space-y-0.5">
                          {log.oldValue !== null && (
                            <p className="text-xs text-red-400/80 line-clamp-1">{shortValue(log.oldValue)}</p>
                          )}
                          {log.newValue !== null && (
                            <p className="text-xs text-emerald-400/80 line-clamp-1">{shortValue(log.newValue)}</p>
                          )}
                          {log.oldValue === null && log.newValue === null && <span className="text-xs text-gray-600">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-full text-sm font-bold text-white bg-[#1f1f1f] border border-[#2a2a2a] hover:border-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-full text-sm font-bold text-white bg-[#1f1f1f] border border-[#2a2a2a] hover:border-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}