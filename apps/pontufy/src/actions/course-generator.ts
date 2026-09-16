'use server';

import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

import { auth } from '@/auth';
import { getTenantDb } from '@/backend/db';
import { rateLimitCheck } from '@/lib/redis';

// ─── Content types ────────────────────────────────────────────────────────────
// Defined in src/lib/course-types.ts (no 'use server') so client components
// can import them without triggering Next.js 'use server' module restrictions.

export type { ContentType } from '@/lib/course-types';
export { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/course-types';
import type { ContentType } from '@/lib/course-types';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '@/lib/course-types';

// ─── Base lesson schema (common to all types) ─────────────────────────────────

const baseLessonSchema = z.object({
  title: z.string().min(3).describe('Título claro e objetivo da aula.'),
  pointsAwarded: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('Pontos inteiros concedidos pela conclusão da aula.'),
});

// ─── Type-specific lesson schemas ─────────────────────────────────────────────

const textLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'Conteúdo educacional COMPLETO em Markdown. ' +
      'Mínimo 3 parágrafos substanciais (150+ palavras cada). ' +
      'Inclua conceitos-chave, exemplos práticos, boas práticas. ' +
      'Use ## para subtítulos, **negrito** para termos, - para listas.',
    ),
});

const videoLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'ROTEIRO DE VÍDEO completo em Markdown. ' +
      'Estruture em cenas: ## Cena 1 — Abertura, ## Cena 2 — Desenvolvimento, etc. ' +
      'Para cada cena inclua: **NARRAÇÃO:** (texto falado), **VISUAL:** (o que aparece na tela), **DURAÇÃO:** (estimativa em segundos). ' +
      'Tom: didático, objetivo. Duração total estimada: 5-10 minutos. ' +
      'Inclua chamada para ação no final.',
    ),
});

const podcastLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'ROTEIRO DE PODCAST em Markdown. ' +
      'Formato: diálogo entre HOST e ESPECIALISTA ou monólogo do HOST. ' +
      'Use **HOST:** e **ESPECIALISTA:** para cada fala. ' +
      'Inclua: ## Abertura (apresentação do tema), ## Desenvolvimento (3-5 blocos temáticos), ## Encerramento (resumo + chamada). ' +
      'Tom: conversacional, envolvente. Duração estimada: 8-15 minutos. ' +
      'Inclua dicas de produção entre colchetes [PAUSA], [TRILHA SONORA], [EFEITO].',
    ),
});

const slidesLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'ESTRUTURA DE APRESENTAÇÃO em Markdown. ' +
      'Cada slide começa com ## Slide N — Título. ' +
      'Para cada slide inclua: **Conteúdo principal** (bullets ou texto curto), **Notas do apresentador** (contexto adicional), **Visual sugerido** (ícone, gráfico ou imagem). ' +
      'Estrutura mínima: Slide 1 (capa), Slides 2-N (conteúdo), Slide final (resumo + próximos passos). ' +
      'Máximo 7 bullets por slide. Linguagem direta e impactante.',
    ),
});

const quizInterativoLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'MÓDULO DE QUIZ INTERATIVO em Markdown. ' +
      'Estruture como: ## Contexto (situação do mundo real) + bloco de perguntas com formato: ' +
      '**Pergunta N:** [enunciado] | A) [opção] B) [opção] C) [opção] D) [opção] | **Resposta:** [letra] | **Explicação:** [por que esta é a correta e as outras erradas]. ' +
      'Inclua pelo menos 5 perguntas com dificuldade progressiva. ' +
      'Varie formatos: múltipla escolha, verdadeiro/falso, situação-problema.',
    ),
});

const escritaExpressaLessonSchema = baseLessonSchema.extend({
  content: z
    .string()
    .min(200)
    .describe(
      'EXERCÍCIO DE ESCRITA EXPRESSA em Markdown. ' +
      'Estruture com: ## Contexto (cenário profissional real), ## Proposta de Escrita (tarefa clara com prazo e formato), ' +
      '## Critérios de Avaliação (rubrica com 4-5 critérios pontuados), ## Exemplo de Resposta Excelente (modelo para referência), ' +
      '## Dicas de Escrita (3-5 dicas práticas específicas para o tema). ' +
      'Tom: desafiador mas encorajador. Foque em habilidades de comunicação profissional.',
    ),
});

