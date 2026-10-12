import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  // A casca (AdminLayout) já vem de app/admin/layout.tsx.
  return <AdminDashboardClient />;
}