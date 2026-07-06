export const ROLES = ['MASTER_ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  MASTER_ADMIN: 'Super Admin',
  MANAGER: 'Gestor',
  EMPLOYEE: 'Colaborador',
};

/** Studio (geração de cursos e analytics) é vetado a colaboradores comuns. */
export function canAccessStudio(role: Role): boolean {
  return role === 'MANAGER' || role === 'MASTER_ADMIN';
}

/** /superadmin é exclusivo do MASTER_ADMIN — sem exceções. */
export function isMasterAdmin(role: Role): boolean {
  return role === 'MASTER_ADMIN';
}
