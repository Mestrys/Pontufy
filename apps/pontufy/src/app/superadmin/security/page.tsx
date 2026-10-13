import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import SecurityIpsConsole from './SecurityIpsConsole';

export default async function SuperAdminSecurityPage() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== 'super_admin' ||
    !session.user.email?.endsWith('@pontufy.com')
  ) {
    redirect('/superadmin/login');
  }

  return (
    <div className="min-h-screen bg-md-surface-dim px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/superadmin"
            className="inline-flex items-center min-h-11 gap-1.5 text-sm text-md-on-surface-muted hover:text-md-on-surface transition-colors"
          >
            ← Voltar ao console
          </Link>
          <h1 className="text-2xl font-bold text-md-on-surface-strong">IPs Bloqueados</h1>
          <p className="text-sm text-md-on-surface-muted mt-1">
            Monitoramento de força bruta e abuso · {session.user.email}
          </p>
        </div>

        <SecurityIpsConsole />
      </div>
    </div>
  );
}