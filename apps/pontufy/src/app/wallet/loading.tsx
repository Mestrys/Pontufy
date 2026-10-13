import { ListSkeleton, LoadingRegion, Skeleton } from '@/components/ui/Skeleton';

export default function WalletLoading() {
  return (
    <LoadingRegion label="Carregando a carteira…" className="max-w-[1000px] mx-auto px-6 md:px-8 pt-8 pb-20 space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <ListSkeleton rows={5} />
    </LoadingRegion>
  );
}
