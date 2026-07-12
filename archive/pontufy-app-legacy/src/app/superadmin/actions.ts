'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { rpc, RpcError } from '@/lib/supabase-rpc';

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function createInviteCode(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== 'MASTER_ADMIN') {
    return { ok: false, message: 'Acesso negado.' };
  }

  const roleType = formData.get('roleType');
  const validityDays = Number(formData.get('validityDays') ?? 30);
  if (roleType !== 'MANAGER' && roleType !== 'EMPLOYEE') {
    return { ok: false, message: 'Perfil inválido — só MANAGER ou EMPLOYEE têm convite.' };
  }
  if (!Number.isFinite(validityDays) || validityDays < 1 || validityDays > 365) {
    return { ok: false, message: 'Validade deve ser entre 1 e 365 dias.' };
  }

  try {
    const created = await rpc<{ code: string }>('admin_create_invite_code', {
      p_actor_id: session.user.id,
      p_role_type: roleType,
      p_validity_days: validityDays,
    });
    revalidatePath('/superadmin');
    return { ok: true, message: `Código gerado: ${created.code}` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof RpcError ? err.message : 'Falha ao gerar o código.',
    };
  }
}
