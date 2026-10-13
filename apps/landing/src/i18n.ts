// Textos da landing nos três idiomas. Regra: só afirmar o que o app faz hoje
// (apps/pontufy). Sem números sem fonte, sem logs ou selos de demonstração.

export type Lang = 'PT-BR' | 'EN-US' | 'ES-LA';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'PT-BR', label: 'Português' },
  { code: 'EN-US', label: 'English' },
  { code: 'ES-LA', label: 'Español' },
];

export interface Copy {
  nav: {
    how: string;
    ai: string;
    rewards: string;
    security: string;
    faq: string;
    login: string;
    openMenu: string;
    closeMenu: string;
    language: string;
    main: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    desc: string;
    ctaContact: string;
    ctaLogin: string;
    contactSubject: string;
    contactHint: string;
  };
  how: { title: string; desc: string; steps: { title: string; text: string }[] };
  ai: { title: string; desc: string; steps: { title: string; text: string }[]; badgeExample: string };
  rewards: { title: string; desc: string; items: string[] };
  security: { title: string; desc: string; items: { title: string; text: string }[]; legalPrefix: string };
  faq: { title: string; items: { q: string; a: string }[] };
  footer: {
    product: string;
    legal: string;
    privacy: string;
    terms: string;
    contact: string;
    follow: string;
    copyright: string;
    company: string;
  };
}

const PT: Copy = {
  nav: {
    how: 'Como funciona',
    ai: 'Cursos com IA',
    rewards: 'Recompensas',
    security: 'Segurança',
    faq: 'Perguntas',
    login: 'Entrar',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    language: 'Idioma',
    main: 'Seções da página',
  },
  hero: {
    eyebrow: 'Treinamento corporativo com pontos e recompensas',
    title: 'Treinamentos que a equipe conclui, com pontos que viram benefícios.',
    desc: 'O RH cria cursos com ajuda de IA, revisa e publica. Cada aula concluída soma pontos, e o colaborador troca os pontos pelos benefícios que a empresa escolheu.',
    ctaContact: 'Falar com a equipe',
    ctaLogin: 'Entrar',
    contactSubject: 'Quero conhecer o Pontufy',
    contactHint: 'Abre o seu e-mail com uma mensagem para ajuda@pontufy.com.',
  },
  how: {
    title: 'Como funciona',
    desc: 'Um ciclo curto: aprender, ganhar pontos, trocar por benefícios.',
    steps: [
      { title: 'Aprender', text: 'O colaborador faz as aulas no celular ou no computador. A leitura é confortável e a próxima aula fica sempre a um toque.' },
      { title: 'Ganhar pontos', text: 'Cada aula concluída vale pontos, e a avaliação final dá um bônus. Níveis, sequência de dias e certificados mostram o progresso.' },
      { title: 'Trocar por benefícios', text: 'Os pontos ficam na carteira e podem ser trocados pelos benefícios que o RH liberou para a empresa.' },
    ],
  },
  ai: {
    title: 'Cursos com IA, revisados pelo RH',
    desc: 'A IA escreve o rascunho. Quem decide o que chega à equipe é uma pessoa do RH.',
    steps: [
      { title: 'Descreva o curso', text: 'Diga o tema, o setor e o formato (texto, roteiro de vídeo, podcast, slides e outros). Você pode anexar material de referência.' },
      { title: 'Receba um rascunho', text: 'O curso nasce como rascunho, com aulas, pontos por aula e avaliação final. Ninguém da equipe vê ainda.' },
      { title: 'Revise', text: 'Leia cada aula, corrija o texto ou peça à IA uma nova versão de uma aula, com as suas instruções.' },
      { title: 'Publique', text: 'Ao publicar, o curso aparece para a equipe com o selo de que foi criado com IA e revisado por você.' },
    ],
    badgeExample: 'Criado com IA, revisado por Ana (RH)',
  },
  rewards: {
    title: 'Recompensas',
    desc: 'O RH controla o que pode ser resgatado. O colaborador vê o próprio saldo e o que falta para cada benefício.',
    items: [
      'O RH liga e desliga cada benefício do catálogo da empresa.',
      'O colaborador acompanha saldo, histórico e nível na carteira.',
      'Cada resgate gera um protocolo que fica no histórico.',
    ],
  },
  security: {
    title: 'Segurança',
    desc: 'O que o Pontufy faz hoje para proteger os dados da sua empresa.',
    items: [
      { title: 'Dados separados por empresa', text: 'Cada consulta é limitada à empresa da pessoa conectada.' },
      { title: 'Registro de ações do RH', text: 'Publicar curso, mudar a marca, convidar pessoas e liberar benefícios ficam na trilha de auditoria.' },
      { title: 'Senhas protegidas', text: 'As senhas são guardadas com hash (scrypt) e sal aleatório, nunca em texto.' },
      { title: 'Sessões sob controle', text: 'Cada pessoa pode encerrar a sessão em todos os aparelhos pelo próprio perfil.' },
    ],
    legalPrefix: 'Como tratamos dados pessoais:',
  },
  faq: {
    title: 'Perguntas frequentes',
    items: [
      { q: 'Quem decide o conteúdo dos cursos?', a: 'O RH. A IA gera um rascunho, e o curso só fica visível para a equipe depois que alguém do RH revisa e publica.' },
      { q: 'Quais benefícios a equipe pode resgatar?', a: 'Os que o RH ativar no catálogo da empresa. Fale com a gente para conhecer as opções disponíveis.' },
      { q: 'Dá para usar a marca da empresa?', a: 'Sim. O RH define o logo e as cores; o Pontufy ajusta os tons automaticamente para manter o texto legível.' },
      { q: 'Funciona no celular?', a: 'Sim. O app foi pensado para o celular, com navegação na parte de baixo, e também funciona no computador, no tema claro ou escuro.' },
    ],
  },
  footer: {
    product: 'Produto',
    legal: 'Legal',
    privacy: 'Política de privacidade',
    terms: 'Termos de uso',
    contact: 'Contato',
    follow: 'Mestry’s nas redes',
    copyright: '© 2026 Mestry’s Tecnologia e Consultoria em TI LTDA.',
    company: 'CNPJ 68.027.889/0001-34 · Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP',
  },
};