// ─── Quiz schema (avaliação final do curso) ───────────────────────────────────

const quizQuestionSchema = z.object({
  question: z.string().min(10).describe('Pergunta clara sobre o conteúdo do curso.'),
  options: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('Opções de resposta. Apenas uma é correta.'),
  correctIndex: z
    .number()
    .int()
    .min(0)
    .describe('Índice (0-based) da opção correta.'),
});

// ─── Course schema factory ────────────────────────────────────────────────────

function buildCourseSchema(contentType: ContentType) {
  const lessonSchema = {
    text: textLessonSchema,
    video: videoLessonSchema,
    podcast: podcastLessonSchema,
    slides: slidesLessonSchema,
    quiz_interativo: quizInterativoLessonSchema,
    escrita_expressa: escritaExpressaLessonSchema,
  }[contentType];

  return z.object({
    courseTitle: z.string().min(3),
    courseDescription: z.string().min(20),
    lessons: z.array(lessonSchema).min(3).max(8),
    quiz: z.array(quizQuestionSchema).min(3).max(8),
  });
}

export type GeneratedCourse = {
  courseTitle: string;
  courseDescription: string;
  lessons: Array<{
    title: string;
    content: string;
    pointsAwarded: number;
  }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
};

// ─── Provider chain ───────────────────────────────────────────────────────────

type ProviderAttempt = { name: string; build: () => LanguageModel };

function buildProviderChain(): ProviderAttempt[] {
  const chain: ProviderAttempt[] = [];

  const googleKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (googleKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const model = process.env.GOOGLE_COURSE_MODEL || 'gemini-2.5-flash-lite';
    chain.push({ name: `google:${model}`, build: () => google(model) });
  }

  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_COURSE_MODEL || 'gpt-4o-mini';
    chain.push({ name: `openai:${model}`, build: () => openai(model) });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_COURSE_MODEL || 'claude-haiku-4-5';
    chain.push({ name: `anthropic:${model}`, build: () => anthropic(model) });
  }

  return chain;
}

// ─── System prompts by content type ──────────────────────────────────────────

const BASE_SYSTEM = `Você é o motor de IA da Pontufy, uma plataforma B2B de educação corporativa gamificada.
Gere um curso de treinamento COMPLETO, prático e adaptado ao setor/vertical informado.

Regras OBRIGATÓRIAS:
1. FOCO SETORIAL — Adapte títulos, exemplos e vocabulário ao setor. Nada genérico.
2. ESTRUTURA — Entregue de 3 a 8 módulos/aulas, em ordem didática (do fundamental ao avançado).
3. PONTUAÇÃO — "pointsAwarded" é um inteiro: módulos introdutórios valem menos, avançados valem mais.
4. QUIZ FINAL — Gere de 3 a 8 perguntas de múltipla escolha cobrindo TODO o conteúdo:
   - Cada pergunta deve ter 4 opções, apenas uma correta.
   - Perguntas devem testar compreensão real, não memorização superficial.
   - Varie a dificuldade: fáceis, médias e difíceis.
5. Se material de referência for fornecido, BASEIE o conteúdo nele.
6. Responda exclusivamente no schema estruturado solicitado.`;

const SYSTEM_PROMPTS: Record<ContentType, string> = {
  text:
    BASE_SYSTEM +
    '\n\nFORMATO: Artigos educacionais em Markdown. Cada aula é um texto completo e rico, mínimo 3 parágrafos substanciais.',

  video:
    BASE_SYSTEM +
    '\n\nFORMATO: Roteiros de vídeo prontos para gravação. Cada aula é um roteiro detalhado com narração, visual e duração por cena. Foque em clareza e impacto visual.',

  podcast:
    BASE_SYSTEM +
    '\n\nFORMATO: Roteiros de podcast profissional. Cada aula é um episódio com diálogos naturais, perguntas provocativas e dicas de produção. Tom conversacional e envolvente.',

  slides:
    BASE_SYSTEM +
    '\n\nFORMATO: Estrutura de apresentações de slides. Cada aula é uma apresentação com conteúdo do slide + notas do apresentador. Linguagem direta, visual sugerido por slide.',

  quiz_interativo:
    BASE_SYSTEM +
    '\n\nFORMATO: Módulos de quiz interativo situacional. Cada aula apresenta um cenário real e 5+ perguntas com explicação detalhada de cada resposta. Foque em aplicação prática.',

  escrita_expressa:
    BASE_SYSTEM +
    '\n\nFORMATO: Exercícios de escrita profissional. Cada aula é um desafio de escrita contextualizado com rubrica de avaliação e exemplo de excelência. Estimule comunicação eficaz.',
};

