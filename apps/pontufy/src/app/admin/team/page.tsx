import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import TeamClient from './TeamClient';

export default async function AdminTeamPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return <TeamClient />;
}