const EN: Copy = {
  nav: {
    how: 'How it works',
    ai: 'AI courses',
    rewards: 'Rewards',
    security: 'Security',
    faq: 'FAQ',
    login: 'Sign in',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
    main: 'Page sections',
  },
  hero: {
    eyebrow: 'Corporate training with points and rewards',
    title: 'Training your team finishes, with points that turn into benefits.',
    desc: 'HR creates courses with help from AI, reviews them and publishes. Every completed lesson earns points, and employees trade them for the benefits the company chose.',
    ctaContact: 'Talk to the team',
    ctaLogin: 'Sign in',
    contactSubject: 'I want to learn about Pontufy',
    contactHint: 'Opens your email with a message to ajuda@pontufy.com.',
  },
  how: {
    title: 'How it works',
    desc: 'A short loop: learn, earn points, trade them for benefits.',
    steps: [
      { title: 'Learn', text: 'Employees take lessons on their phone or computer. Reading is comfortable and the next lesson is always one tap away.' },
      { title: 'Earn points', text: 'Every completed lesson earns points, and the final assessment adds a bonus. Levels, day streaks and certificates show progress.' },
      { title: 'Trade for benefits', text: 'Points stay in the wallet and can be traded for the benefits HR made available.' },
    ],
  },
  ai: {
    title: 'AI courses, reviewed by HR',
    desc: 'AI writes the draft. A person in HR decides what reaches the team.',
    steps: [
      { title: 'Describe the course', text: 'Give the topic, industry and format (text, video script, podcast, slides and more). You can attach reference material.' },
      { title: 'Get a draft', text: 'The course starts as a draft, with lessons, points per lesson and a final assessment. Nobody on the team sees it yet.' },
      { title: 'Review', text: 'Read every lesson, fix the text or ask the AI for a new version of a lesson, with your instructions.' },
      { title: 'Publish', text: 'Once published, the course shows up for the team with a note that it was created with AI and reviewed by you.' },
    ],
    badgeExample: 'Created with AI, reviewed by Ana (HR)',
  },
  rewards: {
    title: 'Rewards',
    desc: 'HR controls what can be redeemed. Employees see their balance and how far they are from each benefit.',
    items: [
      'HR turns each benefit in the company catalog on or off.',
      'Employees follow their balance, history and level in the wallet.',
      'Every redemption creates a protocol number kept in the history.',
    ],
  },
  security: {
    title: 'Security',
    desc: 'What Pontufy does today to protect your company’s data.',
    items: [
      { title: 'Data kept per company', text: 'Every query is limited to the company of the signed-in person.' },
      { title: 'Log of HR actions', text: 'Publishing a course, changing the brand, inviting people and enabling benefits go to the audit trail.' },
      { title: 'Protected passwords', text: 'Passwords are stored as a salted hash (scrypt), never as plain text.' },
      { title: 'Sessions under control', text: 'Anyone can sign out of every device from their own profile.' },
    ],
    legalPrefix: 'How we handle personal data:',
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'Who decides what goes into the courses?', a: 'HR. The AI writes a draft, and the course only becomes visible to the team after someone in HR reviews and publishes it.' },
      { q: 'Which benefits can the team redeem?', a: 'The ones HR turns on in the company catalog. Talk to us to learn about the available options.' },
      { q: 'Can we use our company brand?', a: 'Yes. HR sets the logo and colors; Pontufy adjusts the shades automatically to keep text readable.' },
      { q: 'Does it work on phones?', a: 'Yes. The app is built for phones, with navigation at the bottom, and also works on computers, in light or dark theme.' },
    ],
  },
  footer: {
    product: 'Product',
    legal: 'Legal',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    contact: 'Contact',
    follow: 'Mestry’s on social media',
    copyright: '© 2026 Mestry’s Tecnologia e Consultoria em TI LTDA.',
    company: 'CNPJ 68.027.889/0001-34 · Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP, Brazil',
  },
};

