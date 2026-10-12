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