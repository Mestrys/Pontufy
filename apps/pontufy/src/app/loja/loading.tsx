import { Skeleton, CatalogSkeleton } from '@/components/ui/Skeleton';

export default function LojaLoading() {
  return (
    <div className="min-h-screen pb-20 pt-8 bg-md-surface-dim" aria-busy="true">
      <span className="sr-only">Carregando benefícios…</span>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-16">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-28 rounded-full" />
          ))}
        </div>
        <CatalogSkeleton count={8} />
      </div>
    </div>
  );
}
