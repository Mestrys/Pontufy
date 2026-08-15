import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionContext } from '@/backend/session';
import { getTenantDb } from '@/backend/db';
import { logAudit, extractRequestMeta } from '@/lib/audit';
import { parseBody } from '@/lib/validations';

// ═══════════════════════════════════════════════════════════════════════════
// TAREFA 12.5 — Gestão de trilhas de competência (admin_rh):
//  • POST /api/admin/skills — cria Skill + SkillNode
//  • GET  /api/admin/skills — árvores com nós (gestão)
//  (PDI: /api/admin/skills/pdi — rota dedicada)
// ═══════════════════════════════════════════════════════════════════════════

const skillSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().max(500).optional(),
  category: z.string().max(40).default('general'),
  targetLevel: z.number().int().min(1).max(5).default(4),
  nodes: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        description: z.string().max(400).optional(),
        x: z.number().int(),
        y: z.number().int(),
        requiredScore: z.number().int().min(50).max(100).default(80),
        courseId: z.string().uuid().nullable().optional(),
        prerequisiteId: z.string().uuid().nullable().optional(),
      }),
    )
    .max(20)
    .default([]),
});

export async function GET() {
  try {
    const { tenantId, role } = await getSessionContext();
    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const db = getTenantDb(tenantId);

    const skills = await db.skill.findMany({
      where: { tenantId },
      include: { nodes: { orderBy: { y: 'asc' } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, skills });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('GET /api/admin/skills:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { tenantId, role, userId } = await getSessionContext();
    if (role !== 'admin_rh') {
      return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    // ── Criação de Skill + nós ──────────────────────────────────────────────
    const raw = await request.json().catch(() => null);
    const { data, error } = parseBody(skillSchema, raw);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const db = getTenantDb(tenantId);
    const existing = await db.skill.findFirst({ where: { tenantId, name: data.name } });
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma competência com este nome.' }, { status: 409 });
    }

    const skill = await db.skill.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        targetLevel: data.targetLevel,
        nodes: {
          create: data.nodes.map((n) => ({
            tenantId,
            title: n.title,
            description: n.description ?? null,
            x: n.x,
            y: n.y,
            requiredScore: n.requiredScore,
            courseId: n.courseId ?? null,
            prerequisiteId: n.prerequisiteId ?? null,
          })),
        },
      },
      include: { nodes: true },
    });

    const meta = extractRequestMeta(request);
    await logAudit({
      tenantId,
      userId,
      action: 'SKILL_CREATED',
      entity: 'Skill',
      entityId: skill.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      newValue: { name: skill.name, nodes: skill.nodes.length },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    if (error instanceof Error && error.message === 'Não autenticado.') {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('POST /api/admin/skills:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}