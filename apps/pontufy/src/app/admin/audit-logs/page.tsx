import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AuditLogsClient from './AuditLogsClient';

export default async function AdminAuditLogsPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return <AuditLogsClient />;
}