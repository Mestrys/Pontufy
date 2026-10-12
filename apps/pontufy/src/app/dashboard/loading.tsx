import { DashboardSkeleton, LoadingRegion } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <LoadingRegion label="Carregando o início…">
      <DashboardSkeleton />
    </LoadingRegion>
  );
}
