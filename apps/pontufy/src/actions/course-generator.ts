'use server';

import { z } from 'zod';
import { generateObject } from 'ai';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';

import { auth } from '@/auth';
import { getTenantDb } from '@/backend/db';
import { rateLimitCheck } from '@/lib/redis';
import { buildProviderChain } from '@/lib/ai-providers';
import { generatedCourseSchema } from '@/schemas/course-schema';
import type { GeneratedCourse } from '@/schemas/course-schema';

export type { GeneratedCourse };

// Wrapper de server action — arquivos "use server" só podem exportar
// funções async definidas no próprio módulo (re-export direto é rejeitado).
import { checkAIProviders as checkAIProvidersImpl } from '@/lib/ai-providers';
export async function checkAIProviders(): Promise<{
  available: string[];
  configured: boolean;
  diagnostics: Record<string, string>;
  chainOrder: string[];
}> {
  return checkAIProvidersImpl();
}

// ├────────────── Configuração do modelo de geração ───────────────────

/**
 * Limite de tokens de saída. Convenção AI SDK v6: `maxOutputTokens`
 * (NUNCA `maxTokens` — removido/quebrado no v6).
 */
const MAX_OUTPUT_TOKENS = Number(process.env.COURSE_MAX_OUTPUT_TOKENS || 8192);

const SYSTEM_PROMPT = `Você é o motor de IA da Pontufy, uma plataforma B2B de educação corporativa gamificada.
Gere um curso de treinamento COMPLETO, prático e adaptado ao setor/vertical informado.

Regras OBRIGATÓRIAS:
1. FOCO SETORIAL — Adapte títulos, exemplos e vocabulário ao setor. Nada genérico.
2. ESTRUTURA — Entregue de 3 a 8 aulas, em ordem didática (do fundamental ao avançado). Use o campo "order" para numerar (1, 2, 3...).
3. CONTEÚDO COMPLETO — Cada aula DEVE ter conteúdo educacional rico e completo:
   - Mínimo de 3 parágrafos substanciais (150+ palavras cada) — o "content" DEVE ter pelo menos 200 caracteres úteis.
   - Explique conceitos-chave de forma clara e detalhada.
   - Inclua exemplos práticos e reais do setor informado.
   - Adicione boas práticas, dicas e alertas importantes.
   - Use formatação Markdown: ## para subtítulos, **negrito** para termos-chave, - para listas.
   - NUNCA use resumos curtos: o conteúdo deve ser completo e autossuficiente.
4. PONTUAÇÃO — "pointsAwarded" é um inteiro entre 10 e 100: aulas introdutórias valem menos, avançadas valem mais.
5. QUIZ — Gere de 2 a 8 perguntas de múltipla escolha cobrindo TODO o conteúdo do curso:
   - Cada pergunta deve ter de 3 a 5 opções ("options") e o índice da correta em "correctIndex" (base 0).
   - Perguntas devem testar compreensão real, não memorização superficial.
   - Varie a dificuldade: fáceis, médias e difíceis.
6. META — Informe "category" (categoria do curso) e "estimatedDurationMinutes" (tempo estimado em minutos).
7. Se material de referência for fornecido, BASEIE o conteúdo nele.
8. Responda exclusivamente no schema estruturado solicitado.`;

// ═══════════════════════ Fallback local determinístico ═══════════════

