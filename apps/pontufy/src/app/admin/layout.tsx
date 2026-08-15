import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return <AdminLayout>{children}</AdminLayout>;
}