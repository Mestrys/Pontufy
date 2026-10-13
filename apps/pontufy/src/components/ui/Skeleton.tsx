// MD3 Skeleton Shimmer — superfícies tonais (#f7d0a9/surface-variant em opacity
// baixa sobre dark) com animação de brilho respeitando prefers-reduced-motion.
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-md-surface-container ${
        className ?? ''
      } motion-safe:animate-pulse`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-md-highlight/10 to-transparent skeleton-shimmer" />
    </div>
  );
}

// Card de curso em carregamento (catálogo / dashboard).
export function CourseCardSkeleton() {
  return (
    <div className="bg-md-surface border border-md-outline rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Grade de skeletons para catálogo/recompensas.
export function CatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
// Contêiner de carregamento acessível: o Skeleton é aria-hidden, então quem
// usa leitor de tela ouve "Carregando…" pela região de status.
export function LoadingRegion({ label = 'Carregando…', className = '', children }: { label?: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Lista de linhas (histórico, certificados, notificações).
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-md-surface border border-md-outline rounded-2xl p-4">
          <Skeleton className="size-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Início: destaque + trilhas.
export function DashboardSkeleton() {
  return (
    <div className="pt-6 px-4 sm:px-8 md:px-16 space-y-8">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-7 w-32 rounded-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-11 w-40 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 w-64 flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

// Player: cabeçalho, texto da aula e barra de ações.
export function PlayerSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-md-surface-dim">
      <div className="h-14 border-b border-md-outline px-4 flex items-center gap-4">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex-1 px-6 sm:px-10 py-8 max-w-4xl space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-2/3" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
      <div className="border-t border-md-outline px-4 sm:px-10 py-4 flex gap-3">
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 flex-1 max-w-md" />
      </div>
    </div>
  );
}
