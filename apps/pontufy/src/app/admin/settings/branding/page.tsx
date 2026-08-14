import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import BrandingClient from './BrandingClient';

export default async function AdminBrandingPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin_rh') redirect('/dashboard');

  return <BrandingClient />;
}