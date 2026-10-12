'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import AISelectionTable from '@/components/admin/AISelectionTable';
import RewardToggleRow from '@/components/admin/RewardToggleRow';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { getCachedCourses, reconcileWithApi } from '@/lib/local-courses';

type AdminView = 'overview' | 'analytics';

export default function AdminDashboardClient() {
  const [tenant, setTenant] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const ts = Date.now();
    Promise.all([
      fetch(`/api/admin/tenant/branding?t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/admin/analytics?t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/courses?limit=50&t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/rewards?limit=50&t=${ts}`, { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([tenantData, analyticsData, coursesData, rewardsData]) => {
        const apiCourses = coursesData.data || [];
        const apiIds = new Set<string>(apiCourses.map((c: any) => c.id as string));
        reconcileWithApi(apiIds);
        const local = getCachedCourses().filter((c) => !apiIds.has(c.id));
        const merged = [...local, ...apiCourses];

        setTenant(tenantData);
        setAnalytics(analyticsData);
        setCourses(
          merged.map((c: any) => ({
            id: c.id,
            title: c.title,
            status: c.status === 'published' ? 'Publicado' : 'Rascunho',
            enrolled: c.enrollmentCount ?? 0,
            date: new Date(c.createdAt).toLocaleDateString('pt-BR'),
          })),
        );
        setRewards(
          (rewardsData.data || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            partner: r.partnerStore || 'Parceiro',
            points: r.pricePoints,
            active: r.isActive,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const summary = analytics?.summary || {};
  const metrics = [
    {
      id: 'm1',
      title: 'Colaboradores Ativos',
      value: String(summary.totalUsers ?? 0),
      trend: `${summary.totalCompletions ?? 0} conclusões`,
      trendType: 'positive' as const,
    },
    {
      id: 'm2',
      title: 'Pontos Distribuídos',
      value: (summary.totalPointsAwarded ?? 0).toLocaleString('pt-BR'),
      trend: 'Total acumulado',
      trendType: 'neutral' as const,
    },
    {
      id: 'm3',
      title: 'Pontos Resgatados',
      value: (summary.totalPointsRedeemed ?? 0).toLocaleString('pt-BR'),
      trend: `${rewards.filter((r) => r.active).length} recompensas ativas`,
      trendType: 'neutral' as const,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-md-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-extrabold text-md-on-surface">Painel do Gestor de RH</h1>
          <p className="text-body-md text-md-on-surface-variant mt-1">
            Bem-vindo ao centro de comando da {tenant?.name || 'empresa'}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="md-btn md-btn-outlined sm:hidden"
          title="Atualizar dados do painel"
        >
          <RefreshCw size={18} /> Atualizar
        </button>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {metrics.map((m) => (
          <MetricCard
            key={m.id}
            title={m.title}
            value={m.value}
            trend={m.trend}
            trendType={m.trendType}
          />
        ))}
      </div>

      {/* Content Sections */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
          <section className="md-card-outlined md-elevation-1 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-md-outline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-md-surface-container-high/50">
              <div className="flex items-center gap-2">
                <span className="text-md-primary" style={{fontSize: '20px'}}>✨</span>
                <h2 className="text-title-lg font-bold text-md-on-surface">Cursos Gerados pela IA</h2>
              </div>
              <a
                href="/admin/wizard"
                className="md-btn md-btn-filled text-sm"
              >
                + Gerar Novo Curso
              </a>
            </div>
            <AISelectionTable courses={courses} />
          </section>

          <section className="md-card-outlined md-elevation-1 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-md-outline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-md-surface-container-high/50">
              <div className="flex items-center gap-2">
                <span style={{fontSize: '20px'}}>🎁</span>
                <h2 className="text-title-lg font-bold text-md-on-surface">Catálogo de Recompensas</h2>
              </div>
            </div>
            <RewardToggleRow catalog={rewards} />
          </section>
        </div>
      )}

      {activeView === 'analytics' && <AnalyticsDashboard />}
    </div>
  );
}