'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldOff, Loader2, ShieldCheck } from 'lucide-react';

interface BlockedIp {
  ip: string;
  reason: string;
  blockedAt: string;
  expiresAt: string;
}

export default function SecurityIpsConsole() {
  const [ips, setIps] = useState<BlockedIp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnblocking, setIsUnblocking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/superadmin/security/ips');
      const data = await res.json();
      setIps(data.ips ?? []);
    } catch {
      setIps([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (ip: string) => {
    setIsUnblocking(ip);
    try {
      await fetch('/api/superadmin/security/ips', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      await load();
    } finally {
      setIsUnblocking(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  if (ips.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-10 text-center">
        <ShieldCheck size={36} className="text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-bold">Nenhum IP bloqueado</p>
        <p className="text-sm text-gray-500 mt-1">
          O sistema bloqueia automaticamente IPs com atividade suspeita de força bruta.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-[#2a2a2a]">
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Bloqueado em</th>
              <th className="px-4 py-3">Expira</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {ips.map((entry) => (
              <tr key={entry.ip} className="border-b border-[#1f1f1f] last:border-0">
                <td className="px-4 py-3 font-mono text-white">{entry.ip}</td>
                <td className="px-4 py-3 text-gray-400">{entry.reason}</td>
                <td className="px-4 py-3 text-gray-500">
                  {entry.blockedAt ? new Date(entry.blockedAt).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {entry.expiresAt ? new Date(entry.expiresAt).toLocaleString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleUnblock(entry.ip)}
                    disabled={isUnblocking === entry.ip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <ShieldOff size={13} />
                    {isUnblocking === entry.ip ? '...' : 'Desbloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}