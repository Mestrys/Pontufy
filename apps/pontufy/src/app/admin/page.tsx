import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';
import AdminLayout from '@/components/layout/AdminLayout';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return (
    <AdminLayout>
      <AdminDashboardClient />
    </AdminLayout>
  );
}