// ─── DB lesson type mapping ───────────────────────────────────────────────────

function toDbLessonType(contentType: ContentType): string {
  const map: Record<ContentType, string> = {
    text: 'text',
    video: 'video',
    podcast: 'text', // stored as text (script), rendered as audio player when URL present
    slides: 'text',  // stored as text (structure)
    quiz_interativo: 'text',
    escrita_expressa: 'text',
  };
  return map[contentType];
}

// ─── Local fallback generator ─────────────────────────────────────────────────

function generateLocalFallback(
  prompt: string,
  sector: string,
  contentType: ContentType,
  referenceContent?: string,
): GeneratedCourse {
  const sectorName = sector || 'geral';
  const topic = prompt.slice(0, 80);
  const typeLabel = CONTENT_TYPE_LABELS[contentType];

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
        content: `## ${titles[i] || `Módulo ${i + 1}`}\n\n${chunkText}\n\n**Dica prática:** Aplique estes conceitos no seu dia a dia no setor de ${sectorName}.`,
        pointsAwarded: 10 + i * 10,
      };
    });

    return {
      courseTitle: `${typeLabel}: ${prompt.slice(0, 60)}`,
      courseDescription: `Curso baseado no material de referência fornecido sobre "${prompt.slice(0, 100)}" para o setor de ${sectorName}.`,
      lessons,
      quiz: [
        { question: `Qual é o principal objetivo deste treinamento sobre ${topic}?`, options: ['Desenvolvimento de habilidades práticas', 'Apenas teoria sem aplicação', 'Recreação corporativa', 'Redução de custos imediata'], correctIndex: 0 },
        { question: `Em qual setor este treinamento é mais aplicável?`, options: ['Qualquer setor sem distinção', `Setor de ${sectorName}`, 'Apenas setor público', 'Apenas startups'], correctIndex: 1 },
        { question: 'Qual a melhor forma de aplicar o conteúdo aprendido?', options: ['Ignorar até surgir necessidade', 'Aplicar imediatamente na rotina de trabalho', 'Esperar instruções do gestor', 'Estudar mais teoria antes de praticar'], correctIndex: 1 },
      ],
    };
  }

  return {
    courseTitle: `${typeLabel}: ${prompt.slice(0, 60)}`,
    courseDescription: `Curso sobre "${prompt.slice(0, 100)}" (formato: ${typeLabel}) para o setor de ${sectorName}. Configure uma chave de IA (GEMINI_API_KEY) no Vercel para gerar conteúdo personalizado.`,
    lessons: [
      {
        title: 'Introdução e Contexto',
        content: `## Introdução ao Treinamento\n\nBem-vindo a este treinamento sobre **${topic}**, desenvolvido para profissionais do setor de **${sectorName}**. Nesta primeira aula, você vai entender por que este tema é fundamental para o seu desenvolvimento profissional.\n\n## Por que este tema é importante?\n\nNo setor de ${sectorName}, dominar **${topic}** pode ser o diferencial entre uma carreira estagnada e uma trajetória de crescimento. Empresas que investem nessa área observam melhorias em produtividade e qualidade.\n\n## Objetivos do Treinamento\n\nAo longo deste curso, você irá:\n\n- Compreender os **fundamentos essenciais** do tema\n- Conhecer as **melhores práticas** do mercado\n- Aplicar o conhecimento em **situações reais** do seu setor\n\n**Dica:** Aproveite cada aula para refletir sobre como aplicar o conteúdo na sua rotina.`,
        pointsAwarded: 10,
      },
      {
        title: 'Conceitos Essenciais e Boas Práticas',
        content: `## Conceitos-Chave\n\nNesta aula, vamos aprofundar nos conceitos fundamentais de **${topic}** que todo profissional do setor de **${sectorName}** precisa dominar.\n\n## Princípios Fundamentais\n\n- **Planejamento estratégico**: Antes de qualquer ação, tenha um plano claro com objetivos mensuráveis\n- **Execução disciplinada**: Seguir processos bem definidos garante consistência nos resultados\n- **Melhoria contínua**: Avaliar resultados regularmente e ajustar conforme necessário\n- **Colaboração**: Trabalhar em equipe potencializa os resultados individuais\n\n## Boas Práticas do Mercado\n\n1. **Documentar processos** — Manter registros claros facilita a replicação de sucessos\n2. **Buscar feedback** — Ouvir colegas e gestores acelera o aprendizado\n3. **Atualizar-se constantemente** — O mercado evolui e quem não acompanha fica para trás\n\n**Importante:** Aplique pelo menos uma dessas práticas já na próxima semana.`,
        pointsAwarded: 20,
      },
      {
        title: 'Aplicação Prática e Próximos Passos',
        content: `## Colocando em Prática\n\nAgora que você domina os conceitos, veja como eles se aplicam em **situações reais** do setor de **${sectorName}**.\n\n## Estudo de Caso\n\nImagine esta situação: você precisa aplicar os conceitos de **${topic}** para resolver um desafio do setor. O primeiro passo é **identificar o problema** claramente, depois **mapear as opções** e **implementar a solução** mais adequada.\n\nProfissionais que seguem esta abordagem estruturada conseguem resultados até **40% melhores** do que os que agem por impulso.\n\n## Próximos Passos\n\n- **Semana 1**: Identifique uma oportunidade de aplicar o aprendizado\n- **Semana 2**: Implemente a ação e registre os resultados\n- **Semana 3**: Avalie o impacto e compartilhe com sua equipe\n\n**Parabéns!** Você está no caminho certo para se destacar no setor de ${sectorName}.`,
        pointsAwarded: 30,
      },
    ],
    quiz: [
      {
        question: `Qual é o primeiro passo ao aplicar os conceitos de ${topic} no ambiente de trabalho?`,
        options: ['Agir por impulso para ganhar velocidade', 'Identificar o problema com clareza antes de agir', 'Esperar que o gestor tome a iniciativa', 'Delegar a tarefa para outro colega'],
        correctIndex: 1,
      },
      {
        question: 'Qual das seguintes é uma boa prática recomendada neste treinamento?',
        options: ['Trabalhar isoladamente para maior foco', 'Evitar documentar processos para economizar tempo', 'Buscar feedback de colegas e gestores regularmente', 'Aplicar o conhecimento apenas quando solicitado'],
        correctIndex: 2,
      },
      {
        question: `Por que a melhoria contínua é importante no setor de ${sectorName}?`,
        options: ['Apenas para cumprir exigências da empresa', 'O mercado evolui e profissionais precisam se atualizar', 'É uma exigência legal obrigatória', 'Não é realmente importante'],
        correctIndex: 1,
      },
    ],
  };
}

