import { redirect } from 'next/navigation';
import { ShieldCheck, KeyRound, Users } from 'lucide-react';
import { auth } from '@/auth';
import { rpc } from '@/lib/supabase-rpc';
import AppHeader from '@/components/layout/AppHeader';
import InviteCodeForm from './InviteCodeForm';

interface InviteCodeRow {
  code: string;
  role_type: 'MANAGER' | 'EMPLOYEE';
  is_used: boolean;
  used_by_email: string | null;
  expires_at: string;
  created_at: string;
}

interface UserRow {
  name: string;
  email: string;
  role: 'MASTER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  created_at: string;
}

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await auth();
  // Isolamento estrito: apenas MASTER_ADMIN, sem exceções
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'MASTER_ADMIN') redirect('/dashboard?denied=superadmin');
  if (session.user.mustChangePassword) redirect('/force-reset-password');

  const [codes, users] = await Promise.all([
    rpc<InviteCodeRow[]>('admin_list_invite_codes', { p_actor_id: session.user.id }),
    rpc<UserRow[]>('admin_list_users', { p_actor_id: session.user.id }),
  ]);

  return (
    <div className="min-h-screen bg-surface-0">
      <AppHeader userName={session.user.name} role={session.user.role} />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mint">
            <ShieldCheck className="h-3.5 w-3.5" />
            Área restrita · Master Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Configurações da Plataforma
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            Gestão global de acessos e códigos de convite. Gestores e colaboradores não enxergam
            esta área.
          </p>
        </div>

        <section className="rounded-2xl border border-edge bg-surface-1 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <KeyRound className="h-4 w-4 text-mint" />
            Códigos de convite
          </h2>
          <p className="mt-1 text-sm text-ink-faint">
            Gere códigos para onboarding. O perfil do usuário é definido pelo código, nunca pela
            pessoa que se registra.
          </p>

          <div className="mt-5">
            <InviteCodeForm />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs uppercase tracking-wide text-ink-faint">
                  <th className="pb-3 pr-4 font-medium">Código</th>
                  <th className="pb-3 pr-4 font-medium">Perfil</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Expira em</th>
                </tr>
              </thead>
              <tbody data-testid="invite-codes-table">
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-ink-dim">
                      Nenhum código gerado ainda.
                    </td>
                  </tr>
                )}
                {codes.map((row) => (
                  <tr key={row.code} className="border-b border-edge/60 last:border-b-0">
                    <td className="py-3 pr-4">
                      <code className="rounded-lg bg-surface-0 px-2 py-1 text-xs font-semibold tracking-wider text-mint">
                        {row.code}
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {row.role_type === 'MANAGER' ? 'Gestor' : 'Colaborador'}
                    </td>
                    <td className="py-3 pr-4">
                      {row.is_used ? (
                        <span className="text-ink-faint">Usado por {row.used_by_email}</span>
                      ) : new Date(row.expires_at) < new Date() ? (
                        <span className="text-amber-400">Expirado</span>
                      ) : (
                        <span className="font-medium text-mint">Disponível</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-ink-faint">
                      {new Date(row.expires_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-edge bg-surface-1 p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Users className="h-4 w-4 text-mint" />
            Usuários da plataforma ({users.length})
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs uppercase tracking-wide text-ink-faint">
                  <th className="pb-3 pr-4 font-medium">Nome</th>
                  <th className="pb-3 pr-4 font-medium">E-mail</th>
                  <th className="pb-3 pr-4 font-medium">Perfil</th>
                  <th className="pb-3 pr-4 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.email} className="border-b border-edge/60 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-ink">{user.name}</td>
                    <td className="py-3 pr-4 text-ink-muted">{user.email}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === 'MASTER_ADMIN'
                            ? 'bg-mint/15 text-mint'
                            : user.role === 'MANAGER'
                              ? 'bg-sky-500/15 text-sky-400'
                              : 'bg-surface-2 text-ink-muted'
                        }`}
                      >
                        {user.role === 'MASTER_ADMIN'
                          ? 'Super Admin'
                          : user.role === 'MANAGER'
                            ? 'Gestor'
                            : 'Colaborador'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-ink-faint">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
