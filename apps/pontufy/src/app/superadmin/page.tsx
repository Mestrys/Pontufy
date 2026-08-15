import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Building2, ShieldAlert } from 'lucide-react';

export default async function SuperAdminPage() {
  const session = await auth();

  if (
    !session?.user ||
    session.user.role !== 'super_admin' ||
    !session.user.email?.endsWith('@pontufy.com')
  ) {
    redirect('/superadmin/login');
  }

  const cards = [
    {
      href: '/superadmin/tenants',
      icon: Building2,
      title: 'Locatários & Consumo de IA',
      description: 'Governança global de tenants, créditos e planos.',
    },
    {
      href: '/superadmin/security',
      icon: ShieldAlert,
      title: 'IPs Bloqueados',
      description: 'Monitoramento de força bruta e abuso (TAREFA 6.5).',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 text-white px-4">
      <ShieldCheck className="text-emerald-400" size={48} />
      <h1 className="text-2xl font-black">Pontufy Platform Console</h1>
      <p className="text-slate-400 text-sm">
        Bem-vindo, <strong className="text-white">{session.user.email}</strong>
      </p>

      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl mt-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-colors"
          >
            <card.icon size={22} className="text-emerald-400 mb-3" />
            <h2 className="font-bold mb-1 group-hover:text-emerald-400 transition-colors">
              {card.title}
            </h2>
            <p className="text-sm text-slate-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}