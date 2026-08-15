import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminSkillsClient from './AdminSkillsClient';

// TAREFA 12.5 — Gestão de trilhas de competência e PDIs (admin_rh).
export default async function AdminSkillsPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return <AdminSkillsClient />;
}