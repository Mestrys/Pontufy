import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AppHeader from '@/components/layout/AppHeader';
import PointsCelebration from '@/components/player/PointsCelebration';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // O middleware já bloqueia, mas defesa em profundidade não faz mal
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.mustChangePassword) redirect('/force-reset-password');

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader userName={session.user.name} role={session.user.role} />
      <main>{children}</main>
      <PointsCelebration />
    </div>
  );
}
