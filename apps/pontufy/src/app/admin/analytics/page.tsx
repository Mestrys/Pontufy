import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AnalyticsClient from './AnalyticsClient';

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== 'admin_rh' && session.user.role !== 'super_admin')
  ) {
    redirect('/dashboard');
  }

  return <AnalyticsClient />;
}