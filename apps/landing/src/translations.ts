export interface Lesson {
  title: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  points: number;
}

export interface IndustryData {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  lesson: Lesson;
}

export interface RewardData {
  id: string;
  name: string;
  color: string;
  requiredPoints: number;
  value: string;
  gradient: string;
  logo: string;
}

export interface TranslationSchema {
  header: {
    howItWorks: string;
    aiSimulator: string;
    rewards: string;
    security: string;
    faq: string;
    viewDemo: string;
    login: string;
  };
  hero: {
    badge: string;
    title: string;
    titleAccent: string;
    titleEnd: string;
    desc: string;
    formTitle: string;
    formSub: string;
    labelEmail: string;
    labelRole: string;
    labelSize: string;
    roleOptions: {
      default: string;
      hrDirector: string;
      ldManager: string;
      ceo: string;
      opsManager: string;
      others: string;
    };
    sizeOptions: {
      default: string;
      micro: string;
      small: string;
      medium: string;
      large: string;
    };
    btnSubmit: string;
    disclaimer: string;
    successTitle: string;
    successDesc: string;
    successTipTitle: string;
    successTipText: string;
    successBtn: string;
  };
  connectivity: {
    title: string;
    desc: string;
    labelAI: string;
    labelRH: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    desc: string;
    steps: Array<{ num: string; title: string; text: string }>;
  };
  simulator: {
    badge: string;
    title: string;
    desc: string;
    labelSelectSector: string;
    btnSimulate: string;
    btnSimulating: string;
    steps: string[];
    placeholderTitle: string;
    placeholderDesc: string;
    badgeGenerated: string;
    titleQuiz: string;
    infoSelectAnswer: string;
    btnConfirm: string;
    correctTitle: string;
    correctPoints: string;
    incorrectTitle: string;
    incorrectText: string;
    btnGenerateOther: string;
    industries: Record<string, IndustryData>;
  };
  showcase: {
    badge: string;
    title: string;
    desc: string;
    catalogTitle: string;
    catalogDesc: string;
    labelBalance: string;
    subBalance: string;
    confirmTitle: string;
    confirmText: string;
    costLabel: string;
    balanceLabel: string;
    btnRedeem: string;
    processingBanner: string;
    steps: string[];
    successTitle: string;
    successDesc: string;
    voucherTitle: string;
    voucherSub: string;
    btnNewRedeem: string;
    rewards: Record<string, RewardData>;
  };
  security: {
    badge: string;
    title: string;
    desc: string;
    benefits: Array<{ title: string; desc: string }>;
    consoleTitle: string;
    zeroTrustShield: string;
    enabled: string;
    disabled: string;
    integrityLabel: string;
    auditsLabel: string;
    auditsValue: string;
    logs: {
      authSuccess: string;
      integrityCheck: string;
      gatewayHealth: string;
      courseGenRequest: string;
      courseGenSuccess: string;
      quizAnswerCorrect: string;
      quizAnswerIncorrect: string;
      redeemFailed: string;
      redeemRequested: string;
      redeemSuccess: string;
      zeroTrustToggled: string;
      tenantChanged: string;
    };
  };
  matrix: {
    badge: string;
    title: string;
    desc: string;
    learnMore: string;
    cards: Array<{ title: string; text: string }>;
  };
  faq: {
    title: string;
    desc: string;
    items: Array<{ question: string; answer: string }>;
  };
  footer: {
    zeroTrustActive: string;
    copyright: string;
    subCopyright: string;
  };
}

