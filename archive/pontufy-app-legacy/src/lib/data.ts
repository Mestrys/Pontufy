import type { Course, Reward } from './types';

// Camada de dados seed. Substituir por banco (Supabase/Postgres) quando o
// backend real for provisionado — as rotas /api já validam contra esta fonte.

export const COURSES: Course[] = [
  {
    id: 'seguranca-informacao',
    title: 'Segurança da Informação no Dia a Dia',
    tagline: 'Trilha obrigatória · Gerada por IA para o seu cargo',
    description:
      'Phishing, engenharia social e proteção de dados aplicados à sua rotina. Conteúdo adaptado pela IA do Pontufy ao seu departamento e nível de acesso.',
    category: 'Compliance',
    mandatory: true,
    aiGenerated: true,
    gradient: 'from-emerald-950 via-[#0f1f1a] to-[#0a0a0a]',
    lessons: [
      {
        id: 'si-01',
        title: 'Anatomia de um ataque de phishing',
        durationMin: 8,
        points: 50,
        content: [
          'Phishing é a porta de entrada de 9 em cada 10 incidentes corporativos. Nesta aula você aprende a reconhecer os três marcadores presentes em praticamente toda tentativa: urgência artificial, remetente disfarçado e chamada para ação fora do fluxo normal.',
          'Analisaremos e-mails reais (anonimizados) recebidos por empresas brasileiras, destacando cabeçalhos falsificados e domínios homógrafos como "p0ntufy.com".',
          'Ao final, você saberá aplicar a regra dos 5 segundos: pausar, verificar o remetente real e confirmar por um segundo canal antes de clicar.',
        ],
      },
      {
        id: 'si-02',
        title: 'Senhas, MFA e o fim do post-it',
        durationMin: 6,
        points: 40,
        content: [
          'Uma senha forte não é uma senha difícil de lembrar — é uma senha impossível de adivinhar. Veremos por que "Empresa@2026" cai em segundos e como frases-senha resolvem o problema.',
          'Você vai ativar o MFA nas ferramentas da empresa acompanhando o passo a passo, entendendo a diferença entre SMS, aplicativo autenticador e chaves físicas.',
        ],
      },
      {
        id: 'si-03',
        title: 'Dados sensíveis e LGPD na prática',
        durationMin: 10,
        points: 60,
        content: [
          'O que é dado pessoal, dado sensível e dado anonimizado — e por que a diferença muda o que você pode fazer com cada um.',
          'Casos práticos: compartilhar planilha de clientes por WhatsApp, deixar crachá visível em foto de rede social, descartar impressões sem triturar.',
          'Checklist final de conformidade para o seu dia a dia, gerado pela IA com base na sua função.',
        ],
      },
    ],
  },
  {
    id: 'atendimento-consultivo',
    title: 'Atendimento Consultivo B2B',
    tagline: 'Recomendado pela IA · Baseado nas suas metas do trimestre',
    description:
      'Transforme atendimento reativo em consultoria ativa: descoberta de necessidades, escuta estruturada e follow-up que gera receita.',
    category: 'Vendas',
    mandatory: false,
    aiGenerated: true,
    gradient: 'from-indigo-950 via-[#131324] to-[#0a0a0a]',
    lessons: [
      {
        id: 'ac-01',
        title: 'Descoberta: perguntas que abrem portas',
        durationMin: 9,
        points: 45,
        content: [
          'A diferença entre perguntar "posso ajudar?" e "o que tiraria essa entrega do vermelho esta semana?". Estrutura SPIN adaptada ao contexto brasileiro.',
          'Roleplay guiado com três cenários do seu segmento, gerados pela IA a partir do CRM da empresa.',
        ],
      },
      {
        id: 'ac-02',
        title: 'Escuta ativa e registro estruturado',
        durationMin: 7,
        points: 40,
        content: [
          'Como registrar a dor do cliente de forma que o próximo colega — ou a IA — consiga agir sobre ela sem retrabalho.',
          'Modelo de nota consultiva em 4 linhas: contexto, dor, impacto, próximo passo.',
        ],
      },
    ],
  },
  {
    id: 'lideranca-dados',
    title: 'Liderança Orientada a Dados',
    tagline: 'Trilha da sua jornada de carreira',
    description:
      'Para quem lidera ou quer liderar: métricas que importam, rituais de acompanhamento e feedback baseado em evidência, não em impressão.',
    category: 'Liderança',
    mandatory: false,
    aiGenerated: true,
    gradient: 'from-amber-950 via-[#1c1409] to-[#0a0a0a]',
    lessons: [
      {
        id: 'ld-01',
        title: 'Métricas de time: sinal versus ruído',
        durationMin: 11,
        points: 55,
        content: [
          'Todo dashboard tem números demais. Aprenda a escolher as 3 métricas que refletem saúde do time e a ignorar métricas de vaidade.',
          'Exercício: montar o painel mínimo do seu time com dados reais do último trimestre.',
        ],
      },
      {
        id: 'ld-02',
        title: 'Feedback com evidência',
        durationMin: 8,
        points: 45,
        content: [
          'Estrutura SBI (Situação, Comportamento, Impacto) aplicada com exemplos coletados ao longo do ciclo — não na véspera da avaliação.',
        ],
      },
    ],
  },
  {
    id: 'excel-produtividade',
    title: 'Excel para Decisão Rápida',
    tagline: 'Recomendado pela IA · Lacuna identificada na sua trilha',
    description:
      'PROCX, tabelas dinâmicas e limpeza de dados: as três habilidades que cortam horas da sua semana, sem fórmulas decorativas.',
    category: 'Produtividade',
    mandatory: false,
    aiGenerated: true,
    gradient: 'from-teal-950 via-[#0d1a1c] to-[#0a0a0a]',
    lessons: [
      {
        id: 'ex-01',
        title: 'PROCX sem medo',
        durationMin: 6,
        points: 35,
        content: [
          'Do PROCV herdado ao PROCX: busca em qualquer direção, tratamento de erro embutido e correspondência aproximada controlada.',
        ],
      },
      {
        id: 'ex-02',
        title: 'Tabela dinâmica em 10 minutos',
        durationMin: 10,
        points: 50,
        content: [
          'Da base bruta ao resumo executivo: agrupamento por período, campos calculados e segmentação de dados para apresentações.',
        ],
      },
    ],
  },
];