function generateLocalFallback(prompt: string, sector: string, referenceContent?: string): GeneratedCourse {
  const sectorName = sector || 'geral';
  const topic = prompt.slice(0, 80);

  if (referenceContent && referenceContent.length > 50) {
    const paragraphs = referenceContent
      .split(/\n{2,}|\r\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    const chunks: string[][] = [];
    const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 5));
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      chunks.push(paragraphs.slice(i, i + chunkSize));
    }

    const lessonCount = Math.min(Math.max(3, chunks.length), 6);
    const titles = [
      'Fundamentos e Introdução',
      'Conceitos Principais',
      'Desenvolvimento e Aplicação',
      'Aprofundamento Prático',
      'Estudos de Caso',
      'Avaliação e Consolidação',
    ];

    const lessons = Array.from({ length: lessonCount }, (_, i) => {
      const chunk = chunks[i] || [];
      const chunkText = chunk.length > 0
        ? chunk.join('\n\n')
        : `Conteúdo sobre ${topic} aplicado ao setor de ${sectorName}.`;
      return {
        title: titles[i] || `Módulo ${i + 1}`,
        content: `## ${titles[i] || `Módulo ${i + 1}`}\n\n${chunkText}\n\n**Dica prática:** Aplique estes conceitos no seu dia a dia no setor de ${sectorName} para obter melhores resultados.`,
        pointsAwarded: Math.min(10 + i * 10, 100),
        order: i + 1,
      };
    });

    return {
      title: `Treinamento: ${prompt.slice(0, 60)}`,
      description: `Curso baseado no material de referência fornecido sobre "${prompt.slice(0, 100)}" para o setor de ${sectorName}.`,
      category: sectorName,
      estimatedDurationMinutes: lessons.length * 15,
      lessons,
      quiz: [
        { question: `Qual é o principal objetivo deste treinamento sobre ${topic}?`, options: ['Desenvolvimento de habilidades práticas', 'Apenas teoria sem aplicação', 'Recreação corporativa', 'Redução de custos imediata'], correctIndex: 0 },
        { question: `Em qual setor este treinamento é mais aplicável?`, options: ['Qualquer setor sem distinção', `Setor de ${sectorName}`, 'Apenas setor público', 'Apenas startups'], correctIndex: 1 },
        { question: 'Qual a melhor forma de aplicar o conteúdo aprendido?', options: ['Ignorar até surgir necessidade', 'Aplicar imediatamente na rotina de trabalho', 'Esperar instruções do gestor', 'Estudar mais teoria antes de praticar'], correctIndex: 1 },
      ],
    };
  }

  return {
    title: `Treinamento: ${prompt.slice(0, 60)}`,
    description: `Curso sobre "${prompt.slice(0, 100)}" para o setor de ${sectorName}. Configure uma chave de IA (GEMINI_API_KEY) no Vercel para gerar conteúdo personalizado e inteligente.`,
    category: sectorName,
    estimatedDurationMinutes: 60,
    lessons: [
      {
        title: 'Introdução e Contexto',
        content: `## Introdução ao Treinamento\n\nBem-vindo a este treinamento sobre **${topic}**, desenvolvido especificamente para profissionais do setor de **${sectorName}**. Nesta primeira aula, você vai entender por que este tema é fundamental para o seu desenvolvimento profissional e como ele se aplica ao seu dia a dia.\n\n## Por que este tema é importante?\n\nO mercado atual exige profissionais cada vez mais preparados e atualizados. No setor de ${sectorName}, dominar **${topic}** pode ser o diferencial entre uma carreira estagnada e uma trajetória de crescimento contínuo. Empresas que investem no desenvolvimento de seus colaboradores nesta área observam melhorias significativas em produtividade e qualidade.\n\n## Objetivos do Treinamento\n\nAo longo deste curso, você irá:\n\n- Compreender os **fundamentos essenciais** do tema\n- Conhecer as **melhores práticas** do mercado\n- Aplicar o conhecimento em **situações reais** do seu setor\n- Desenvolver habilidades práticas para o dia a dia\n\n**Dica:** Aproveite cada aula para refletir sobre como aplicar o conteúdo na sua rotina de trabalho.`,
        pointsAwarded: 10,
        order: 1,
      },
      {
        title: 'Conceitos Essenciais e Boas Práticas',
        content: `## Conceitos-Chave\n\nNesta aula, vamos aprofundar nos conceitos fundamentais de **${topic}** que todo profissional do setor de **${sectorName}** precisa dominar. Estes conceitos formam a base para todas as práticas avançadas que veremos adiante.\n\n## Princípios Fundamentais\n\nExistem alguns princípios que guiam as melhores práticas nesta área:\n\n- **Planejamento estratégico**: Antes de qualquer ação, é essencial ter um plano claro com objetivos mensuráveis\n- **Execução disciplinada**: Seguir processos bem definidos garante consistência nos resultados\n- **Melhoria contínua**: Avaliar resultados regularmente e ajustar a abordagem conforme necessário\n- **Colaboração**: Trabalhar em equipe potencializa os resultados individuais\n\n## Boas Práticas do Mercado\n\nProfissionais de destaque no setor de ${sectorName} seguem estas boas práticas:\n\n1. **Documentar processos** — Manter registros claros facilita a replicação de sucessos\n2. **Buscar feedback** — Ouvir colegas e gestores acelera o aprendizado\n3. **Atualizar-se constantemente** — O mercado evolui e quem não acompanha fica para trás\n4. **Compartilhar conhecimento** — Ensinar aos outros consolida o próprio aprendizado\n\n**Importante:** Aplique pelo menos uma destas práticas já na próxima semana de trabalho.`,
        pointsAwarded: 20,
        order: 2,
      },
      {
        title: 'Aplicação Prática e Estudos de Caso',
        content: `## Colocando em Prática\n\nAgora que você domina os conceitos fundamentais, é hora de ver como eles se aplicam em **situações reais** do setor de **${sectorName}**. A prática é o que transforma conhecimento teórico em habilidade profissional.\n\n## Estudo de Caso: Aplicação no Dia a Dia\n\nImagine a seguinte situação no seu ambiente de trabalho: você precisa aplicar os conceitos de **${topic}** para resolver um desafio comum do setor. O primeiro passo é **identificar o problema** com clareza, depois **mapear as opções** disponíveis e, por fim, **implementar a solução** mais adequada ao contexto.\n\nProfissionais que seguem esta abordagem estruturada conseguem resultados até **40% melhores** do que aqueles que agem por impulso.\n\n## Exercício de Reflexão\n\nPense em uma situação recente no seu trabalho onde você poderia ter aplicado estes conceitos:\n\n- Qual era o **desafio** que você enfrentava?\n- Quais **opções** você tinha disponível?\n- O que você faria **diferente** agora com este conhecimento?\n\n## Próximos Passos\n\nDepois de concluir este treinamento:\n\n- **Semana 1**: Identifique uma oportunidade de aplicar o aprendizado\n- **Semana 2**: Implemente a ação e registre os resultados\n- **Semana 3**: Avalie o impacto e compartilhe com sua equipe\n\n**Parabéns!** Você está no caminho certo para se destacar no setor de ${sectorName}.`,
        pointsAwarded: 30,
        order: 3,
      },
      {
        title: 'Avaliação e Próximos Passos',
        content: `## Revisão do Conteúdo\n\nParabéns por chegar à última aula deste treinamento sobre **${topic}**! Vamos revisar os principais pontos abordados e preparar você para continuar se desenvolvendo.\n\n## O que Aprendemos\n\nAo longo deste curso, você:\n\n- Compreendeu a **importância** de ${topic} no setor de ${sectorName}\n- Dominou os **conceitos essenciais** e boas práticas do mercado\n- Viu **exemplos práticos** de aplicação no dia a dia\n- Desenvolveu um **plano de ação** para implementar o aprendizado\n\n## Como Continuar Evoluindo\n\nO aprendizado não termina aqui. Para continuar se desenvolvendo:\n\n- **Pratique regularmente** — A repetição é a mãe do aprendizado\n- **Busque mentoria** — Encontre alguém mais experiente para guiá-lo\n- **Acompanhe tendências** — O setor de ${sectorName} está em constante evolução\n- **Compartilhe** — Ensine o que aprendeu para colegas e equipe\n\n## Certificação\n\nApós concluir todas as aulas e o quiz de avaliação, você poderá baixar seu **certificado de conclusão**. Este certificado valida sua dedicação ao desenvolvimento profissional e pode ser compartilhado com seu gestor.\n\n**Obrigado pela dedicação!** Continue investindo no seu crescimento profissional.`,
        pointsAwarded: 40,
        order: 4,
      },
    ],
    quiz: [
      {
        question: `Qual é o primeiro passo recomendado ao aplicar os conceitos de ${topic} no ambiente de trabalho?`,
        options: [
          'Agir por impulso para ganhar velocidade',
          'Identificar o problema com clareza antes de agir',
          'Esperar que o gestor tome a iniciativa',
          'Delegar a tarefa para outro colega',
        ],
        correctIndex: 1,
      },
      {
        question: 'Qual das seguintes é uma boa prática recomendada neste treinamento?',
        options: [
          'Trabalhar isoladamente para maior foco',
          'Evitar documentar processos para economizar tempo',
          'Buscar feedback de colegas e gestores regularmente',
          'Aplicar o conhecimento apenas quando solicitado',
        ],
        correctIndex: 2,
      },
      {
        question: `Por que a melhoria contínua é importante no setor de ${sectorName}?`,
        options: [
          'Apenas para cumprir exigências da empresa',
          'O mercado evolui e profissionais precisam se atualizar',
          'É uma exigência legal obrigatória',
          'Não é realmente importante',
        ],
        correctIndex: 1,
      },
      {
        question: 'Qual a recomendação para a primeira semana após concluir o treinamento?',
        options: [
          'Esquecer o conteúdo e voltar à rotina normal',
          'Fazer outro treinamento imediatamente',
          'Identificar uma oportunidade de aplicar o aprendizado',
          'Aguardar instruções específicas do RH',
        ],
        correctIndex: 2,
      },
    ],
  };
}