// ─── Core generation with provider fallback ───────────────────────────────────

async function generateCourseWithFallback(
  prompt: string,
  sector: string,
  contentType: ContentType,
  referenceContent?: string,
): Promise<{ data: GeneratedCourse; provider: string; errors?: string[] }> {
  const chain = buildProviderChain();

  if (chain.length === 0) {
    console.log('[course-generator] Nenhum provedor configurado, usando template local');
    return { data: generateLocalFallback(prompt, sector, contentType, referenceContent), provider: 'local:template' };
  }

  let userPrompt = `Setor/Vertical: ${sector || 'geral'}.
Tipo de conteúdo: ${CONTENT_TYPE_LABELS[contentType]}.
Objetivo do treinamento solicitado pelo RH: ${prompt}`;

  if (referenceContent) {
    userPrompt += `\n\n--- MATERIAL DE REFERÊNCIA FORNECIDO ---\n${referenceContent.slice(0, 30000)}\n--- FIM DO MATERIAL ---\n\nIMPORTANTE: Baseie o conteúdo do curso no material acima. Extraia os tópicos principais, organize-os didaticamente e gere as aulas com base real no conteúdo fornecido.`;
  }

  const courseSchema = buildCourseSchema(contentType);
  const systemPrompt = SYSTEM_PROMPTS[contentType];

  const errors: string[] = [];
  for (const attempt of chain) {
    try {
      console.log(`[course-generator] Tentando provedor: ${attempt.name} (tipo: ${contentType})`);
      const { object } = await generateObject({
        model: attempt.build(),
        schema: courseSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.6,
        maxRetries: 1,
      });
      console.log(`[course-generator] Sucesso com ${attempt.name}`);
      return { data: object as GeneratedCourse, provider: attempt.name };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[course-generator] Falha em ${attempt.name}:`, msg);
      errors.push(`${attempt.name}: ${msg}`);
    }
  }

  console.warn('[course-generator] Todos os provedores falharam, usando template local:', errors.join(' | '));
  return { data: generateLocalFallback(prompt, sector, contentType, referenceContent), provider: 'local:fallback', errors };
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export async function checkAIProviders(): Promise<{
  available: string[];
  configured: boolean;
  diagnostics?: Record<string, string>;
}> {
  const available: string[] = [];
  const diagnostics: Record<string, string> = {};

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (geminiKey) {
    available.push('Google Gemini');
    diagnostics.gemini = `Configurado (${geminiKey.slice(0, 6)}...)`;
  } else {
    diagnostics.gemini = 'GEMINI_API_KEY não encontrada no ambiente';
  }

  if (process.env.OPENAI_API_KEY) {
    available.push('OpenAI');
    diagnostics.openai = 'Configurado';
  } else {
    diagnostics.openai = 'Não configurada';
  }

  if (process.env.ANTHROPIC_API_KEY) {
    available.push('Anthropic Claude');
    diagnostics.anthropic = 'Configurado';
  } else {
    diagnostics.anthropic = 'Não configurada';
  }

  return { available, configured: available.length > 0, diagnostics };
}

// ─── Input / output types ─────────────────────────────────────────────────────

const inputSchema = z.object({
  prompt: z
    .string()
    .min(10, 'Descreva o objetivo do treinamento (mínimo de 10 caracteres).')
    .max(2000),
  sector: z.string().max(60).optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
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
  contentType: ContentType;
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

// ─── Main server action ───────────────────────────────────────────────────────

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

  const contentType = parsed.data.contentType ?? 'text';
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
    generated = await generateCourseWithFallback(
      parsed.data.prompt,
      parsed.data.sector ?? '',
      contentType,
      parsed.data.referenceContent,
    );
  } catch (err) {
    console.error('[course-generator] geração falhou:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao gerar o curso.',
    };
  }

  const dbLessonType = toDbLessonType(contentType);
  const now = new Date();
  const lessonsToCreate = generated.data.lessons.map((lesson) => ({
    title: lesson.title,
    type: dbLessonType,
    pointsAssigned: Math.max(1, Math.round(lesson.pointsAwarded)),
    contentUrl: lesson.content,
  }));

  const quizJson = generated.data.quiz && generated.data.quiz.length > 0
    ? JSON.stringify([{
        module: 'Avaliação do Curso',
        questions: generated.data.quiz.map((q) => ({
          question: q.question,
          options: q.options.map((o) => ({ text: o })),
          correctIndex: q.correctIndex,
        })),
      }])
    : null;

  let courseId: string;
  let lessonRecords: Array<{ id: string; title: string; type: string; pointsAssigned: number; contentUrl: string | null }>;
  let creditsRemaining: number;
  let persisted = false;

  try {
    const result = await db.$transaction(async (tx: any) => {
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
          title: generated.data.courseTitle,
          description: generated.data.courseDescription,
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
      return { success: false, error: `Créditos de IA insuficientes (concorrência).` };
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
      title: generated.data.courseTitle,
      description: generated.data.courseDescription,
      status: 'published',
      createdAt: now.toISOString(),
      quizJson,
      contentType,
      lessons: lessonRecords,
    },
  };
}