export const REWARDS: Reward[] = [
  {
    id: 'gift-ifood',
    title: 'Gift Card iFood R$ 50',
    partner: 'iFood',
    description: 'Crédito de R$ 50 para pedir onde quiser. Código liberado na hora.',
    requiredPoints: 300,
    gradient: 'from-red-950 via-[#1d0d0d] to-[#0a0a0a]',
    affiliateUrl: 'https://parceiros.pontufy.com/ifood/resgate',
  },
  {
    id: 'curso-alura',
    title: '1 mês de Alura',
    partner: 'Alura',
    description: 'Acesso completo à plataforma por 30 dias, cumulativo com sua assinatura.',
    requiredPoints: 450,
    gradient: 'from-sky-950 via-[#0d1520] to-[#0a0a0a]',
    affiliateUrl: 'https://parceiros.pontufy.com/alura/resgate',
  },
  {
    id: 'day-off',
    title: 'Day-off de aniversário',
    partner: 'Sua empresa',
    description: 'Um dia de folga adicional no mês do seu aniversário. Aprovação automática no RH.',
    requiredPoints: 600,
    gradient: 'from-violet-950 via-[#150d20] to-[#0a0a0a]',
    affiliateUrl: 'https://parceiros.pontufy.com/rh/day-off',
  },
  {
    id: 'gift-amazon',
    title: 'Gift Card Amazon R$ 100',
    partner: 'Amazon',
    description: 'Crédito de R$ 100 na Amazon Brasil. Código enviado também por e-mail.',
    requiredPoints: 800,
    gradient: 'from-orange-950 via-[#1c1206] to-[#0a0a0a]',
    affiliateUrl: 'https://parceiros.pontufy.com/amazon/resgate',
  },
  {
    id: 'smartwatch',
    title: 'Smartwatch Fit',
    partner: 'Clube Pontufy',
    description: 'Monitor de atividade e sono, entrega em até 10 dias úteis.',
    requiredPoints: 1500,
    gradient: 'from-emerald-950 via-[#0d1a14] to-[#0a0a0a]',
    affiliateUrl: 'https://parceiros.pontufy.com/clube/smartwatch',
  },
];

// Estado inicial do colaborador demo (substituído por sessão real + banco depois)
export const INITIAL_USER = {
  name: 'Flávio Santos',
  role: 'Analista de Operações',
  points: 180,
  completedLessonIds: ['si-01', 'ac-01'],
};

export function findLesson(courseId: string, lessonId: string) {
  const course = COURSES.find((c) => c.id === courseId);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  return course && lesson ? { course, lesson } : null;
}

export function findReward(rewardId: string) {
  return REWARDS.find((r) => r.id === rewardId) ?? null;
}