// ═══════════════════════ Geração com fallback ═══════════════════════

async function generateCourseWithFallback(
  prompt: string,
  sector: string,
  referenceContent?: string,
): Promise<{ data: GeneratedCourse; provider: string; errors?: string[] }> {
  const chain = buildProviderChain();

  if (chain.length === 0) {
    console.log('[course-generator] Nenhum provedor configurado, usando template local');
    return { data: generateLocalFallback(prompt, sector, referenceContent), provider: 'local:template' };
  }

  let userPrompt = `Setor/Vertical: ${sector || 'geral'}.
Objetivo do treinamento solicitado pelo RH: ${prompt}`;

  if (referenceContent) {
    userPrompt += `\n\n--- MATERIAL DE REFERÊNCIA FORNECIDO ---\n${referenceContent.slice(0, 30000)}\n--- FIM DO MATERIAL ---\n\nIMPORTANTE: Baseie o conteúdo do curso no material acima. Extraia os tópicos principais, organize-os didaticamente e gere as aulas com base real no conteúdo fornecido.`;
  }

  const errors: string[] = [];
  for (const attempt of chain) {
    try {
      console.log(`[course-generator] Tentando provedor: ${attempt.name}`);
      const { object } = await generateObject({
        model: attempt.build(),
        schema: generatedCourseSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.6,
        maxRetries: 1,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      });
      console.log(`[course-generator] Sucesso com ${attempt.name}`);
      return { data: object, provider: attempt.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[course-generator] Falha em ${attempt.name}:`, msg);
      errors.push(`${attempt.name}: ${msg}`);
    }
  }

  console.warn('[course-generator] Todos os provedores falharam, usando template local:', errors.join(' | '));
  return { data: generateLocalFallback(prompt, sector, referenceContent), provider: 'local:fallback', errors };
}

// ═══════════════════════ Validação de entrada ═══════════════════════

const inputSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Descreva o objetivo do treinamento (mínimo de 10 caracteres).')
    .max(2000),
  sector: z.string().max(60).optional(),
  referenceContent: z.string().max(60000).optional(),
});

export type GenerateTrainingInput = z.infer<typeof inputSchema>;

export interface CoursePayload {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  quizJson: string | null;
  category?: string;
  estimatedDurationMinutes?: number;
  lessons: Array<{
    id: string;
    title: string;
    type: string;
    pointsAssigned: number;
    contentUrl: string | null;
  }>;
}

export type GenerateTrainingResult =
  | {
      success: true;
      courseId: string;
      lessonsCount: number;
      provider: string;
      creditsRemaining: number;
      persisted: boolean;
      course: CoursePayload;
      aiErrors?: string[];
    }
  | { success: false; error: string };

// ═══════════════════════ Motor central (débito atômico) ═════════════

export async function generateTrainingCourse(
  input: GenerateTrainingInput,
): Promise<GenerateTrainingResult> {
  const session = await auth();
  console.log('[course-generator] session:', JSON.stringify({
    hasUser: !!session?.user,
    tenantId: session?.user?.tenantId ?? 'MISSING',
    role: session?.user?.role ?? 'MISSING',
  }));

  if (!session?.user?.tenantId) {
    return { success: false, error: 'Não autenticado.' };
  }
  if (session.user.role !== 'admin_rh') {
    return { success: false, error: `Acesso negado: seu papel é "${session.user.role}", apenas "admin_rh" pode gerar cursos.` };
  }
  const tenantId = session.user.tenantId;

  const MAX_GENERATIONS_PER_DAY = 10;
  const rateLimit = await rateLimitCheck(`ratelimit:generate:${tenantId}`, MAX_GENERATIONS_PER_DAY, 86400);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Limite de ${MAX_GENERATIONS_PER_DAY} gerações por dia atingido. Tente novamente em ${Math.ceil(rateLimit.resetIn / 3600)}h.`,
    };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Entrada inválida.' };
  }

  const db = getTenantDb(tenantId);

  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  console.log('[course-generator] tenant:', JSON.stringify({
    found: !!tenant,
    aiCredits: tenant?.aiCredits ?? 'N/A',
  }));

  if (!tenant) {
    return { success: false, error: 'Tenant não encontrado.' };
  }
  if (tenant.aiCredits < 1) {
    return { success: false, error: `Créditos de IA insuficientes (saldo: ${tenant.aiCredits}).` };
  }

  let generated: { data: GeneratedCourse; provider: string; errors?: string[] };
  try {
    generated = await generateCourseWithFallback(parsed.data.prompt, parsed.data.sector ?? '', parsed.data.referenceContent);
  } catch (err) {
    console.error('[course-generator] geração falhou:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao gerar o curso.',
    };
  }

  const now = new Date();
  // Ordena pelas aulas pela ordem didática definida pelo gerador.
  const orderedLessons = [...generated.data.lessons].sort((a, b) => a.order - b.order);
  const lessonsToCreate = orderedLessons.map((lesson) => ({
    title: lesson.title,
    type: 'text' as const,
    pointsAssigned: Math.max(10, Math.min(100, Math.round(lesson.pointsAwarded))),
    contentUrl: lesson.content,
  }));

  const quizJson = generated.data.quiz && generated.data.quiz.length > 0
    ? JSON.stringify([{
        module: 'Avaliação do Curso',
        questions: generated.data.quiz.map((q) => ({
          question: q.question,
          options: q.options.map((o) => ({ text: o })),
          correctIndex: q.correctIndex,
          explanation: q.explanation,
        })),
      }])
    : null;

  let courseId: string;
  let lessonRecords: Array<{ id: string; title: string; type: string; pointsAssigned: number; contentUrl: string | null }>;
  let creditsRemaining: number;
  let persisted = false;

  try {
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Débito atômico de crédito — instrução única e segura contra race condition.
      // Se a query afetar 0 registos, o tenant não tem crédito → aborta.
      const debit = await tx.tenant.updateMany({
        where: { id: tenantId, aiCredits: { gte: 1 } },
        data: { aiCredits: { decrement: 1 } },
      });
      if (debit.count === 0) {
        throw new Error('INSUFFICIENT_CREDITS');
      }

      const course = await tx.course.create({
        data: {
          tenantId,
          title: generated.data.title,
          description: generated.data.description,
          status: 'published',
          aiCreditsSpent: 1,
          quizJson,
          lessons: { create: lessonsToCreate },
        },
        include: {
          lessons: {
            select: { id: true, title: true, type: true, pointsAssigned: true, contentUrl: true },
          },
        },
      });

      const refreshed = await tx.tenant.findUnique({ where: { id: tenantId } });

      return {
        courseId: course.id as string,
        lessons: course.lessons as Array<{ id: string; title: string; type: string; pointsAssigned: number; contentUrl: string | null }>,
        creditsRemaining: (refreshed?.aiCredits ?? 0) as number,
      };
    });

    courseId = result.courseId;
    lessonRecords = result.lessons;
    creditsRemaining = result.creditsRemaining;
    persisted = true;
    console.log('[course-generator] Curso persistido no DB:', courseId);
  } catch (err) {
    if (err instanceof Error && err.message === 'INSUFFICIENT_CREDITS') {
      return { success: false, error: 'Créditos de IA insuficientes para este tenant (concorrência).' };
    }
    console.error('[course-generator] Persistência falhou, retornando dados gerados:', err);
    courseId = randomUUID();
    lessonRecords = lessonsToCreate.map((l) => ({ ...l, id: randomUUID() }));
    creditsRemaining = Math.max(0, (tenant.aiCredits ?? 1) - 1);
  }

  try {
    revalidatePath('/admin', 'page');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/cursos', 'page');
    revalidatePath('/api/courses', 'page');
  } catch {}

  return {
    success: true,
    courseId,
    lessonsCount: lessonRecords.length,
    provider: generated.provider,
    creditsRemaining,
    persisted,
    aiErrors: generated.errors,
    course: {
      id: courseId,
      title: generated.data.title,
      description: generated.data.description,
      status: 'published',
      createdAt: now.toISOString(),
      quizJson,
      category: generated.data.category,
      estimatedDurationMinutes: generated.data.estimatedDurationMinutes,
      lessons: lessonRecords,
    },
  };
}
