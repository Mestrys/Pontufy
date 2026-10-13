// Prompts do gerador de cursos, compartilhados entre a geração do curso
// (actions/course-generator) e a nova geração de uma aula (actions/course-review).

import type { ContentType } from '@/lib/course-types';

export const SYSTEM_PROMPT = `Você é o motor de IA da Pontufy, uma plataforma B2B de educação corporativa gamificada.
Gere um curso de treinamento COMPLETO, prático e adaptado ao setor/vertical informado.

Regras OBRIGATÓRIAS:
1. FOCO SETORIAL — Adapte títulos, exemplos e vocabulário ao setor. Nada genérico.
2. ESTRUTURA — Entregue de 3 a 8 aulas, em ordem didática (do fundamental ao avançado). Use o campo "order" para numerar (1, 2, 3...).
3. CONTEÚDO COMPLETO — Cada aula DEVE ter conteúdo rico e completo no FORMATO indicado ao final:
   - O "content" DEVE ter pelo menos 200 caracteres úteis.
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


export const FORMAT_PROMPTS: Record<ContentType, string> = {
  text: 'FORMATO: Artigos educacionais em Markdown. Cada aula é um texto completo e rico, com no mínimo 3 parágrafos substanciais (150+ palavras cada).',
  video: 'FORMATO: Roteiros de vídeo prontos para gravação. Cada aula é um roteiro detalhado com narração, visual e duração por cena. Foque em clareza e impacto visual.',
  podcast: 'FORMATO: Roteiros de podcast profissional. Cada aula é um episódio com diálogos naturais, perguntas provocativas e dicas de produção. Tom conversacional e envolvente.',
  slides: 'FORMATO: Estrutura de apresentações de slides. Cada aula é uma apresentação com conteúdo do slide + notas do apresentador. Linguagem direta, visual sugerido por slide.',
  quiz_interativo: 'FORMATO: Módulos de quiz interativo situacional. Cada aula apresenta um cenário real e 5+ perguntas com explicação detalhada de cada resposta. Foque em aplicação prática.',
  escrita_expressa: 'FORMATO: Exercícios de escrita profissional. Cada aula é um desafio de escrita contextualizado com rubrica de avaliação e exemplo de excelência. Estimule comunicação eficaz.',
};

/** Orientação estrutural do campo "content" de cada aula, por formato. */
export const LESSON_CONTENT_DESCRIPTIONS: Record<ContentType, string> = {
  text:
    'Conteúdo educacional COMPLETO em Markdown. ' +
    'Mínimo 3 parágrafos substanciais (150+ palavras cada). ' +
    'Inclua conceitos-chave, exemplos práticos, boas práticas. ' +
    'Use ## para subtítulos, **negrito** para termos, - para listas.',
  video:
    'ROTEIRO DE VÍDEO completo em Markdown. ' +
    'Estruture em cenas: ## Cena 1 — Abertura, ## Cena 2 — Desenvolvimento, etc. ' +
    'Para cada cena inclua: **NARRAÇÃO:** (texto falado), **VISUAL:** (o que aparece na tela), **DURAÇÃO:** (estimativa em segundos). ' +
    'Tom: didático, objetivo. Duração total estimada: 5-10 minutos. ' +
    'Inclua chamada para ação no final.',
  podcast:
    'ROTEIRO DE PODCAST em Markdown. ' +
    'Formato: diálogo entre HOST e ESPECIALISTA ou monólogo do HOST. ' +
    'Use **HOST:** e **ESPECIALISTA:** para cada fala. ' +
    'Inclua: ## Abertura (apresentação do tema), ## Desenvolvimento (3-5 blocos temáticos), ## Encerramento (resumo + chamada). ' +
    'Tom: conversacional, envolvente. Duração estimada: 8-15 minutos. ' +
    'Inclua dicas de produção entre colchetes [PAUSA], [TRILHA SONORA], [EFEITO].',
  slides:
    'ESTRUTURA DE APRESENTAÇÃO em Markdown. ' +
    'Cada slide começa com ## Slide N — Título. ' +
    'Para cada slide inclua: **Conteúdo principal** (bullets ou texto curto), **Notas do apresentador** (contexto adicional), **Visual sugerido** (ícone, gráfico ou imagem). ' +
    'Estrutura mínima: Slide 1 (capa), Slides 2-N (conteúdo), Slide final (resumo + próximos passos). ' +
    'Máximo 7 bullets por slide. Linguagem direta e impactante.',
  quiz_interativo:
    'MÓDULO DE QUIZ INTERATIVO em Markdown. ' +
    'Estruture como: ## Contexto (situação do mundo real) + bloco de perguntas com formato: ' +
    '**Pergunta N:** [enunciado] | A) [opção] B) [opção] C) [opção] D) [opção] | **Resposta:** [letra] | **Explicação:** [por que esta é a correta e as outras erradas]. ' +
    'Inclua pelo menos 5 perguntas com dificuldade progressiva. ' +
    'Varie formatos: múltipla escolha, verdadeiro/falso, situação-problema.',
  escrita_expressa:
    'EXERCÍCIO DE ESCRITA EXPRESSA em Markdown. ' +
    'Estruture com: ## Contexto (cenário profissional real), ## Proposta de Escrita (tarefa clara com prazo e formato), ' +
    '## Critérios de Avaliação (rubrica com 4-5 critérios pontuados), ## Exemplo de Resposta Excelente (modelo para referência), ' +
    '## Dicas de Escrita (3-5 dicas práticas específicas para o tema). ' +
    'Tom: desafiador mas encorajador. Foque em habilidades de comunicação profissional.',
};