export const translations: Record<string, TranslationSchema> = {
  "PT-BR": {
    header: {
      howItWorks: "Trajetória Contínua",
      aiSimulator: "Simulador de Módulos",
      rewards: "Moeda de Confiança",
      security: "Arquitetura Corporativa",
      faq: "Perguntas de Impacto",
      viewDemo: "Testar Simulador",
      login: "Entrar na Plataforma"
    },
    hero: {
      badge: "Construindo Patrimônio de Carreira com Transparência Radical",
      title: "Treinamentos que as pessoas ",
      titleAccent: "realmente querem terminar.",
      titleEnd: " O conhecimento que gera valor tangível.",
      desc: "Os cursos corporativos tradicionais falham porque parecem obrigações cansativas e burocráticas. O Pontufy redefine essa relação por meio de uma ponte de valor mútuo: a empresa investe no desenvolvimento de suas equipes (B2B) e o colaborador conquista o conhecimento e pontos reais que são seus por direito (2C). O valor gerado permanece com o profissional como patrimônio portátil de sua carreira, consolidando uma relação de confiança inédita.",
      formTitle: "Abra Caminho para uma Parceria Sólida",
      formSub: "Deixe seus dados de contato empresarial para receber uma simulação financeira personalizada para a sua equipe.",
      labelEmail: "Seu E-mail Corporativo",
      labelRole: "Sua Posição de Liderança",
      labelSize: "Quantidade de Colaboradores",
      roleOptions: {
        default: "Selecione o seu papel...",
        hrDirector: "Diretor ou Head de Recursos Humanos",
        ldManager: "Gerente de Treinamento e Desenvolvimento",
        ceo: "CEO, Fundador ou Sócio Diretor",
        opsManager: "Gerente Operacional ou Comercial",
        others: "Outro Cargo Executivo"
      },
      sizeOptions: {
        default: "Selecione o tamanho da empresa...",
        micro: "Até 50 colaboradores em crescimento",
        small: "De 51 a 200 colaboradores",
        medium: "De 201 a 1000 colaboradores",
        large: "Acima de 1000 colaboradores em grande escala"
      },
      btnSubmit: "Agendar Demonstração e Simular Retorno",
      disclaimer: "Segurança de dados assegurada sob as diretrizes da LGPD.",
      successTitle: "Abertura de Canal Concluída!",
      successDesc: "Entraremos em contato em menos de uma hora comercial para apresentar como sua organização pode impulsionar o engajamento operacional sustentável.",
      successTipTitle: "Próximo Passo no Painel",
      successTipText: "Use o simulador dinâmico abaixo para experimentar como a inteligência cria módulos específicos e permite o resgate direto de pontos.",
      successBtn: "Ir ao Simulador Ativo"
    },
    connectivity: {
      title: "Conexão Direta entre Conhecimento e Valor",
      desc: "As conquistas intelectuais dos colaboradores são registradas em tempo real e convertidas em saldo físico para resgates, com auditoria de segurança imediata.",
      labelAI: "Automação Estrutural",
      labelRH: "Zero Esforço Logístico"
    },
    howItWorks: {
      badge: "Evolução Contínua",
      title: "Como Pontufy Constrói a Carreira do Amanhã?",
      desc: "Uma trajetória dinâmica fundamentada no empoderamento mútuo e na transparência desde o primeiro dia.",
      steps: [
        {
          num: "01",
          title: "Mapeamento Dinâmico",
          text: "O motor de aprendizado traça trajetórias contínuas de capacitação sob medida para cada setor de atuação, acompanhando o profissional desde a integração inicial até posições de alta liderança."
        },
        {
          num: "02",
          title: "Educação Ativa",
          text: "Colaboradores solucionam desafios reais do cotidiano organizacional por meio de micro-lições estimulantes. Cada acerto valida novas competências e acumula saldo."
        },
        {
          num: "03",
          title: "Patrimônio Portátil",
          text: "Toda conquista e saldo acumulado são escriturados em um livro-razão blindado. O conhecimento adquirido pertence integralmente ao profissional, gerando equity de carreira sustentável."
        },
        {
          num: "04",
          title: "Recompensa Física",
          text: "O saldo é convertido de forma direta em vales digitais (Amazon, Magalu, Mercado Livre). O profissional colhe o fruto de seu empenho sem qualquer atrito administrativo para o RH."
        }
      ]
    },
    simulator: {
      badge: "Inteligência Educacional",
      title: "Modele Trilhas de Aprendizado em Segundos",
      desc: "Escolha um dos setores estratégicos abaixo e veja nossa inteligência formular um módulo de capacitação dinâmico, focado em cenários práticos do dia a dia corporativo.",
      labelSelectSector: "Selecione o Setor de Atuação",
      btnSimulate: "Gerar Módulo de Aprendizagem",
      btnSimulating: "Formulando Trilha Educativa...",
      steps: [
        "🧠 Identificando demandas estratégicas do setor selecionado...",
        "🛡️ Aplicando isolamento lógico multitenant para proteção de dados...",
        "🎮 Estruturando o questionário prático de validação de competências...",
        "✨ Trilha Pontufy gerada com foco em aprendizado real!"
      ],
      placeholderTitle: "Simulador de Geração de Conhecimento",
      placeholderDesc: "Escolha uma das verticais de negócio à esquerda para testar como moldamos conteúdos focados em cenários reais e práticos.",
      badgeGenerated: "Módulo Gerado com Sucesso",
      titleQuiz: "Cenário Prático e Validação:",
      infoSelectAnswer: "Selecione a conduta mais adequada para prosseguir",
      btnConfirm: "Confirmar Conduta Estratégica",
      correctTitle: "🎉 Desempenho Excelente!",
      correctPoints: "+100 Pontos Registrados no seu Livro-Razão",
      incorrectTitle: "❌ Ajuste de Conduta Necessário",
      incorrectText: "Avalie o caso com mais critério e gere um novo módulo para reforçar o conhecimento.",
      btnGenerateOther: "Gerar Novo Cenário Prático",
      industries: {
        tech: {
          id: "tech",
          name: "Tecnologia & Segurança",
          icon: "💻",
          tagline: "Mitigação de Riscos & Gestão de Privilégios",
          lesson: {
            title: "Mitigação Ativa de Ataques de Engenharia Social",
            content: "A engenharia social visa contornar firewalls explorando o comportamento humano. O verdadeiro perímetro de segurança não reside nas chaves criptográficas de rede, mas na atenção contínua de quem manipula o painel operacional de controle diariamente.",
            quiz: {
              question: "Ao identificar um contato inesperado em canais internos solicitando liberação de token emergencial, qual conduta demonstra alta maturidade em segurança?",
              options: [
                "Compartilhar o token sob a promessa de envio posterior do chamado formal de suporte técnico",
                "Rejeitar o pedido imediato, abrir ticket oficial e acionar o protocolo Zero Trust de dupla confirmação",
                "Enviar o código de acesso parcial para não travar as operações urgentes da equipe solicitante",
                "Apagar a mensagem e não reportar o incidente para evitar burocracia com a equipe de infraestrutura"
              ],
              correctIndex: 1,
              explanation: "Isolar a conta suspeita e seguir o protocolo Zero Trust impede o escalonamento lateral de privilégios maliciosos de forma eficaz."
            },
            points: 100
          }
        },
        health: {
          id: "health",
          name: "Saúde & Excelência Clínica",
          icon: "🏥",
          tagline: "Segurança de Pacientes & Assepsia Prática",
          lesson: {
            title: "Assepsia Avançada de Equipamentos Clínicos de Ponta",
            content: "Dispositivos médicos e tablets eletrônicos compartilhados entre médicos e enfermeiros podem reter patógenos se não forem esterilizados. A higienização sistemática reduz infecções e garante o bem-estar absoluto do paciente.",
            quiz: {
              question: "Qual o procedimento correto para manter a integridade microbiológica de tablets de prontuários médicos durante as rondas de leitos?",
              options: [
                "Efetuar a limpeza de forma quinzenal utilizando panos secos de algodão simples",
                "Higienizar o aparelho com álcool isopropílico 70% antes e depois de cada atendimento de leito",
                "Higienizar o visor exclusivamente quando houver acúmulo visível de poeira ou resíduos",
                "Descartar a limpeza dos dispositivos sob a alegação de que o profissional já usa luvas esterilizadas"
              ],
              correctIndex: 1,
              explanation: "A higienização imediata entre visitas hospitalares interrompe o ciclo de transmissão de germes com excelência operacional."
            },
            points: 100
          }
        },
        retail: {
          id: "retail",
          name: "Varejo & Expansão de Tíquete",
          icon: "🛍️",
          tagline: "Venda Consultiva & Retenção de Clientes",
          lesson: {
            title: "Técnicas de Upsell e Recomendação Centrada no Cliente",
            content: "A sugestão de itens adicionais deve sempre agregar utilidade real à compra do cliente. Recomendar acessórios e complementos que custem até 30% do valor do produto principal preserva a confiança do consumidor.",
            quiz: {
              question: "Um cliente adquire uma câmera profissional para criação de conteúdo. Qual recomendação de venda adicional demonstra postura consultiva?",
              options: [
                "Forçar a venda casada de uma garantia que o cliente já demonstrou não ter interesse em adquirir",
                "Oferecer um cartão de memória de alta velocidade de leitura e um estojo protetor acolchoado",
                "Finalizar a transação rapidamente sem sugerir complementos cruciais para o funcionamento do equipamento",
                "Substituir o produto escolhido por uma versão inferior para tentar empacotar cabos e baterias sobressalentes"
              ],
              correctIndex: 1,
              explanation: "Acessórios de proteção e armazenamento estendem o valor de uso do bem principal e atendem à necessidade imediata do comprador."
            },
            points: 100
          }
        },
        manufacturing: {
          id: "manufacturing",
          name: "Indústria & Logística Fina",
          icon: "⚙️",
          tagline: "Cultura de Prevenção & Ergonomia Industrial",
          lesson: {
            title: "Ergonomia Aplicada na Movimentação Industrial de Cargas",
            content: "A sustentação manual incorreta de pesos de grande porte gera fadiga crônica nas articulações dos operadores. O respeito aos limites físicos e o acionamento de mecanismos pneumáticos são vitais para preservar a integridade física da equipe.",
            quiz: {
              question: "Ao receber uma carga que excede o limite individual de segurança ergonométrica de 23 kg, qual o procedimento padrão indicado?",
              options: [
                "Elevar o material rapidamente utilizando a força concentrada nos músculos da região lombar",
                "Utilizar manipuladores pneumáticos, talhas mecânicas ou realizar o levantamento compartilhado com outro operador",
                "Apoiar o objeto diretamente sobre um dos ombros para compensar a falta de equilíbrio da carga",
                "Acelerar o passo de transporte manual para se livrar do esforço físico o mais rápido possível"
              ],
              correctIndex: 1,
              explanation: "O auxílio mecânico ou coletivo neutraliza os impactos nas articulações, mantendo a taxa de lesões laborais em zero."
            },
            points: 100
          }
        }
      }
    },
    showcase: {
      badge: "Soberania do Colaborador",
      title: "A Moeda de Confiança Convertida em Prêmios Reais",
      desc: "Os pontos de aprendizado acumulados no Pontufy não expiram e não ficam presos a promessas vazias. Eles se traduzem em vales digitais legítimos nas maiores redes varejistas do mercado, com autonomia absoluta de escolha.",
      catalogTitle: "Catálogo de Resgates Transparentes",
      catalogDesc: "Selecione o prêmio abaixo para simular a dedução do livro-razão e a emissão do seu cupom físico eletrônico.",
      labelBalance: "Seu Saldo Portátil Disponível",
      subBalance: "Seus pontos representam patrimônio consolidado de carreira",
      confirmTitle: "Confirmar Conversão",
      confirmText: "Você está convertendo seus pontos acumulados em um vale digital da {name} no valor de {value}.",
      costLabel: "Pontos Requeridos:",
      balanceLabel: "Seu Saldo Atual de Pontos:",
      btnRedeem: "Confirmar Conversão de Pontos",
      processingBanner: "VALIDANDO CONFORMIDADE DE REGISTRO",
      steps: [
        "🔒 Confirmando assinatura criptográfica de integridade de dados...",
        "🛡️ Validando se o histórico de trilhas cumpre as diretrizes de conformidade...",
        "📊 Deduzindo saldo correspondente no Point Ledger em tempo real...",
        "🎟️ Emitindo código de resgate direto via integração com varejista parceiro..."
      ],
      successTitle: "Conversão Realizada!",
      successDesc: "Os hashes foram validados. O saldo foi atualizado no livro-razão e seu cupom de valor real está disponível.",
      voucherTitle: "Código do Vale Digital",
      voucherSub: "Insira esse código no momento de fechar sua compra no e-commerce oficial",
      btnNewRedeem: "Simular Novo Resgate",
      rewards: {
        amazon_50: {
          id: "amazon_50",
          name: "Amazon Brasil",
          logo: "📦",
          color: "bg-orange-50 text-orange-600",
          requiredPoints: 500,
          value: "R$ 50,00",
          gradient: "from-orange-500 to-amber-400"
        },
        magalu_100: {
          id: "magalu_100",
          name: "Magazine Luiza",
          logo: "💙",
          color: "bg-blue-50 text-blue-600",
          requiredPoints: 1000,
          value: "R$ 100,00",
          gradient: "from-blue-600 to-sky-400"
        },
        mercadolivre_150: {
          id: "mercadolivre_150",
          name: "Mercado Livre",
          logo: "🤝",
          color: "bg-yellow-50 text-yellow-700",
          requiredPoints: 1500,
          value: "R$ 150,00",
          gradient: "from-yellow-400 to-amber-300"
        },
        shopee_50: {
          id: "shopee_50",
          name: "Shopee Brasil",
          logo: "🧡",
          color: "bg-red-50 text-red-600",
          requiredPoints: 500,
          value: "R$ 50,00",
          gradient: "from-red-500 to-orange-400"
        }
      }
    },
    security: {
      badge: "Infraestrutura Corporativa",
      title: "Isolamento Multitenant e Segurança de Dados Rigorosa",
      desc: "A Pontufy protege o ecossistema de cada empresa parceira por meio de isolamento lógico absoluto, criptografia ponta a ponta e auditorias automatizadas. A privacidade de dados é tratada como fundação essencial.",
      benefits: [
        {
          title: "Isolamento Criptográfico de Tenants",
          desc: "Cada organização parceira opera com chaves simétricas exclusivas e partições de bancos de dados segregadas logicamente para evitar vazamentos cruzados."
        },
        {
          title: "Auditoria Contínua Antifraude",
          desc: "Toda atividade educacional gera hashes de integridade criptográficos que blindam a base contra injeção ilegítima de pontuações de forma ativa."
        },
        {
          title: "Zero Trust na Emissão",
          desc: "O resgate de qualquer recompensa exige validação multifatorial em frações de segundo, impedindo o comprometimento de contas corporativas."
        }
      ],
      consoleTitle: "PONTUFY_SECURITY_LEDGER",
      zeroTrustShield: "Zero Trust Active Shield",
      enabled: "SISTEMA INTEGRAL",
      disabled: "VULNERABILIDADE EXPOSTA",
      integrityLabel: "Livro-Razão",
      auditsLabel: "Análise",
      auditsValue: "ATIVA",
      logs: {
        authSuccess: "Tenant {tenant} verificado. Chave criptográfica exclusiva ativa.",
        integrityCheck: "Inspeção sistemática concluída no Point Ledger. Zero registros suspeitos.",
        gatewayHealth: "Conectores diretos com provedores de recompensas respondendo com estabilidade total.",
        courseGenRequest: "Iniciando processo de elaboração de cenário adaptativo para: {sector}",
        courseGenSuccess: "Módulo interativo '{title}' carregado de forma isolada na partição do cliente.",
        quizAnswerCorrect: "Resolução autêntica confirmada para o cenário '{title}'. +100 Pontos autorizados.",
        quizAnswerIncorrect: "Resolução incorreta identificada no cenário '{title}'. Auditoria manteve saldo estável.",
        redeemFailed: "Pedido de conversão barrado. Saldo atual ({points} pts) insuficiente para o prêmio {reward} ({req} pts).",
        redeemRequested: "Solicitação de vale-compra da {reward} ({value}) recebida. Iniciando auditoria de hashes.",
        redeemSuccess: "Valores validados. Vale {reward} emitido com sucesso sob o código de segurança {code}. -{points} pts.",
        zeroTrustToggled: "Configurações de defesa de rede alteradas para {state}.",
        tenantChanged: "Auditando os registros de conformidade do tenant corporativo: {tenant}"
      }
    },
    matrix: {
      badge: "SaaS Corporativo com Foco Humano",
      title: "Construindo Relações de Trabalho Saudáveis",
      desc: "Nossa tecnologia atua nos bastidores para que a jornada de desenvolvimento do colaborador seja respeitosa, envolvente e verdadeiramente valorosa.",
      learnMore: "Ver especificações técnicas",
      cards: [
        {
          title: "Trilhas de Aprendizado com IA",
          text: "Geração de conteúdo educativo altamente contextualizado para a rotina diária da empresa, sem clichês didáticos ou enrolação."
        },
        {
          title: "Conversão Física de Esforço",
          text: "Ponto ganho é ponto valorizado. O colaborador colhe resultados palpáveis por meio de resgate direto de prêmios de grandes marcas."
        },
        {
          title: "Isolamento Multitenant Seguro",
          text: "Partições de dados rigidamente vedadas por chaves criptográficas exclusivas para cada empresa parceira, em compliance com leis vigentes."
        },
        {
          title: "Segurança Lógica Integrada",
          text: "Proteções avançadas que autenticam o progresso real de cada lição, eliminando fraudes de pontuação de forma autônoma."
        },
        {
          title: "Painel Analítico para Gestão",
          text: "Monitore a taxa de conclusão de cursos e o fluxo financeiro de investimento de forma visual, transparente e estruturada."
        },
        {
          title: "Identidade Customizável",
          text: "Alinhe as cores, termos e comunicação visual para incorporar a experiência ao portal corporativo e à cultura do seu negócio."
        }
      ]
    },
    faq: {
      title: "Perguntas de Alto Impacto",
      desc: "Esclarecemos de forma transparente como redefinimos a cultura de desenvolvimento de pessoal com foco em valor real.",
      items: [
        {
          question: "Como as recompensas físicas são distribuídas? O RH assume obrigações logísticas?",
          answer: "O RH possui esforço operacional zero. Toda a dinâmica é automatizada pela Pontufy. A emissão de vales digitais legítimos é efetuada por meio de conexão direta com grandes parceiros comerciais (Amazon, Magalu, Mercado Livre). O profissional seleciona o item, confirma e obtém o código instantaneamente no painel para usá-lo como quiser."
        },
        {
          question: "Como o Pontufy constrói patrimônio real e duradouro para o colaborador?",
          answer: "Acreditamos que o conhecimento adquirido e os frutos do esforço diário pertencem legitimamente a quem aprende. Caso o profissional mude de organização no futuro, o histórico de conquistas, certificados emitidos e o portfólio de competências validadas continuam registrados em seu perfil Pontufy, servindo como uma prova portátil de competência profissional ao longo de sua trajetória de vida."
        },
        {
          question: "A arquitetura de dados protege a privacidade corporativa e dos colaboradores?",
          answer: "Sim, absolutamente. Desenhamos nossa infraestrutura sob premissas severas de isolamento Multitenant e arquitetura Zero Trust. Os registros de cada parceiro de negócios permanecem sob chaves de criptografia exclusivas em partições segregadas logicamente, garantindo conformidade impecável com as exigências da LGPD."
        },
        {
          question: "De que maneira a inteligência define a trajetória de desenvolvimento contínuo?",
          answer: "A IA do Pontufy não cria apenas cursos isolados. Ela analisa o contexto de atuação da empresa, a maturidade profissional de cada colaborador e desenha uma jornada adaptativa contínua. Os módulos acompanham de perto os momentos profissionais, cobrindo desde a integração de boas-vindas do primeiro dia até complexos desafios de tomada de decisão executiva."
        }
      ]
    },
    footer: {
      zeroTrustActive: "Arquitetura Zero Trust Ativa",
      copyright: "© 2026 Mestry's Tecnologia e Consultoria em TI LTDA. Todos os direitos reservados.",
      subCopyright: "Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP"
    }
  },
  "EN-US": {
    header: {
      howItWorks: "Continuous Path",
      aiSimulator: "Module Simulator",
      rewards: "Currency of Trust",
      security: "Enterprise Architecture",
      faq: "High-Impact Questions",
      viewDemo: "Test Simulator",
      login: "Sign In"
    },
    hero: {
      badge: "Building Career Equity Through Radical Transparency",
      title: "Training programs that people ",
      titleAccent: "actually want to finish.",
      titleEnd: " Knowledge that builds real value.",
      desc: "Traditional corporate training fails because it feels like a boring, check-the-box chore. Pontufy completely changes this dynamic: we transform continuous education into an act of self-empowerment. The company funds growth (B2B), and the employee gains true ownership of their progress (2C). This radical transparency builds unprecedented trust, creating portable career equity that stays with the professional wherever their journey leads.",
      formTitle: "Build a Strong Partnership",
      formSub: "Submit your corporate contact details to receive a customized financial simulation for your workforce.",
      labelEmail: "Your Corporate Email",
      labelRole: "Your Leadership Position",
      labelSize: "Employee Count",
      roleOptions: {
        default: "Select your role...",
        hrDirector: "HR Director or Head of Human Resources",
        ldManager: "L&D or Training Manager",
        ceo: "CEO, Founder, or Managing Partner",
        opsManager: "Operations or Commercial Manager",
        others: "Other Executive Role"
      },
      sizeOptions: {
        default: "Select company size...",
        micro: "Up to 50 employees in growth phase",
        small: "From 51 to 200 employees",
        medium: "From 201 to 1000 employees",
        large: "Over 1000 employees at enterprise scale"
      },
      btnSubmit: "Schedule Demo & Simulate ROI",
      disclaimer: "Data security guaranteed under strict compliance guidelines.",
      successTitle: "Channel Opened Successfully!",
      successDesc: "We will contact you in less than one business hour to demonstrate how your organization can drive sustainable operational engagement.",
      successTipTitle: "Next Step on the Panel",
      successTipText: "Use the dynamic simulator below to experience how our intelligence drafts specific modules and enables direct point redemptions.",
      successBtn: "Go to Active Simulator"
    },
    connectivity: {
      title: "Direct Connection Between Learning and Value",
      desc: "The intellectual achievements of your workforce are logged in real time and converted into tangible point balances for immediate redemption.",
      labelAI: "Structural Automation",
      labelRH: "Zero Logistics Overhead"
    },
    howItWorks: {
      badge: "Continuous Evolution",
      title: "How Pontufy Builds the Career of Tomorrow?",
      desc: "A dynamic framework founded on mutual empowerment, transparent trajectories, and professional respect from Day 1.",
      steps: [
        {
          num: "01",
          title: "Dynamic Mapping",
          text: "Our educational engine charts continuous, customized training trajectories for every industry sector, guiding the employee from onboarding to leadership positions."
        },
        {
          num: "02",
          title: "Active Learning",
          text: "Employees solve real-world daily challenges through engaging micro-lessons. Every correct answer validates new skills and builds real balances."
        },
        {
          num: "03",
          title: "Portable Equity",
          text: "All achievements and earned balances are recorded in a secure, immutable ledger. The knowledge acquired belongs to the professional, building portable career equity."
        },
        {
          num: "04",
          title: "Real Rewards",
          text: "Balances convert directly into digital vouchers from major retailers (Amazon, Magalu, Mercado Livre). The professional reaps the fruits of their hard work with no HR hassle."
        }
      ]
    },
    simulator: {
      badge: "Educational Intelligence",
      title: "Model Training Journeys in Seconds",
      desc: "Select an industry vertical below to see how our intelligence compiles a dynamic training module focused on practical daily scenarios.",
      labelSelectSector: "Select Industry Sector",
      btnSimulate: "Generate Learning Module",
      btnSimulating: "Formulating Educational Path...",
      steps: [
        "🧠 Identifying strategic demands for the selected industry vertical...",
        "🛡️ Applying logical multitenant container boundaries for records protection...",
        "🎮 Structuring practical scenarios for professional competence check...",
        "✨ Pontufy learning unit generated with focus on actual real-world skills!"
      ],
      placeholderTitle: "Knowledge Generation Simulator",
      placeholderDesc: "Pick one of the business verticals on the left to test how we shape high-quality contents tailored for real enterprise routines.",
      badgeGenerated: "Module Generated Successfully",
      titleQuiz: "Practical Scenario & Validation:",
      infoSelectAnswer: "Select the most professional conduct to proceed",
      btnConfirm: "Confirm Strategic Conduct",
      correctTitle: "🎉 Excellent Performance!",
      correctPoints: "+100 Points Registered in your Portable Ledger",
      incorrectTitle: "❌ Professional Review Advised",
      incorrectText: "Analyze the situation with more scrutiny and generate another scenario to reinforce your understanding.",
      btnGenerateOther: "Generate Another Scenario",
      industries: {
        tech: {
          id: "tech",
          name: "Technology & Cybersec",
          icon: "💻",
          tagline: "Risk Mitigation & Privilege Management",
          lesson: {
            title: "Mitigating Social Engineering Attack Vectors",
            content: "Social engineering bypasses network firewalls by exploiting human trust. The true security perimeter lies not in hardware configuration, but in the continuous awareness of those handling operational dashboards daily.",
            quiz: {
              question: "When contacted unexpectedly in internal communication channels requesting emergency token bypass, which action shows peak security maturity?",
              options: [
                "Provide the token based on the sender's promise to submit a formal support ticket later",
                "Deny the request, open an official incident log, and initiate the Zero Trust dual-confirmation verification",
                "Provide a partial access code to prevent blocking the other team's urgent operational workflow",
                "Delete the message and ignore the occurrence to avoid administrative logs with the security team"
              ],
              correctIndex: 1,
              explanation: "Isolating the suspect account and following Zero Trust principles prevents lateral privilege escalations efficiently."
            },
            points: 100
          }
        },
        health: {
          id: "health",
          name: "Healthcare & Patient Safety",
          icon: "🏥",
          tagline: "Clinical Records Protection & Safe Asepsis",
          lesson: {
            title: "Asepsis Guidelines for Shared Clinical Terminals",
            content: "Medical tablets and electronic chart systems shared between hospital staff can harbor pathogens. Routine sanitization with safe products prevents cross-infection, securing client well-being.",
            quiz: {
              question: "What is the correct sanitization protocol for mobile health record devices in active clinic environments?",
              options: [
                "Perform device cleaning on a bi-weekly basis using standard dry paper towels",
                "Sanitize devices with 70% isopropyl alcohol before and after each patient consultation",
                "Wipe screens down only when visible liquid spots or dirt patterns appear on the screen",
                "Skip sanitizing the physical screen if the practitioner is already wearing clinical gloves"
              ],
              correctIndex: 1,
              explanation: "Systematic sterilization between patient ward rounds halts pathogen vector transmissions at enterprise standards."
            },
            points: 100
          }
        },
        retail: {
          id: "retail",
          name: "Retail & Consultative Sales",
          icon: "🛍️",
          tagline: "Consultative Upgrades & Customer Trust",
          lesson: {
            title: "Client-Centric Upsell and Recommendation Strategy",
            content: "Proposing complementary products must serve the consumer's genuine convenience. Suggesting accessories that do not exceed 30% of the main purchase value maintains brand integrity and buyer trust.",
            quiz: {
              question: "A client buys a professional camera for digital content creation. Which upsell action represents a consultative relationship?",
              options: [
                "Bundle an expensive system warranty plan that the buyer has already explicitly declined",
                "Propose a high-speed storage memory card and an impact-resistant padded carrying bag",
                "Conclude the purchase immediately without suggesting essential operational accessories",
                "Substitute the chosen camera with a cheaper version to pad the cart with unnecessary cables"
              ],
              correctIndex: 1,
              explanation: "Immediate protection and storage accessories complement the main purchase naturally and fulfill immediate client needs."
            },
            points: 100
          }
        },
        manufacturing: {
          id: "manufacturing",
          name: "Logistics & Industrial Safety",
          icon: "⚙️",
          tagline: "Workplace Prevention & Ergonomic Guidelines",
          lesson: {
            title: "Industrial Ergonomics in Manual Handling Operations",
            content: "Improper manual handling of bulky materials leads to chronic joint strain. Respecting safe load limits and using pneumatic crane supports are vital to maintain team health and operational productivity.",
            quiz: {
              question: "When handling a warehouse payload that exceeds the standard safe ergonomic lifting limit of 23 kg, what is the correct safety protocol?",
              options: [
                "Lift the payload quickly utilizing the concentrated strength of the lumbar spine",
                "Apply mechanical hoists, pneumatic lifters, or request a joint lift with another operator",
                "Pivot the box using one-sided shoulder leverage to balance the weight bias",
                "Delegate the heavy manual haul to an apprentice to maintain high station output"
              ],
              correctIndex: 1,
              explanation: "Utilizing mechanical crane hoists or team lifters neutralizes joint impact, driving workplace injuries down to zero."
            },
            points: 100
          }
        }
      }
    },
    showcase: {
      badge: "Employee Sovereignty",
      title: "The Currency of Trust Converted to Physical Assets",
      desc: "Earned training points on Pontufy do not expire and are not locked behind empty promises. They translate directly into digital vouchers from top national e-commerce channels, giving employees absolute freedom of choice.",
      catalogTitle: "Transparent Claims Catalog",
      catalogDesc: "Select a digital voucher below to simulate transactional point ledger deduction and electronic voucher delivery.",
      labelBalance: "Your Active Portable Balance",
      subBalance: "Your points are a secure asset reflecting your corporate achievements",
      confirmTitle: "Confirm Redemptions",
      confirmText: "You are about to convert your accumulated points into a digital voucher from {name} valued at {value}.",
      costLabel: "Points Required:",
      balanceLabel: "Your Current Balance:",
      btnRedeem: "Confirm Point Conversion",
      processingBanner: "VALIDATING COMPLIANCE SCHEMAS",
      steps: [
        "🔒 Validating secure cryptographic signatures of training records...",
        "🛡️ Verifying module completion hashes conform to internal audit policies...",
        "📊 Deducting points directly from the transactional ledger in real time...",
        "🎟️ Synthesizing active digital claim code via integrated retail vendor API..."
      ],
      successTitle: "Conversion Approved!",
      successDesc: "Cryptographic check passed. Balance successfully deducted from your ledger and claim code generated.",
      voucherTitle: "Digital Voucher Code",
      voucherSub: "Apply this digital code at the partner's official checkout screen",
      btnNewRedeem: "Simulate Another Redemption",
      rewards: {
        amazon_50: {
          id: "amazon_50",
          name: "Amazon Gift Card",
          logo: "📦",
          color: "bg-orange-50 text-orange-600",
          requiredPoints: 500,
          value: "$10.00 USD",
          gradient: "from-orange-500 to-amber-400"
        },
        magalu_100: {
          id: "magalu_100",
          name: "Magalu Digital",
          logo: "💙",
          color: "bg-blue-50 text-blue-600",
          requiredPoints: 1000,
          value: "$20.00 USD",
          gradient: "from-blue-600 to-sky-400"
        },
        mercadolivre_150: {
          id: "mercadolivre_150",
          name: "Mercado Libre Card",
          logo: "🤝",
          color: "bg-yellow-50 text-yellow-700",
          requiredPoints: 1500,
          value: "$30.00 USD",
          gradient: "from-yellow-400 to-amber-300"
        },
        shopee_50: {
          id: "shopee_50",
          name: "Shopee Voucher",
          logo: "🧡",
          color: "bg-red-50 text-red-600",
          requiredPoints: 500,
          value: "$10.00 USD",
          gradient: "from-red-500 to-orange-400"
        }
      }
    },
    security: {
      badge: "Enterprise Backbone",
      title: "Strict Multitenant Logical Segregation & Zero Trust Principles",
      desc: "Pontufy protects each corporate client's ecosystem using strict tenant isolation, end-to-end data encryption, and automated cryptographic ledger auditing. Privacy is treated as an unbreakable cornerstone.",
      benefits: [
        {
          title: "Cryptographic Tenant Isolation",
          desc: "Each corporate client operates under exclusive symmetric keys and logically partitioned database segments to rule out leaks."
        },
        {
          title: "Continuous Automated Audits",
          desc: "Every educational advancement compiles cryptographic signature hashes, shielding the system from illegitimate scoring modifications."
        },
        {
          title: "Zero Trust Claims Engine",
          desc: "Redeeming any asset requires short-term token handshakes to block unauthorized use or compromised sessions."
        }
      ],
      consoleTitle: "PONTUFY_SECURITY_LEDGER",
      zeroTrustShield: "Zero Trust Active Shield",
      enabled: "SYSTEM REINFORCED",
      disabled: "VULNERABILITY DETECTED",
      integrityLabel: "Point Ledger",
      auditsLabel: "Analytics",
      auditsValue: "ACTIVE",
      logs: {
        authSuccess: "Tenant {tenant} verified. Exclusive cryptographic container active.",
        integrityCheck: "Scolarship ledger audit finished. 0 discrepancies or unauthorized edits.",
        gatewayHealth: "Retail vendor API hooks reporting steady latency across all nodes.",
        courseGenRequest: "Initializing dynamic vertical learning module setup for: {sector}",
        courseGenSuccess: "Interactive scenario '{title}' isolated on dedicated corporate partitions.",
        quizAnswerCorrect: "Authentic quiz resolution logged for scenario '{title}'. +100 Points authorized.",
        quizAnswerIncorrect: "Incorrect response recorded for scenario '{title}'. Point balance remained steady.",
        redeemFailed: "Redemption blocked. Points balance ({points} pts) insufficient for {reward} ({req} pts).",
        redeemRequested: "Gift claim request received for {reward} ({value}). Running ledger audit...",
        redeemSuccess: "Ledger checked. Claim voucher {reward} generated under safety token {code}. -{points} pts.",
        zeroTrustToggled: "Defense settings adjusted to {state} by network administrator.",
        tenantChanged: "Auditing compliance schemas of corporate tenant: {tenant}"
      }
    },
    matrix: {
      badge: "Human-Focused Enterprise SaaS",
      title: "Building Respectful and Sustainable Workplace Cultures",
      desc: "Our technology works quietly behind the scenes to ensure employee training is highly rewarding, engaging, and professional.",
      learnMore: "Review technical whitepaper",
      cards: [
        {
          title: "Highly Contextual Training Modules",
          text: "Intelligent, industry-relevant training content crafted for daily workforce routines. No tedious lectures or corporate filler."
        },
        {
          title: "Real Reward Equity",
          text: "Effort valued equals talent retained. Employees harvest real, physical vouchers from major national brands for their milestones."
        },
        {
          title: "Coded Tenant Isolation",
          text: "Database tables strictly sealed with individual encryption keys per business partner, exceeding standard compliance protocols."
        },
        {
          title: "Inherent Point Security",
          text: "System-level validations confirm authentic learning achievements, stopping scoring leaks without manual inspections."
        },
        {
          title: "Executive Analytics Dashboard",
          text: "Track module completion rates, team progress, and investment returns visually, through transparent, structured metrics."
        },
        {
          title: "Tailored White-Label Shell",
          text: "Adapt system branding, typography, and layout options to fit your internal corporate communications and organizational design."
        }
      ]
    },
    faq: {
      title: "High-Impact Questions",
      desc: "Answering critical questions about how we redefine employee training and build genuine professional engagement.",
      items: [
        {
          question: "How are the rewards distributed? Is there manual work for HR?",
          answer: "Absolutely zero administrative burden. The entire process is automated. Claimed vouchers are generated digitally through direct API connections with top brands (Amazon, Magalu). The employee confirms points and gets the claim code instantly to buy anything they like."
        },
        {
          question: "How does Pontufy build real, portable equity for the professional?",
          answer: "We believe a professional's achievements belong strictly to them. If they transition to a different company later, their educational accomplishments, digital certificates, and career points continue with them in their personal Pontufy portfolio, acting as verified portable proof of skill."
        },
        {
          question: "Does the architecture safeguard sensitive organizational data?",
          answer: "Absolutely. Pontufy is engineered with strict logical separation per tenant and built on zero trust access policies. Each corporate workspace relies on individual database keys, making data breaches mathematically improbable and keeping you fully GDPR-compliant."
        },
        {
          question: "How does the engine construct continuous development paths?",
          answer: "Our engine maps organizational goals with individual progress. Instead of sending out repetitive yearly tests, it adapts material in real time, building a continuous learning path covering onboarding, core processes, up to leadership transition strategies."
        }
      ]
    },
    footer: {
      zeroTrustActive: "Zero Trust Active Shield",
      copyright: "© 2026 Mestry's Tecnologia e Consultoria em TI LTDA. All rights reserved.",
      subCopyright: "Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP, Brazil"
    }
  },
  "ES-LA": {
    header: {
      howItWorks: "Trayectoria Continua",
      aiSimulator: "Simulador de Módulos",
      rewards: "Moneda de Confianza",
      security: "Arquitectura Corporativa",
      faq: "Preguntas de Impacto",
      viewDemo: "Probar Simulador",
      login: "Ingresar a la Plataforma"
    },
    hero: {
      badge: "Construyendo Patrimonio de Carrera con Transparencia Radical",
      title: "Capacitaciones que las personas ",
      titleAccent: "realmente quieren terminar.",
      titleEnd: " El conocimiento que genera valor real.",
      desc: "Los cursos corporativos tradicionales fracasan porque se perciben como tareas obligatorias y aburridas. Pontufy redefine esta relación a través de un puente de valor mutuo: la empresa invierte en el desarrollo de sus equipos (B2B) y el colaborador conquista el conocimiento y puntos reales que son suyos por derecho (2C). El valor generado permanece con el profesional como patrimonio portátil de su carrera, consolidando una relación de confianza inédita.",
      formTitle: "Abra el Camino para una Alianza Sólida",
      formSub: "Deje sus datos de contacto empresarial para recibir una simulación financiera personalizada para su equipo hoy mismo.",
      labelEmail: "Su Correo Corporativo",
      labelRole: "Su Posición de Liderazgo",
      labelSize: "Cantidad de Colaboradores",
      roleOptions: {
        default: "Seleccione su rol...",
        hrDirector: "Director o Head de Recursos Humanos",
        ldManager: "Gerente de Capacitación y Desarrollo",
        ceo: "CEO, Fundador o Socio Director",
        opsManager: "Gerente Operativo o Comercial",
        others: "Otro Cargo Ejecutivo"
      },
      sizeOptions: {
        default: "Seleccione el tamaño de la empresa...",
        micro: "Hasta 50 colaboradores en crecimiento",
        small: "De 51 a 200 colaboradores",
        medium: "De 201 a 1000 colaboradores",
        large: "Más de 1000 colaboradores a gran escala"
      },
      btnSubmit: "Agendar Demostración y Simular Retorno",
      disclaimer: "Seguridad de datos garantizada bajo estrictas normativas vigentes.",
      successTitle: "¡Canal de Comunicación Abierto!",
      successDesc: "Nos pondremos en contacto en menos de una hora comercial para presentarle cómo su organización puede impulsar el compromiso operativo de forma sostenible.",
      successTipTitle: "Próximo Paso en el Panel",
      successTipText: "Use el simulador interactivo abajo para probar cómo la inteligencia crea módulos específicos y permite el canje directo de puntos.",
      successBtn: "Ir al Simulador Activo"
    },
    connectivity: {
      title: "Conexión Directa entre Conocimiento y Valor",
      desc: "Los logros intelectuales de los colaboradores son registrados en tiempo real y convertidos en saldo físico para canjes, con auditoría de seguridad inmediata.",
      labelAI: "Automatización Estructural",
      labelRH: "Cero Esfuerzo Logístico"
    },
    howItWorks: {
      badge: "Evolución Continua",
      title: "¿Cómo Pontufy Construye la Carrera del Mañana?",
      desc: "Una trayectoria dinámica fundamentada en el empoderamiento mutuo y en la transparencia desde el primer día.",
      steps: [
        {
          num: "01",
          title: "Mapeo Dinámico",
          text: "El motor de aprendizaje diseña trayectorias continuas de capacitación a medida para cada sector, acompañando al profesional desde la inducción inicial hasta posiciones de alto liderazgo."
        },
        {
          num: "02",
          title: "Educación Activa",
          text: "Los colaboradores resuelven desafíos reales del cotidiano de la empresa a través de micro-lecciones interactivas. Cada acierto valida nuevas habilidades y acumula saldo."
        },
        {
          num: "03",
          title: "Patrimonio Portátil",
          text: "Toda conquista y saldo acumulado se registran en un libro mayor blindado. El conocimiento adquirido pertenece íntegramente al profesional, generando equity de carrera sostenible."
        },
        {
          num: "04",
          title: "Premio Físico",
          text: "El saldo se convierte directamente en vales de compra digitales (Amazon, Magalu, Mercado Livre). El profesional cosecha el fruto de su esfuerzo sin ninguna carga operativa para el área de RRHH."
        }
      ]
    },
    simulator: {
      badge: "Inteligencia Educativa",
      title: "Diseñe Rutas de Aprendizaje en Segundos",
      desc: "Seleccione un sector empresarial abajo para ver cómo nuestra inteligencia formula un módulo de capacitación dinámico enfocado en escenarios prácticos de la vida corporativa real.",
      labelSelectSector: "Seleccione el Sector de la Empresa",
      btnSimulate: "Generar Módulo de Aprendizaje",
      btnSimulating: "Formulando Ruta Educativa...",
      steps: [
        "🧠 Identificando demandas estratégicas del sector seleccionado...",
        "🛡️ Aplicando aislamiento lógico multitenant para la protección de datos...",
        "🎮 Estructurando el cuestionario práctico de validación de competencias...",
        "✨ Ruta Pontufy generada con enfoque en aprendizaje real!"
      ],
      placeholderTitle: "Simulador de Generación de Conocimiento",
      placeholderDesc: "Seleccione una vertical de negocios a la izquierda para probar cómo estructuramos contenidos centrados en escenarios empresariales prácticos y reales.",
      badgeGenerated: "Módulo Generado con Éxito",
      titleQuiz: "Escenario Práctico y Validación:",
      infoSelectAnswer: "Seleccione la conducta más adecuada para continuar",
      btnConfirm: "Confirmar Conducta Estratégica",
      correctTitle: "🎉 ¡Desempeño Excelente!",
      correctPoints: "+100 Puntos Registrados en su Libro Mayor",
      incorrectTitle: "❌ Ajuste de Conducta Requerido",
      incorrectText: "Evalúe el caso con más criterio y genere un nuevo módulo para reforzar el conocimiento aprendido.",
      btnGenerateOther: "Generar Nuevo Escenario Práctico",
      industries: {
        tech: {
          id: "tech",
          name: "Tecnología & Ciberseguridad",
          icon: "💻",
          tagline: "Mitigación de Riesgos & Gestión de Privilegios",
          lesson: {
            title: "Mitigación Activa de Ataques de Ingeniería Social",
            content: "La ingeniería social busca vulnerar barreras digitales explotando el comportamiento humano. El verdadero perímetro de seguridad no está en las configuraciones técnicas de la red, sino en la atención continua de quienes operan los paneles de control.",
            quiz: {
              question: "Al detectar un mensaje sospechoso en canales de comunicación interna que solicita un token de acceso rápido, ¿qué conducta demuestra madurez en seguridad?",
              options: [
                "Proporcionar el token con el compromiso de que se abrirá el ticket formal de soporte técnico más tarde",
                "Rechazar la solicitud, abrir un informe de incidente oficial y activar el protocolo Zero Trust de doble confirmación",
                "Enviar un código de acceso parcial para evitar detener las tareas urgentes de la otra área",
                "Eliminar el mensaje y no reportar el caso para evitar procesos administrativos con el área de infraestructura"
              ],
              correctIndex: 1,
              explanation: "Aislar la sesión de origen sospechoso y seguir el protocolo de seguridad Zero Trust frena el escalamiento lateral de privilegios de forma exitosa."
            },
            points: 100
          }
        },
        health: {
          id: "health",
          name: "Salud & Excelencia Clínica",
          icon: "🏥",
          tagline: "Seguridad del Paciente & Assepsia Práctica",
          lesson: {
            title: "Assepsia Avanzada de Dispositivos Clínicos de Uso Compartido",
            content: "Los dispositivos médicos compartidos en el hospital pueden retener microorganismos si no se esterilizan entre turnos. La limpieza constante disminuye las infecciones cruzadas y resguarda la salud del paciente.",
            quiz: {
              question: "¿Cuál es el procedimiento correcto para sanitizar los tablets de registro médico durante las rondas de pacientes?",
              options: [
                "Limpiar los equipos cada quince días utilizando paños secos de fibra de algodón",
                "Desinfectar el tablet con alcohol isopropílico al 70% antes y después de interactuar con cada cama",
                "Limpiar la pantalla exclusivamente cuando haya suciedad o manchas líquidas evidentes",
                "Omitir el lavado de los dispositivos argumentando que el personal clínico ya usa guantes estériles"
              ],
              correctIndex: 1,
              explanation: "La esterilización sistemática entre consultas detiene la propagación de agentes patógenos con una alta efectividad operativa."
            },
            points: 100
          }
        },
        retail: {
          id: "retail",
          name: "Ventas & Expansión de Tique",
          icon: "🛍️",
          tagline: "Venta Consultiva & Relación de Confianza",
          lesson: {
            title: "Técnicas de Upsell Consultivo Enfocadas en la Utilidad",
            content: "La recomendación de productos complementarios siempre debe aumentar la utilidad de la compra del consumidor. Sugerir adiciones útiles que representen menos del 30% del valor total mantiene la confianza y lealtad a la marca.",
            quiz: {
              question: "Un cliente compra una cámara profesional para crear contenidos digitales. ¿Qué oferta complementaria representa una venta consultiva?",
              options: [
                "Presionar para incluir una garantía extendida que el cliente ya rechazó expresamente con anterioridad",
                "Ofrecer una tarjeta de memoria de alta velocidad y un estuche protector acolchado para transporte",
                "Cerrar la transacción rápidamente sin mencionar accesorios indispensables para el uso inicial de la cámara",
                "Sugerir un modelo de cámara inferior para intentar agregar cables y baterías opcionales en el tique"
              ],
              correctIndex: 1,
              explanation: "Los complementos de cuidado y resguardo de datos extienden la utilidad del producto original y satisfacen la necesidad inmediata de compra."
            },
            points: 100
          }
        },
        manufacturing: {
          id: "manufacturing",
          name: "Manufactura & Logística Eficiente",
          icon: "⚙️",
          tagline: "Cultura de Prevención & Normas de Ergonomía",
          lesson: {
            title: "Ergonomía en la Manipulación y Elevación de Carga Industrial",
            content: "Levantar de forma manual e inadecuada cargas pesadas provoca lesiones crónicas en el personal de almacén. Adoptar límites seguros de carga y emplear soportes neumáticos es indispensable para la seguridad laboral.",
            quiz: {
              question: "Al encontrarse con un cargamento que excede la capacidad de seguridad ergonómica recomendada de 23 kg, ¿cuál es el procedimiento indicado?",
              options: [
                "Llevar a cabo el levantamiento rápido de la carga haciendo palanca con los músculos de la columna",
                "Usar manipuladores neumáticos, elevadores mecánicos o realizar un levantamento grupal con otro compañero",
                "Cargar la caja de forma directa sobre un hombro para compensar el desequilibrio de peso",
                "Asignar la tarea pesada al aprendiz de turno para mantener el ritmo operativo de la estación"
              ],
              correctIndex: 1,
              explanation: "El auxilio de grúas mecánicas o levantamientos grupales elimina la presión articular, reduciendo la tasa de accidentes a cero."
            },
            points: 100
          }
        }
      }
    },
    showcase: {
      badge: "Soberanía del Colaborador",
      title: "La Moneda de Confianza Canjeada por Beneficios Reales",
      desc: "Los puntos acumulados en Pontufy no tienen vencimiento y no se desvanecen en promesas falsas. Se convierten de forma directa en vales digitales reales de las principales marcas del mercado, con absoluta autonomía para el colaborador.",
      catalogTitle: "Catálogo de Canje Transparente",
      catalogDesc: "Seleccione un beneficio digital abajo para simular el descuento automático del libro mayor corporativo y la entrega de su cupón.",
      labelBalance: "Su Saldo Portátil Disponible",
      subBalance: "Sus puntos acumulados representan un patrimonio de su trayectoria profesional",
      confirmTitle: "Confirmar Conversión",
      confirmText: "Está a punto de convertir sus puntos en un vale digital de {name} por un valor de {value}.",
      costLabel: "Puntos Necesarios:",
      balanceLabel: "Su Saldo de Puntos Actual:",
      btnRedeem: "Confirmar Conversión de Puntos",
      processingBanner: "VALIDANDO CUMPLIMIENTO REGISTRAL",
      steps: [
        "🔒 Validando firmas digitales criptográficas del progreso educativo...",
        "🛡️ Confirmando que el historial de lecciones cumple con el estándar de cumplimiento interno...",
        "📊 Descontando el saldo equivalente en el libro mayor en fracciones de segundo...",
        "🎟️ Solicitando código de activación real mediante integración con la API del comercio socio..."
      ],
      successTitle: "¡Canje Realizado con Éxito!",
      successDesc: "Los hashes han sido validados. El saldo fue actualizado en el libro mayor y su cupom real de compra se encuentra listo.",
      voucherTitle: "Código del Vale Digital",
      voucherSub: "Introduzca este código de descuento al pagar en el e-commerce oficial del comercio asociado",
      btnNewRedeem: "Simular Otro Canje",
      rewards: {
        amazon_50: {
          id: "amazon_50",
          name: "Amazon Gift Card",
          logo: "📦",
          color: "bg-orange-50 text-orange-600",
          requiredPoints: 500,
          value: "$10.00 USD",
          gradient: "from-orange-500 to-amber-400"
        },
        magalu_100: {
          id: "magalu_100",
          name: "Magalu Digital",
          logo: "💙",
          color: "bg-blue-50 text-blue-600",
          requiredPoints: 1000,
          value: "$20.00 USD",
          gradient: "from-blue-600 to-sky-400"
        },
        mercadolivre_150: {
          id: "mercadolivre_150",
          name: "Mercado Libre Card",
          logo: "🤝",
          color: "bg-yellow-50 text-yellow-700",
          requiredPoints: 1500,
          value: "$30.00 USD",
          gradient: "from-yellow-400 to-amber-300"
        },
        shopee_50: {
          id: "shopee_50",
          name: "Shopee Cupón",
          logo: "🧡",
          color: "bg-red-50 text-red-600",
          requiredPoints: 500,
          value: "$10.00 USD",
          gradient: "from-red-500 to-orange-400"
        }
      }
    },
    security: {
      badge: "Infraestructura Corporativa",
      title: "Aislamiento Multitenant y Seguridad de Datos Rigurosa",
      desc: "Pontufy resguarda el ecosistema de cada organización a través de particiones de datos lógicas totalmente seguras, criptografía avanzada y auditorías continuas. Tratamos su privacidad con un respeto absoluto.",
      benefits: [
        {
          title: "Particionado Criptográfico",
          desc: "Cada empresa asociada opera bajo claves simétricas de encriptación únicas y aislamiento lógico absoluto de bases de datos."
        },
        {
          title: "Auditoría en Tiempo Real",
          desc: "Toda interacción de aprendizaje genera hashes criptográficos que impiden de manera automatizada las inyecciones de datos ilegítimos."
        },
        {
          title: "Validaciones Zero Trust",
          desc: "El canje de cualquier recompensa requiere verificaciones multifactoriales instantáneas para impedir desvíos o compromisos de cuentas."
        }
      ],
      consoleTitle: "PONTUFY_SECURITY_LEDGER",
      zeroTrustShield: "Zero Trust Active Shield",
      enabled: "SISTEMA SEGURO",
      disabled: "VULNERABILIDAD DETECTADA",
      integrityLabel: "Libro Mayor",
      auditsLabel: "Auditorías",
      auditsValue: "ACTIVA",
      logs: {
        authSuccess: "Tenant {tenant} verificado. Llave criptográfica exclusiva activa.",
        integrityCheck: "Inspección sistemática terminada en el libro mayor. Cero anomalías encontradas.",
        gatewayHealth: "Conexiones de red con los comercios asociados reportando estabilidad total en cada nodo.",
        courseGenRequest: "Iniciando proceso de creación de escenario de capacitación para: {sector}",
        courseGenSuccess: "Módulo dinámico '{title}' aislado de forma lógica en la base del cliente.",
        quizAnswerCorrect: "Resolución de escenario '{title}' validada de manera correcta. +100 Puntos autorizados.",
        quizAnswerIncorrect: "Respuesta incorrecta detectada para el escenario '{title}'. Saldo de puntos mantenido estático.",
        redeemFailed: "Conversión de puntos bloqueada. Saldo actual ({points} pts) insuficiente para {reward} ({req} pts).",
        redeemRequested: "Solicitud de canje de {reward} ({value}) recibida. Iniciando auditoría sistemática de hashes...",
        redeemSuccess: "Valores validados. Vale {reward} emitido bajo código seguro {code}. -{points} pts.",
        zeroTrustToggled: "Configuraciones de protección de red actualizadas a {state}.",
        tenantChanged: "Auditando las particiones y registros del tenant empresarial asociado: {tenant}"
      }
    },
    matrix: {
      badge: "SaaS Empresarial con Sentido Humano",
      title: "Fomentando Relaciones Laborales de Confianza Mútua",
      desc: "Nuestra tecnología opera para que el camino de desarrollo del colaborador sea respetuoso, gratificante y de gran valor a largo plazo.",
      learnMore: "Ver detalles técnicos",
      cards: [
        {
          title: "Trilhas de Aprendizaje Diseñadas con IA",
          text: "Módulos de capacitación enfocados puramente en la vida real de la empresa, sin sermones teóricos inútiles ni rellenos didácticos."
        },
        {
          title: "Equity de Carrera Portátil",
          text: "El esfuerzo dedicado se respeta. El colaborador acumula saldo tangible que se traduce directamente en premios de marcas líderes."
        },
        {
          title: "Aislamiento Multitenant Absoluto",
          text: "Particiones de bases de datos blindadas individualmente para cada empresa, superando los requerimientos estándar de ciberseguridad."
        },
        {
          title: "Validación de Logros Inherentemente Segura",
          text: "Procesos que auditan automáticamente que el avance de cada lección sea real, neutralizando los fraudes de acumulación de puntos."
        },
        {
          title: "Métricas Avanzadas para el Liderazgo",
          text: "Monitoree el porcentaje de finalización de cursos de sus equipos y los flujos financieros de inversión de forma transparente."
        },
        {
          title: "Identidad Corporativa Adaptable",
          text: "Personalice logotipos, tipografías y colores para incorporar la experiencia con total naturalidad al portal corporativo de su marca."
        }
      ]
    },
    faq: {
      title: "Preguntas de Impacto",
      desc: "Resolvemos de manera directa cómo transformamos el desarrollo de equipos centrándolo en el valor real y duradero.",
      items: [
        {
          question: "¿Cómo se entregan los vales de compra reales? ¿RRHH asume gestiones logísticas?",
          answer: "Absolutamente cero esfuerzo para RRHH. Todo se encuentra automatizado a través de nuestra API nativa integrada con grandes comercios (Amazon, Magalu). El profesional realiza el canje con sus puntos acumulados y obtiene su código electrónico de forma instantánea para usarlo libremente."
        },
        {
          question: "¿De qué forma Pontufy genera un patrimonio de carrera portátil para el colaborador?",
          answer: "Creemos que el conocimiento de un colaborador y los frutos de su esfuerzo le pertenecen de forma inalienable. Si decide cambiar de empresa en el futuro, su portafolio de lecciones completadas, certificaciones obtenidas y sus puntos de carrera Pontufy lo acompañan en su cuenta personal como prueba fehaciente de su competencia."
        },
        {
          question: "¿La arquitectura tecnológica resguarda la privacidad de la empresa?",
          answer: "Por supuesto. Nuestra infraestructura se rige bajo premissas de aislamiento lógico Multitenant y arquitecturas Zero Trust. Los datos de cada empresa cliente permanecen encriptados bajo llaves únicas y segregados de forma física para descartar cualquier fuga de datos."
        },
        {
          question: "¿Cómo determina la inteligencia las rutas continuas de aprendizaje?",
          answer: "Nuestra IA no produce cursos desconectados. Analiza los objetivos operativos del negocio, el perfil individual del colaborador y modela una trayectoria interactiva adaptativa y continua, abarcando desde la inducción inicial hasta estrategias ejecutivas de toma de decisiones."
        }
      ]
    },
    footer: {
      zeroTrustActive: "Aislamiento Zero Trust Activo",
      copyright: "© 2026 Mestry's Tecnologia e Consultoria em TI LTDA. Todos los derechos reservados.",
      subCopyright: "Rua Pais Leme, 215, Conj 1713, Pinheiros, São Paulo/SP, Brasil"
    }
  }
};
