import { z } from 'zod';
import { generateObject } from 'ai';
import { getTenantDb } from '@/backend/db';
import { buildProviderChain } from '@/lib/ai-providers';

// ═══════════════════════════════════════════════════════════════════════════
// TAREFA 13 — Batalhas de Conhecimento
//  • 13.1: 5 perguntas geradas por IA sobre a trilha da empresa (fallback
//    determinístico local se nenhum provedor estiver configurado).
//  • 13.4: cronômetro estrito de 15s POR QUESTÃO — o servidor re-scora as
//    respostas e rejeita turnos cujo tempo exceda 5×15s (tolerância de
//    rede 5s/questão). Perda de foco é reportada pelo cliente e anula o turno.
// ═══════════════════════════════════════════════════════════════════════════

export const BATTLE_QUESTIONS = 5;
export const QUESTION_TIME_LIMIT_SECONDS = 15;
// Tolerância total para latência de rede/UI (5s extras por questão).
export const TURN_TIME_LIMIT_SECONDS = BATTLE_QUESTIONS * (QUESTION_TIME_LIMIT_SECONDS + 5);
export const BATTLE_TTL_HOURS = 72;

const battleQuestionSchema = z.object({
  question: z.string().min(10),
  options: z.array(z.string().min(1)).min(3).max(5),
  correctIndex: z.number().int().min(0).max(4),
});

export const battleSchema = z.object({
  questions: z.array(battleQuestionSchema).length(BATTLE_QUESTIONS),
});

export type BattleQuestion = z.infer<typeof battleQuestionSchema>;

// ── Geração de questões (IA com fallback local) ────────────────────────────

function localFallbackQuestions(topic: string): BattleQuestion[] {
  const base = [
    {
      question: `Qual é o principal objetivo dos treinamentos de ${topic} na nossa empresa?`,
      options: ['Aplicar o conteúdo no dia a dia de trabalho', 'Cumprir carga horária obrigatória', 'Apenas ganhar pontos', 'Preencher relatórios do RH'],
      correctIndex: 0,
    },
    {
      question: 'Como a Pontufy recompensa a conclusão de aulas?',
      options: ['Com pontos convertíveis em benefícios', 'Com folga remunerada', 'Com aumento salarial automático', 'Com certificado físico'],
      correctIndex: 0,
    },
    {
      question: 'O que acontece com um quiz aprovado abaixo de 70%?',
      options: ['Você pode refazer até passar', 'O curso é bloqueado permanentemente', 'Seus pontos são cancelados', 'Nada, a nota é ignorada'],
      correctIndex: 0,
    },
    {
      question: 'Qual o prazo de validade dos pontos ganhos?',
      options: ['Verifique as regras da sua empresa na Carteira', 'Eles expiram em 24 horas', 'Nunca expiram', 'Expiração apenas em viagem'],
      correctIndex: 0,
    },
    {
      question: 'Onde você consulta o histórico completo de pontos?',
      options: ['Na seção Carteira', 'No menu de configurações', 'No certificado do curso', 'No perfil do líder'],
      correctIndex: 0,
    },
  ];
  return base.slice(0, BATTLE_QUESTIONS);
}

export async function generateBattleQuestions(
  tenantId: string,
  topics: string[],
): Promise<BattleQuestion[]> {
  const chain = buildProviderChain();
  const topicText = topics.length > 0 ? topics.slice(0, 8).join(', ') : 'conteúdos corporativos';

  const userPrompt =
    `Gere exatamente ${BATTLE_QUESTIONS} perguntas de múltipla escolha (4 opções, uma correta) ` +
    `sobre os treinamentos da empresa abordando: ${topicText}. ` +
    `As perguntas devem ser objetivas, do domínio corporativo e sem ambiguidade.`;

  for (const attempt of chain) {
    try {
      const { object } = await generateObject({
        model: attempt.build(),
        schema: battleSchema,
        system:
          'Você é o examinador de conhecimento corporativo da Pontufy. ' +
          'Gere perguntas factuais e verificáveis, em português, com uma única resposta correta.',
        prompt: userPrompt,
        temperature: 0.7,
        maxRetries: 1,
        maxOutputTokens: 1200,
      });
      return object.questions;
    } catch (err) {
      console.warn(`[battles] Geração de questões falhou em ${attempt.name}:`, err);
    }
  }

  console.warn('[battles] Sem provedor de IA — usando questões locais determinísticas.');
  return localFallbackQuestions(topicText);
}

// ── Ciclo de vida do duelo ─────────────────────────────────────────────────

export interface BattleTurnInput {
  answers: number[];      // índice escolhido por questão (server-side re-score)
  elapsedSeconds: number; // tempo total do turno (anti-trapaça)
  focusLost: boolean;     // 13.4 — perda de foco na janela anula o turno
}

export interface BattleTurnResult {
  score: number;
  correct: boolean[];
  completed: boolean;
  winnerId: string | null;
  forfeited: boolean;
}

export function scoreBattleTurn(questions: BattleQuestion[], answers: number[]): boolean[] {
  return questions.map((q, i) => {
    const chosen = answers[i];
    return Number.isInteger(chosen) && chosen === q.correctIndex;
  });
}

export function battlesTopicsFrom(questionsJson: string): string[] {
  try {
    const parsed: { questions: Array<{ question: string }> } = JSON.parse(questionsJson);
    return parsed.questions.map((q) => q.question.slice(0, 60));
  } catch {
    return [];
  }
}

// Converte títulos de cursos em tópicos seguros para o prompt.
export function safeTopics(courseTitles: string[]): string[] {
  return courseTitles.filter((t) => t && t.length > 2).slice(0, 8);
}

export async function getTenantCourseTitles(tenantId: string): Promise<string[]> {
  const db = getTenantDb(tenantId);
  const courses = await db.course.findMany({
    where: { status: 'published' },
    select: { title: true },
    take: 20,
  });
  return courses.map((c) => c.title);
}

export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}