const ES: Copy = {
  nav: {
    how: 'Cómo funciona',
    ai: 'Cursos con IA',
    rewards: 'Recompensas',
    security: 'Seguridad',
    faq: 'Preguntas',
    login: 'Ingresar',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    language: 'Idioma',
    main: 'Secciones de la página',
  },
  hero: {
    eyebrow: 'Capacitación corporativa con puntos y recompensas',
    title: 'Capacitaciones que el equipo termina, con puntos que se convierten en beneficios.',
    desc: 'RR. HH. crea cursos con ayuda de IA, los revisa y los publica. Cada lección completada suma puntos, y el colaborador los canjea por los beneficios que eligió la empresa.',
    ctaContact: 'Hablar con el equipo',
    ctaLogin: 'Ingresar',
    contactSubject: 'Quiero conocer Pontufy',
    contactHint: 'Abre tu correo con un mensaje para ajuda@pontufy.com.',
  },
  how: {
    title: 'Cómo funciona',
    desc: 'Un ciclo corto: aprender, ganar puntos, canjearlos por beneficios.',
    steps: [
      { title: 'Aprender', text: 'El colaborador toma las lecciones en el celular o en la computadora. La lectura es cómoda y la siguiente lección siempre está a un toque.' },
      { title: 'Ganar puntos', text: 'Cada lección completada suma puntos, y la evaluación final da un bono. Niveles, rachas de días y certificados muestran el avance.' },
      { title: 'Canjear por beneficios', text: 'Los puntos quedan en la billetera y se pueden canjear por los beneficios que RR. HH. habilitó.' },
    ],
  },
  ai: {
    title: 'Cursos con IA, revisados por RR. HH.',
    desc: 'La IA escribe el borrador. Una persona de RR. HH. decide qué llega al equipo.',
    steps: [
      { title: 'Describe el curso', text: 'Indica el tema, el sector y el formato (texto, guion de video, pódcast, diapositivas y más). Puedes adjuntar material de referencia.' },
      { title: 'Recibe un borrador', text: 'El curso nace como borrador, con lecciones, puntos por lección y evaluación final. Nadie del equipo lo ve todavía.' },
      { title: 'Revisa', text: 'Lee cada lección, corrige el texto o pide a la IA una nueva versión de una lección, con tus instrucciones.' },
      { title: 'Publica', text: 'Al publicar, el curso aparece para el equipo con la indicación de que fue creado con IA y revisado por ti.' },
    ],
    badgeExample: 'Creado con IA, revisado por Ana (RR. HH.)',
  },
  rewards: {
    title: 'Recompensas',
    desc: 'RR. HH. controla qué se puede canjear. El colaborador ve su saldo y cuánto le falta para cada beneficio.',
    items: [
      'RR. HH. activa o desactiva cada beneficio del catálogo de la empresa.',
      'El colaborador sigue su saldo, historial y nivel en la billetera.',
      'Cada canje genera un número de protocolo que queda en el historial.',
    ],
  },
  security: {
    title: 'Seguridad',
    desc: 'Lo que Pontufy hace hoy para proteger los datos de tu empresa.',
    items: [
      { title: 'Datos separados por empresa', text: 'Cada consulta se limita a la empresa de la persona conectada.' },
      { title: 'Registro de acciones de RR. HH.', text: 'Publicar un curso, cambiar la marca, invitar personas y habilitar beneficios quedan en la auditoría.' },
      { title: 'Contraseñas protegidas', text: 'Las contraseñas se guardan con hash (scrypt) y sal aleatoria, nunca en texto.' },
      { title: 'Sesiones bajo control', text: 'Cada persona puede cerrar la sesión en todos los dispositivos desde su perfil.' },
    ],
    legalPrefix: 'Cómo tratamos los datos personales:',
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      { q: '¿Quién decide el contenido de los cursos?', a: 'RR. HH. La IA genera un borrador, y el curso solo es visible para el equipo después de que alguien de RR. HH. lo revisa y lo publica.' },
      { q: '¿Qué beneficios puede canjear el equipo?', a: 'Los que RR. HH. active en el catálogo de la empresa. Escríbenos para conocer las opciones disponibles.' },
      { q: '¿Podemos usar la marca de la empresa?', a: 'Sí. RR. HH. define el logo y los colores; Pontufy ajusta los tonos automáticamente para que el texto siga legible.' },
      { q: '¿Funciona en el celular?', a: 'Sí. La app está pensada para el celular, con navegación en la parte inferior, y también funciona en la computadora, en tema claro u oscuro.' },
    ],
  },
  footer: {
    product: 'Producto',
    legal: 'Legal',
    privacy: 'Política de privacidad',
    terms: 'Términos de uso',
    contact: 'Contacto',
    follow: 'Mestry’s en redes',
    copyright: '© 2026 Mestry’s Tecnologia e Consultoria em TI LTDA.',
    company: 'CNPJ 68.027.889/0001-34 · Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP, Brasil',
  },
};

export const COPY: Record<Lang, Copy> = { 'PT-BR': PT, 'EN-US': EN, 'ES-LA': ES };
