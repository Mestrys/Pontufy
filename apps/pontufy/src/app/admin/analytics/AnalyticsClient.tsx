'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Download, BarChart3, TrendingUp } from 'lucide-react';
import type { AnalyticsData } from '@/components/admin/analytics/types';
import MetricsCards from '@/components/admin/analytics/MetricsCards';
import TopCoursesTable from '@/components/admin/analytics/TopCoursesTable';

// Recharts é carregado apenas no cliente para evitar hydration mismatch.
const EngagementChart = dynamic(
  () => import('@/components/admin/analytics/EngagementChart'),
  { ssr: false },
);

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[130px] rounded-2xl bg-[#141414] border border-[#2a2a2a] animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-[#141414] border border-[#2a2a2a] animate-pulse" />
    </div>
  );
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/analytics', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setData(json as AnalyticsData);
        } else {
          setError(json.error || 'Erro ao carregar os dados de analytics.');
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="h-6 w-64 bg-[#141414] rounded-lg animate-pulse mb-8" />
          <Skeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-lg text-center max-w-md font-medium">
          {error || 'Dados indisponíveis.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 size={22} className="text-emerald-400" /> Painel de Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Desempenho da equipa, engajamento e consumo de pontos nos últimos 30 dias
            </p>
          </div>

          <a
            href="/api/admin/payroll/export?period=month"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
          >
            <Download size={15} /> Exportar Folha (CSV)
          </a>
        </div>

        <MetricsCards summary={data.summary} />

        <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" /> Engajamento Diário
          </h2>
          <p className="text-xs text-gray-500 mb-4">Conclusões de aulas vs. resgates de benefícios</p>
          <EngagementChart data={data.engagement} />
        </section>

        <section className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4">
            Cursos Mais Concluídos
          </h2>
          <TopCoursesTable courses={data.topCourses} />
        </section>
      </div>
    </div>
  );
}