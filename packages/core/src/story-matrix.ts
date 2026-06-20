// Story Matrix Engine - Coração do produto BrandFlow
// DECISÃO: Estrutura fixa, tema muda. Fonte única de verdade (CLAUDE.md 5)

// ============================================================================
// TIPOS
// ============================================================================

export interface Restaurant {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  open_hour: number;
  close_hour: number;
  timezone: string;
}

export interface StoryTask {
  tenant_id: string;
  restaurant_id: string;
  scheduled_for: string; // ISO timestamp UTC
  week_of_month: number; // 1-4
  weekday: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number; // 15-23
  theme: string;
  title: string;
  instructions: string;
}

export interface StorySlot {
  hour: number;
  name: string;
}

export interface StoryTheme {
  week: number;
  name: string;
  daily_themes: Record<number, string>; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface StoryContent {
  title: string;
  instructions: string;
}

// ============================================================================
// 9 SLOTS FIXOS (15h→23h) - Estrutura imutável do dia
// ============================================================================

export const FIXED_SLOTS: StorySlot[] = [
  { hour: 15, name: 'Movimento' },
  { hour: 16, name: 'História' },
  { hour: 17, name: 'Preparação' },
  { hour: 18, name: 'Aberto' },
  { hour: 19, name: 'Primeiros pedidos' },
  { hour: 20, name: 'Produção' },
  { hour: 21, name: 'Prova social' },
  { hour: 22, name: 'Escassez' },
  { hour: 23, name: 'Encerramento' },
];

// ============================================================================
// 4 SEMANAS DE ROTAÇÃO DE TEMAS
// DECISÃO: Nunca repete o tema no mês; repete o ciclo no mês seguinte
// ============================================================================

export const WEEK_THEMES: StoryTheme[] = [
  {
    week: 1,
    name: 'Operação por dia',
    daily_themes: {
      0: 'Família', // Domingo
      1: 'Bastidores', // Segunda
      2: 'Produto', // Terça
      3: 'Prova Social', // Quarta
      4: 'Experiência', // Quinta
      5: 'Alta Demanda', // Sexta
      6: 'Evento', // Sábado
    },
  },
  {
    week: 2,
    name: 'Pessoas',
    daily_themes: {
      0: 'História da Empresa', // Domingo
      1: 'Conheça a Cozinha', // Segunda
      2: 'O Chapeiro', // Terça
      3: 'O Atendente', // Quarta
      4: 'O Gerente', // Quinta
      5: 'Os Entregadores', // Sexta
      6: 'Cultura da Equipa', // Sábado
    },
  },
  {
    week: 3,
    name: 'Autoridade',
    daily_themes: {
      0: 'Tempo Médio', // Domingo
      1: 'Ingredientes Premium', // Segunda
      2: 'Higiene', // Terça
      3: 'Controle de Qualidade', // Quarta
      4: 'Receitas Exclusivas', // Quinta
      5: 'Nº de Clientes', // Sexta
      6: 'Diferenciais', // Sábado
    },
  },
  {
    week: 4,
    name: 'Conversão',
    daily_themes: {
      0: 'Melhor Semana', // Domingo
      1: 'Oferta do Dia', // Segunda
      2: 'Combo do Dia', // Terça
      3: 'Mais Vendido', // Quarta
      4: 'Mais Lucrativo', // Quinta
      5: 'Favorito dos Clientes', // Sexta
      6: 'Desafio da Equipa', // Sábado
    },
  },
];

// ============================================================================
// MATRIZ COMPLETA: slot × tema → { title, instructions } ricos
// DECISÃO: Nunca "faz story agora" - instrução rica e contextual
// ============================================================================

const STORY_CONTENT: Record<
  string,
  Record<
    string,
    {
      title: string;
      instructions: string;
    }
  >
> = {
  // Semana 1: Operação por dia
  'Bastidores': {
    Movimento: {
      title: 'Câmara cheia: veja o que entra!',
      instructions:
        'Faz story AGORA: mostra a câmara de refrigeração com a reposição dos ingredientes. Grava 5s, close no conteúdo fresco.',
    },
    História: {
      title: 'Onde tudo começa: a organização',
      instructions:
        'Faz story AGORA: mostra a organização dos ingredientes antes do serviço. Grava 5s, close nas etiquetas/organização.',
    },
    Preparação: {
      title: 'Pré-preparo em ação',
      instructions:
        'Faz story AGORA: mostra a equipa a preparar as bases. Grava 5s, close na técnica de preparo.',
    },
    Aberto: {
      title: 'Portas abertas: estamos prontos!',
      instructions:
        'Faz story AGORA: mostra o restaurante limpo e pronto para receber. Grava 5s, close no ambiente.',
    },
    'Primeiros pedidos': {
      title: 'Primeira venda do dia!',
      instructions:
        'Faz story AGORA: mostra a tela com o primeiro pedido ou o primeiro cliente a entrar. Grava 3s, celebrate moment.',
    },
    Produção: {
      title: 'Cozinha a mil por hora',
      instructions:
        'Faz story AGORA: mostra a cozinha em movimento. Grava 5s, close na fritura ou preparo de prato.',
    },
    'Prova social': {
      title: 'Primeiros feedbacks',
      instructions:
        'Faz story AGORA: mostra clientes a comerem ou a caminho de embalar. Grava 5s, close na felicidade.',
    },
    Escassez: {
      title: 'Vai acabando o produto do dia',
      instructions:
        'Faz story AGORA: mostra a panela meio vazia ou a lista reduzida. Grava 3s, urgency tone.',
    },
    Encerramento: {
      title: 'Bom descanso, até amanhã!',
      instructions:
        'Faz story AGORA: mostra a equipa a arrumar ou o "fechado" na porta. Grava 5s, peaceful close.',
    },
  },
  Produto: {
    Movimento: {
      title: 'Chegada dos produtos frescos',
      instructions:
        'Faz story AGORA: mostra as caixas dos fornecedores a chegar. Grava 5s, close na frescura.',
    },
    História: {
      title: 'Origem dos ingredientes',
      instructions:
        'Faz story AGORA: mostra um ingrediente principal e conta de onde vem. Grava 5s, storytelling.',
    },
    Preparação: {
      title: 'O processo de preparo do prato',
      instructions:
        'Faz story AGORA: mostra o corte ou preparo de um ingrediente. Grava 5s, close na técnica.',
    },
    Aberto: {
      title: 'Destaques do dia',
      instructions:
        'Faz story AGORA: mostra o prato principal do dia. Grava 5s, close na apresentação.',
    },
    'Primeiros pedidos': {
      title: 'O prato mais pedido chegando!',
      instructions:
        'Faz story AGORA: mostra o prato saindo da cozinha. Grava 3s, excitement moment.',
    },
    Produção: {
      title: 'Produção do sucesso do dia',
      instructions:
        'Faz story AGORA: mostra a montagem do prato favorito. Grava 5s, close nos ingredientes.',
    },
    'Prova social': {
      title: 'Clientes a provar o destaque',
      instructions:
        'Faz story AGORA: mostra clientes a comerem o prato. Grava 5s, reaction shot.',
    },
    Escassez: {
      title: 'Últimas porções do destaque',
      instructions:
        'Faz story AGORA: mostra o prato com poucas porções restantes. Grava 3s, urgency tone.',
    },
    Encerramento: {
      title: 'Avaliação do dia: o que funcionou?',
      instructions:
        'Faz story AGORA: mostra a equipa a discutir os pratos do dia. Grava 5s, team moment.',
    },
  },
  'Prova Social': {
    Movimento: {
      title: 'A equipa pronta para servir',
      instructions:
        'Faz story AGORA: mostra a equipa uniformizada. Grava 5s, team spirit.',
    },
    História: {
      title: 'O que os clientes mais gostam',
      instructions:
        'Faz story AGORA: mostra um prato bem avaliado. Grava 5s, close na apresentação.',
    },
    Preparação: {
      title: 'Cuidado em cada detalhe',
      instructions:
        'Faz story AGORA: mostra a atenção no acabamento do prato. Grava 5s, craftsmanship.',
    },
    Aberto: {
      title: 'Já abrimos! Venha provar',
      instructions:
        'Faz story AGORA: mostra um prato pronto para servir. Grava 5s, appetizing shot.',
    },
    'Primeiros pedidos': {
      title: 'Primeira experiência do dia',
      instructions:
        'Faz story AGORA: mostra o cliente a receber o prato. Grava 3s, satisfaction moment.',
    },
    Produção: {
      title: 'Qualidade na massa',
      instructions:
        'Faz story AGORA: mostra vários pratos prontos. Grava 5s, variety shot.',
    },
    'Prova social': {
      title: 'Reações reais dos clientes',
      instructions:
        'Faz story AGORA: mostra clientes sorrindo após comer. Grava 5s, happy moment.',
    },
    Escassez: {
      title: 'Quem provar, aprova!',
      instructions:
        'Faz story AGORA: mostra o prato quase esgotado. Grava 3s, social proof.',
    },
    Encerramento: {
      title: 'Agradecimento aos clientes de hoje',
      instructions:
        'Faz story AGORA: mostra a equipa a agradecer. Grava 5s, gratitude moment.',
    },
  },
  Experiência: {
    Movimento: {
      title: 'Ambiente pronto para receber',
      instructions:
        'Faz story AGORA: mostra o restaurante arrumado. Grava 5s, inviting atmosphere.',
    },
    História: {
      title: 'O nosso ambiente: seja bem-vindo',
      instructions:
        'Faz story AGORA: mostra um cliente confortável. Grava 5s, welcoming shot.',
    },
    Preparação: {
      title: 'Detalhes que fazem a diferença',
      instructions:
        'Faz story AGORA: mostra o setup da mesa ou do balcão. Grava 5s, attention to detail.',
    },
    Aberto: {
      title: 'Venha ter a sua experiência',
      instructions:
        'Faz story AGORA: mostra o espaço convidativo. Grava 5s, welcoming vibe.',
    },
    'Primeiros pedidos': {
      title: 'Primeira experiência iniciada',
      instructions:
        'Faz story AGORA: mostra um cliente a entrar. Grava 3s, arrival moment.',
    },
    Produção: {
      title: 'A experiência está a ser servida',
      instructions:
        'Faz story AGORA: mostra pratos prontos a sair. Grava 5s, service in action.',
    },
    'Prova social': {
      title: 'Momentos felizes no nosso espaço',
      instructions:
        'Faz story AGORA: mostra clientes a desfrutar. Grava 5s, happy experience.',
    },
    Escassez: {
      title: 'Últimas oportunidades de experiência',
      instructions:
        'Faz story AGORA: mostra o espaço com poucas mesas livres. Grava 3s, urgency.',
    },
    Encerramento: {
      title: 'Encerrando com gratidão',
      instructions:
        'Faz story AGORA: mostra o espaço no final do dia. Grava 5s, peaceful close.',
    },
  },
  'Alta Demanda': {
    Movimento: {
      title: 'Preparação para sexta-feira!',
      instructions:
        'Faz story AGORA: mostra o stock reforçado. Grava 5s, preparation mode.',
    },
    História: {
      title: 'Sexta-feira é dia de movimento',
      instructions:
        'Faz story AGORA: mostra a previsão de pratos. Grava 5s, anticipation shot.',
    },
    Preparação: {
      title: 'Tudo pronto para o rush',
      instructions:
        'Faz story AGORA: mostra a cozinha organizada. Grava 5s, ready for action.',
    },
    Aberto: {
      title: 'Vem aí a sexta-feira!',
      instructions:
        'Faz story AGORA: mostra o restaurante animado. Grava 5s, energy up.',
    },
    'Primeiros pedidos': {
      title: 'Começou a sexta-feira!',
      instructions:
        'Faz story AGORA: mostra os primeiros pedidos a entrar. Grava 3s, rush beginning.',
    },
    Produção: {
      title: 'Cozinha em full power!',
      instructions:
        'Faz story AGORA: mostra a cozinha em ritmo intenso. Grava 5s, full speed.',
    },
    'Prova social': {
      title: 'A sexta-feira está animada!',
      instructions:
        'Faz story AGORA: mostra o restaurante cheio. Grava 5s, busy atmosphere.',
    },
    Escassez: {
      title: 'Vai esgotando em tempo recorde!',
      instructions:
        'Faz story AGORA: mostra o estoque baixo. Grava 3s, extreme urgency.',
    },
    Encerramento: {
      title: 'Sexta-feira esgotada! Agradecemos!',
      instructions:
        'Faz story AGORA: mostra a equipa exausta mas feliz. Grava 5s, celebration.',
    },
  },
  Evento: {
    Movimento: {
      title: 'Preparação especial para o evento',
      instructions:
        'Faz story AGORA: mostra o extra para hoje. Grava 5s, special prep.',
    },
    História: {
      title: 'O que torna este dia especial',
      instructions:
        'Faz story AGORA: conta o que se prepara. Grava 5s, storytelling.',
    },
    Preparação: {
      title: 'Detalhes do evento em preparação',
      instructions:
        'Faz story AGORA: mostra o setup do evento. Grava 5s, event prep.',
    },
    Aberto: {
      title: 'Evento iniciado: venha participar!',
      instructions:
        'Faz story AGORA: mostra o ambiente do evento. Grava 5s, event launch.',
    },
    'Primeiros pedidos': {
      title: 'Primeira venda do evento!',
      instructions:
        'Faz story AGORA: mostra o início do evento. Grava 3s, event start.',
    },
    Produção: {
      title: 'Evento em pleno andamento!',
      instructions:
        'Faz story AGORA: mostra a dinâmica do evento. Grava 5s, event action.',
    },
    'Prova social': {
      title: 'Clientes a desfrutar do evento',
      instructions:
        'Faz story AGORA: mostra participantes felizes. Grava 5s, happy event.',
    },
    Escassez: {
      title: 'Últimas oportunidades do evento',
      instructions:
        'Faz story AGORA: mostra o evento no fim. Grava 3s, last chance.',
    },
    Encerramento: {
      title: 'Evento concluído! Obrigado!',
      instructions:
        'Faz story AGORA: mostra o final do evento. Grava 5s, event wrap.',
    },
  },
  Família: {
    Movimento: {
      title: 'Domingo é dia de família',
      instructions:
        'Faz story AGORA: mostra o ambiente acolhedor. Grava 5s, family vibe.',
    },
    História: {
      title: 'A nossa tradição de domingo',
      instructions:
        'Faz story AGORA: conta a tradição do restaurante. Grava 5s, family story.',
    },
    Preparação: {
      title: 'Preparando o prato favorito das famílias',
      instructions:
        'Faz story AGORA: mostra o preparo de um prato familiar. Grava 5s, comfort food.',
    },
    Aberto: {
      title: 'Bem-vindas as famílias!',
      instructions:
        'Faz story AGORA: mostra uma família a entrar. Grava 5s, family welcome.',
    },
    'Primeiros pedidos': {
      title: 'Primeira família servida!',
      instructions:
        'Faz story AGORA: mostra uma família à mesa. Grava 3s, family moment.',
    },
    Produção: {
      title: 'Pratos que agradam a toda a família',
      instructions:
        'Faz story AGORA: mostra pratos para partilhar. Grava 5s, sharing platter.',
    },
    'Prova social': {
      title: 'Momentos em família aqui no restaurante',
      instructions:
        'Faz story AGORA: mostra famílias a desfrutar. Grava 5s, family time.',
    },
    Escassez: {
      title: 'Últimas mesas para famílias hoje',
      instructions:
        'Faz story AGORA: mostra o restaurante cheio. Grava 3s, last tables.',
    },
    Encerramento: {
      title: 'Bom descanso às famílias!',
      instructions:
        'Faz story AGORA: mostra o fim do domingo. Grava 5s, peaceful sunday.',
    },
  },
  // Semana 2: Pessoas
  'História da Empresa': {
    Movimento: {
      title: 'Começamos há X anos',
      instructions:
        'Faz story AGORA: conta a origem do restaurante. Grava 5s, origin story.',
    },
    História: {
      title: 'O nosso fundador',
      instructions:
        'Faz story AGORA: mostra o fundador ou conta a história. Grava 5s, founder story.',
    },
    Preparação: {
      title: 'A receita que nos tornou conhecidos',
      instructions:
        'Faz story AGORA: mostra o prato icónico. Grava 5s, signature dish.',
    },
    Aberto: {
      title: 'Somos parte da comunidade há tempo',
      instructions:
        'Faz story AGORA: mostra a história na parede. Grava 5s, community.',
    },
    'Primeiros pedidos': {
      title: 'A tradição continua hoje',
      instructions:
        'Faz story AGORA: mostra o prato tradicional. Grava 3s, tradition.',
    },
    Produção: {
      title: 'Cozinhando como no início',
      instructions:
        'Faz story AGORA: mostra a técnica original. Grava 5s, original recipe.',
    },
    'Prova social': {
      title: 'Gerações de clientes fiéis',
      instructions:
        'Faz story AGORA: mostra um cliente antigo. Grava 5s, loyal customer.',
    },
    Escassez: {
      title: 'O prato que nos fez conhecidos esgotando',
      instructions:
        'Faz story AGORA: mostra o prato icónico acabando. Grava 3s, classic running out.',
    },
    Encerramento: {
      title: 'Obrigado por fazerem parte da nossa história',
      instructions:
        'Faz story AGORA: mostra a equipa. Grava 5s, gratitude for history.',
    },
  },
  'Conheça a Cozinha': {
    Movimento: {
      title: 'A nossa cozinha: onde a magia acontece',
      instructions:
        'Faz story AGORA: mostra a cozinha. Grava 5s, kitchen tour.',
    },
    História: {
      title: 'A equipa da cozinha',
      instructions:
        'Faz story AGORA: apresenta a equipa. Grava 5s, kitchen team.',
    },
    Preparação: {
      title: 'Como preparamos os ingredientes',
      instructions:
        'Faz story AGORA: mostra o pré-preparo. Grava 5s, prep process.',
    },
    Aberto: {
      title: 'Cozinha pronta para servir',
      instructions:
        'Faz story AGORA: mostra a cozinha organizada. Grava 5s, ready kitchen.',
    },
    'Primeiros pedidos': {
      title: 'Primeiros pratos da nossa cozinha',
      instructions:
        'Faz story AGORA: mostra pratos saindo. Grava 3s, kitchen output.',
    },
    Produção: {
      title: 'A cozinha em ação',
      instructions:
        'Faz story AGORA: mostra a dinâmica da cozinha. Grava 5s, kitchen action.',
    },
    'Prova social': {
      title: 'Cozinhando com amor e qualidade',
      instructions:
        'Faz story AGORA: mostra o cuidado na preparação. Grava 5s, cooking with care.',
    },
    Escassez: {
      title: 'Os melhores pratos da cozinha acabando',
      instructions:
        'Faz story AGORA: mostra a cozinha a reduzir ritmo. Grava 3s, kitchen slowing.',
    },
    Encerramento: {
      title: 'Cozinha limpa e descansando',
      instructions:
        'Faz story AGORA: mostra a limpeza. Grava 5s, kitchen cleanup.',
    },
  },
  'O Chapeiro': {
    Movimento: {
      title: 'O nosso chapeiro em ação',
      instructions:
        'Faz story AGORA: mostra o chapeiro a trabalhar. Grava 5s, chef spotlight.',
    },
    História: {
      title: 'Conheça o nosso chapeiro',
      instructions:
        'Faz story AGORA: apresenta o chapeiro. Grava 5s, chef introduction.',
    },
    Preparação: {
      title: 'O segredo do nosso chapeiro',
      instructions:
        'Faz story AGORA: mostra uma técnica do chapeiro. Grava 5s, chef technique.',
    },
    Aberto: {
      title: 'Chapeiro pronto para o serviço',
      instructions:
        'Faz story AGORA: mostra o chapeiro no posto. Grava 5s, chef ready.',
    },
    'Primeiros pedidos': {
      title: 'Primeiros pratos do chapeiro',
      instructions:
        'Faz story AGORA: mostra o chapeiro a preparar. Grava 3s, chef cooking.',
    },
    Produção: {
      title: 'O mestre na cozinha',
      instructions:
        'Faz story AGORA: mostra o chapeiro a comandar. Grava 5s, master chef.',
    },
    'Prova social': {
      title: 'Pratos com a assinatura do chapeiro',
      instructions:
        'Faz story AGORA: mostra um prato especial. Grava 5s, chef signature.',
    },
    Escassez: {
      title: 'Pratos do chapeiro acabando',
      instructions:
        'Faz story AGORA: mostra o chapeiro a terminar. Grava 3s, chef finishing.',
    },
    Encerramento: {
      title: 'O chapeiro encerrando o dia',
      instructions:
        'Faz story AGORA: mostra o chapeiro a descansar. Grava 5s, chef rest.',
    },
  },
  'O Atendente': {
    Movimento: {
      title: 'A equipa de atendimento pronta',
      instructions:
        'Faz story AGORA: mostra os atendentes. Grava 5s, service team.',
    },
    História: {
      title: 'O nosso atendimento é especial',
      instructions:
        'Faz story AGORA: mostra o atendimento. Grava 5s, service focus.',
    },
    Preparação: {
      title: 'Preparando para atender bem',
      instructions:
        'Faz story AGORA: mostra os atendentes preparados. Grava 5s, service prep.',
    },
    Aberto: {
      title: 'Prontos para servir com simpatia',
      instructions:
        'Faz story AGORA: mostra os atendentes sorrindo. Grava 5s, friendly service.',
    },
    'Primeiros pedidos': {
      title: 'Primeiros clientes atendidos',
      instructions:
        'Faz story AGORA: mostra o atendimento. Grava 3s, service in action.',
    },
    Produção: {
      title: 'Atendimento eficiente e cordial',
      instructions:
        'Faz story AGORA: mostra a dinâmica do atendimento. Grava 5s, service flow.',
    },
    'Prova social': {
      title: 'Clientes satisfeitos com o atendimento',
      instructions:
        'Faz story AGORA: mostra cliente satisfeito. Grava 5s, happy customer.',
    },
    Escassez: {
      title: 'Equipe de atendimento no ritmo',
      instructions:
        'Faz story AGORA: mostra o movimento. Grava 3s, busy service.',
    },
    Encerramento: {
      title: 'Obrigado pelo excelente atendimento hoje',
      instructions:
        'Faz story AGORA: mostra os atendentes. Grava 5s, service appreciation.',
    },
  },
  'O Gerente': {
    Movimento: {
      title: 'O gerente a organizar o dia',
      instructions:
        'Faz story AGORA: mostra o gerente a trabalhar. Grava 5s, manager at work.',
    },
    História: {
      title: 'Conheça o nosso gerente',
      instructions:
        'Faz story AGORA: apresenta o gerente. Grava 5s, manager introduction.',
    },
    Preparação: {
      title: 'A visão do gerente para o dia',
      instructions:
        'Faz story AGORA: mostra o gerente a planear. Grava 5s, manager planning.',
    },
    Aberto: {
      title: 'Gerente pronto para receber',
      instructions:
        'Faz story AGORA: mostra o gerente no posto. Grava 5s, manager ready.',
    },
    'Primeiros pedidos': {
      title: 'Supervisão dos primeiros pedidos',
      instructions:
        'Faz story AGORA: mostra o gerente a supervisionar. Grava 3s, manager supervising.',
    },
    Produção: {
      title: 'Coordenando a operação',
      instructions:
        'Faz story AGORA: mostra o gerente a coordenar. Grava 5s, manager coordinating.',
    },
    'Prova social': {
      title: 'Gestão com qualidade',
      instructions:
        'Faz story AGORA: mostra o gerente a interagir. Grava 5s, manager interaction.',
    },
    Escassez: {
      title: 'Gerente a gerir o rush',
      instructions:
        'Faz story AGORA: mostra o gerente em ação. Grava 3s, manager in rush.',
    },
    Encerramento: {
      title: 'Gerente a encerrar o dia com sucesso',
      instructions:
        'Faz story AGORA: mostra o gerente a finalizar. Grava 5s, manager closing.',
    },
  },
  'Os Entregadores': {
    Movimento: {
      title: 'Equipa de entregas pronta',
      instructions:
        'Faz story AGORA: mostra os entregadores. Grava 5s, delivery team.',
    },
    História: {
      title: 'Os nossos entregadores são o rosto fora',
      instructions:
        'Faz story AGORA: apresenta os entregadores. Grava 5s, delivery introduction.',
    },
    Preparação: {
      title: 'Preparando as encomendas',
      instructions:
        'Faz story AGORA: mostra o setup de entrega. Grava 5s, delivery prep.',
    },
    Aberto: {
      title: 'Entregas prontos para sair',
      instructions:
        'Faz story AGORA: mostra as entregas organizadas. Grava 5s, delivery ready.',
    },
    'Primeiros pedidos': {
      title: 'Primeiras entregas do dia',
      instructions:
        'Faz story AGORA: mostra um entregador a sair. Grava 3s, first delivery.',
    },
    Produção: {
      title: 'Entregas a sair constantemente',
      instructions:
        'Faz story AGORA: mostra o fluxo de entregas. Grava 5s, delivery flow.',
    },
    'Prova social': {
      title: 'Entregas no prazo e com qualidade',
      instructions:
        'Faz story AGORA: mostra a entrega. Grava 5s, quality delivery.',
    },
    Escassez: {
      title: 'Últimas entregas do dia',
      instructions:
        'Faz story AGORA: mostra os entregadores no final. Grava 3s, last deliveries.',
    },
    Encerramento: {
      title: 'Entregadores de regresso e descansando',
      instructions:
        'Faz story AGORA: mostra o fim das entregas. Grava 5s, delivery rest.',
    },
  },
  'Cultura da Equipa': {
    Movimento: {
      title: 'A nossa cultura de equipa',
      instructions:
        'Faz story AGORA: mostra a equipa unida. Grava 5s, team culture.',
    },
    História: {
      title: 'Valores da nossa equipa',
      instructions:
        'Faz story AGORA: mostra a equipa a colaborar. Grava 5s, team values.',
    },
    Preparação: {
      title: 'Trabalhar em equipa faz a diferença',
      instructions:
        'Faz story AGORA: mostra a colaboração. Grava 5s, teamwork.',
    },
    Aberto: {
      title: 'Equipa alinhada para servir',
      instructions:
        'Faz story AGORA: mostra a equipa focada. Grava 5s, team focus.',
    },
    'Primeiros pedidos': {
      title: 'Primeira vitória da equipa do dia',
      instructions:
        'Faz story AGORA: mostra a equipa a celebrar. Grava 3s, team celebration.',
    },
    Produção: {
      title: 'Sinergia em cada pedido',
      instructions:
        'Faz story AGORA: mostra a equipa a trabalhar junta. Grava 5s, team synergy.',
    },
    'Prova social': {
      title: 'Uma equipa que cuida de si',
      instructions:
        'Faz story AGORA: mostra o cuidado mútuo. Grava 5s, team care.',
    },
    Escassez: {
      title: 'Equipa no final do rush',
      instructions:
        'Faz story AGORA: mostra a equipa cansada mas unida. Grava 3s, team tired but united.',
    },
    Encerramento: {
      title: 'Encerrando juntos o dia',
      instructions:
        'Faz story AGORA: mostra a equipa a finalizar. Grava 5s, team closing.',
    },
  },
  // Semana 3: Autoridade
  'Ingredientes Premium': {
    Movimento: {
      title: 'Ingredientes de qualidade superior',
      instructions:
        'Faz story AGORA: mostra os ingredientes frescos. Grava 5s, premium ingredients.',
    },
    História: {
      title: 'Escolhemos apenas o melhor',
      instructions:
        'Faz story AGORA: conta a seleção de ingredientes. Grava 5s, ingredient selection.',
    },
    Preparação: {
      title: 'Qualidade começa na preparação',
      instructions:
        'Faz story AGORA: mostra o cuidado com ingredientes. Grava 5s, ingredient care.',
    },
    Aberto: {
      title: 'Premium desde o primeiro ingrediente',
      instructions:
        'Faz story AGORA: mostra um ingrediente premium. Grava 5s, premium highlight.',
    },
    'Primeiros pedidos': {
      title: 'Pratos com ingredientes premium',
      instructions:
        'Faz story AGORA: mostra o prato final. Grava 3s, premium dish.',
    },
    Produção: {
      title: 'Cozinhando com ingredientes de excelência',
      instructions:
        'Faz story AGORA: mostra a qualidade na cozinha. Grava 5s, excellence in cooking.',
    },
    'Prova social': {
      title: 'A diferença que a qualidade faz',
      instructions:
        'Faz story AGORA: mostra o resultado. Grava 5s, quality result.',
    },
    Escassez: {
      title: 'Últimos pratos com ingredientes premium',
      instructions:
        'Faz story AGORA: mostra o prato premium acabando. Grava 3s, premium ending.',
    },
    Encerramento: {
      title: 'Investimos na qualidade por si',
      instructions:
        'Faz story AGORA: mostra o cuidado. Grava 5s, quality investment.',
    },
  },
  Higiene: {
    Movimento: {
      title: 'Higiene é a nossa prioridade',
      instructions:
        'Faz story AGORA: mostra os processos de higiene. Grava 5s, hygiene focus.',
    },
    História: {
      title: 'Protocolos de higiene rigorosos',
      instructions:
        'Faz story AGORA: mostra os protocolos. Grava 5s, hygiene protocols.',
    },
    Preparação: {
      title: 'Limpeza em cada passo',
      instructions:
        'Faz story AGORA: mostra a higiene na preparação. Grava 5s, clean preparation.',
    },
    Aberto: {
      title: 'Ambiente limpo e seguro',
      instructions:
        'Faz story AGORA: mostra o espaço limpo. Grava 5s, clean environment.',
    },
    'Primeiros pedidos': {
      title: 'Preparado com higiene total',
      instructions:
        'Faz story AGORA: mostra o cuidado. Grava 3s, hygienic care.',
    },
    Produção: {
      title: 'Mantendo os padrões de higiene',
      instructions:
        'Faz story AGORA: mostra a higiene na cozinha. Grava 5s, kitchen hygiene.',
    },
    'Prova social': {
      title: 'Clientes confiam na nossa higiene',
      instructions:
        'Faz story AGORA: mostra a confiança. Grava 5s, customer trust.',
    },
    Escassez: {
      title: 'Continuamos com higiene até o fim',
      instructions:
        'Faz story AGORA: mostra o padrão mantido. Grava 3s, hygiene maintained.',
    },
    Encerramento: {
      title: 'Limpeza completa do dia',
      instructions:
        'Faz story AGORA: mostra a limpeza final. Grava 5s, final cleanup.',
    },
  },
  'Controle de Qualidade': {
    Movimento: {
      title: 'Controlo de qualidade antes de começar',
      instructions:
        'Faz story AGORA: mostra o check de qualidade. Grava 5s, quality check.',
    },
    História: {
      title: 'Não servimos sem aprovar',
      instructions:
        'Faz story AGORA: mostra o processo de aprovação. Grava 5s, approval process.',
    },
    Preparação: {
      title: 'Cada prato é verificado',
      instructions:
        'Faz story AGORA: mostra o controlo. Grava 5s, dish control.',
    },
    Aberto: {
      title: 'Prontos para servir qualidade',
      instructions:
        'Faz story AGORA: mostra o padrão. Grava 5s, quality standard.',
    },
    'Primeiros pedidos': {
      title: 'Primeiros pratos aprovados',
      instructions:
        'Faz story AGORA: mostra a aprovação. Grava 3s, approved dishes.',
    },
    Produção: {
      title: 'Manter a qualidade é o nosso foco',
      instructions:
        'Faz story AGORA: mostra o controlo contínuo. Grava 5s, continuous control.',
    },
    'Prova social': {
      title: 'A qualidade é visível no prato',
      instructions:
        'Faz story AGORA: mostra o resultado. Grava 5s, visible quality.',
    },
    Escassez: {
      title: 'Qualidade mantida até o fim',
      instructions:
        'Faz story AGORA: mostra o padrão. Grava 3s, quality maintained.',
    },
    Encerramento: {
      title: 'Revisão de qualidade do dia',
      instructions:
        'Faz story AGORA: mostra a revisão. Grava 5s, quality review.',
    },
  },
  'Receitas Exclusivas': {
    Movimento: {
      title: 'As nossas receitas exclusivas',
      instructions:
        'Faz story AGORA: mostra uma receita especial. Grava 5s, exclusive recipe.',
    },
    História: {
      title: 'Receitas que só encontra aqui',
      instructions:
        'Faz story AGORA: conta a receita. Grava 5s, recipe story.',
    },
    Preparação: {
      title: 'O segredo da receita exclusiva',
      instructions:
        'Faz story AGORA: mostra a preparação. Grava 5s, recipe preparation.',
    },
    Aberto: {
      title: 'Sabor exclusivo espera por si',
      instructions:
        'Faz story AGORA: mostra o prato. Grava 5s, exclusive taste.',
    },
    'Primeiros pedidos': {
      title: 'Primeira experiência exclusiva do dia',
      instructions:
        'Faz story AGORA: mostra o prato exclusivo. Grava 3s, exclusive experience.',
    },
    Produção: {
      title: 'Preparando receitas únicas',
      instructions:
        'Faz story AGORA: mostra a exclusividade. Grava 5s, unique recipes.',
    },
    'Prova social': {
      title: 'Clientes apaixonados pelas receitas',
      instructions:
        'Faz story AGORA: mostra a paixão. Grava 5s, customer passion.',
    },
    Escassez: {
      title: 'Últimas porções da receita exclusiva',
      instructions:
        'Faz story AGORA: mostra o prato acabando. Grava 3s, exclusive running out.',
    },
    Encerramento: {
      title: 'Exclusividade que nos define',
      instructions:
        'Faz story AGORA: mostra a receita. Grava 5s, defining recipe.',
    },
  },
  'Nº de Clientes': {
    Movimento: {
      title: 'Servimos milhares de clientes',
      instructions:
        'Faz story AGORA: mostra o restaurante cheio. Grava 5s, customer volume.',
    },
    História: {
      title: 'A confiança dos nossos clientes',
      instructions:
        'Faz story AGORA: conta o número. Grava 5s, customer trust.',
    },
    Preparação: {
      title: 'Preparado para muitos clientes',
      instructions:
        'Faz story AGORA: mostra a preparação. Grava 5s, preparation for many.',
    },
    Aberto: {
      title: 'Vem fazer parte dos nossos clientes',
      instructions:
        'Faz story AGORA: mostra o convite. Grava 5s, customer invitation.',
    },
    'Primeiros pedidos': {
      title: 'Mais um cliente a servir',
      instructions:
        'Faz story AGORA: mostra o cliente. Grava 3s, one more customer.',
    },
    Produção: {
      title: 'Capacidade para servir muitos',
      instructions:
        'Faz story AGORA: mostra a capacidade. Grava 5s, service capacity.',
    },
    'Prova social': {
      title: 'Clientes escolhem-nos dia após dia',
      instructions:
        'Faz story AGORA: mostra a escolha. Grava 5s, customer choice.',
    },
    Escassez: {
      title: 'Muitos clientes, poucas mesas',
      instructions:
        'Faz story AGORA: mostra o movimento. Grava 3s, high demand.',
    },
    Encerramento: {
      title: 'Obrigado a todos os clientes de hoje',
      instructions:
        'Faz story AGORA: mostra a gratidão. Grava 5s, customer gratitude.',
    },
  },
  'Tempo Médio': {
    Movimento: {
      title: 'Servimos rápido sem perder qualidade',
      instructions:
        'Faz story AGORA: mostra a rapidez. Grava 5s, fast service.',
    },
    História: {
      title: 'O nosso tempo médio de atendimento',
      instructions:
        'Faz story AGORA: conta o tempo. Grava 5s, service time.',
    },
    Preparação: {
      title: 'Eficiência na preparação',
      instructions:
        'Faz story AGORA: mostra a eficiência. Grava 5s, preparation efficiency.',
    },
    Aberto: {
      title: 'Prontos para servir rápido',
      instructions:
        'Faz story AGORA: mostra a prontidão. Grava 5s, ready to serve fast.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro atendimento rápido',
      instructions:
        'Faz story AGORA: mostra a rapidez. Grava 3s, quick service.',
    },
    Produção: {
      title: 'Mantendo o tempo médio excelente',
      instructions:
        'Faz story AGORA: mostra o desempenho. Grava 5s, time performance.',
    },
    'Prova social': {
      title: 'Clientes apreciam a rapidez',
      instructions:
        'Faz story AGORA: mostra a satisfação. Grava 5s, quick satisfaction.',
    },
    Escassez: {
      title: 'Mesmo no rush, mantemos o tempo',
      instructions:
        'Faz story AGORA: mostra a consistência. Grava 3s, consistent time.',
    },
    Encerramento: {
      title: 'Tempo médio excelente hoje',
      instructions:
        'Faz story AGORA: mostra o resultado. Grava 5s, excellent time.',
    },
  },
  Diferenciais: {
    Movimento: {
      title: 'O que nos torna diferentes',
      instructions:
        'Faz story AGORA: mostra um diferencial. Grava 5s, our difference.',
    },
    História: {
      title: 'Os nossos diferenciais competitivos',
      instructions:
        'Faz story AGORA: conta os diferenciais. Grava 5s, competitive advantages.',
    },
    Preparação: {
      title: 'Diferencial começa na preparação',
      instructions:
        'Faz story AGORA: mostra o diferencial. Grava 5s, preparation difference.',
    },
    Aberto: {
      title: 'Experimente o nosso diferencial',
      instructions:
        'Faz story AGORA: mostra o destaque. Grava 5s, experience difference.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro diferencial do dia',
      instructions:
        'Faz story AGORA: mostra o diferencial. Grava 3s, first difference.',
    },
    Produção: {
      title: 'Diferenciais em cada prato',
      instructions:
        'Faz story AGORA: mostra a variedade. Grava 5s, differences in dishes.',
    },
    'Prova social': {
      title: 'Clientes valorizam os diferenciais',
      instructions:
        'Faz story AGORA: mostra a valorização. Grava 5s, customer value.',
    },
    Escassez: {
      title: 'Última chance de experimentar o diferencial',
      instructions:
        'Faz story AGORA: mostra a oportunidade. Grava 3s, last chance.',
    },
    Encerramento: {
      title: 'Diferenciais que nos definem',
      instructions:
        'Faz story AGORA: mostra a identidade. Grava 5s, defining differences.',
    },
  },
  // Semana 4: Conversão
  'Oferta do Dia': {
    Movimento: {
      title: 'Oferta especial de hoje!',
      instructions:
        'Faz story AGORA: mostra a oferta. Grava 5s, today\'s offer.',
    },
    História: {
      title: 'Por que esta oferta é especial',
      instructions:
        'Faz story AGORA: conta o valor. Grava 5s, offer value.',
    },
    Preparação: {
      title: 'Preparando a oferta especial',
      instructions:
        'Faz story AGORA: mostra o preparo. Grava 5s, offer preparation.',
    },
    Aberto: {
      title: 'Oferta do dia disponível!',
      instructions:
        'Faz story AGORA: mostra a oferta. Grava 5s, offer available.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro cliente com a oferta',
      instructions:
        'Faz story AGORA: mostra o aproveitamento. Grava 3s, offer taken.',
    },
    Produção: {
      title: 'Produzindo a oferta especial',
      instructions:
        'Faz story AGORA: mostra a produção. Grava 5s, offer production.',
    },
    'Prova social': {
      title: 'Clientes a aproveitar a oferta',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, offer success.',
    },
    Escassez: {
      title: 'Últimas unidades da oferta do dia',
      instructions:
        'Faz story AGORA: mostra o fim. Grava 3s, offer ending.',
    },
    Encerramento: {
      title: 'Oferta do dia esgotada!',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, offer sold out.',
    },
  },
  'Combo do Dia': {
    Movimento: {
      title: 'Combo perfeito para hoje',
      instructions:
        'Faz story AGORA: mostra o combo. Grava 5s, today\'s combo.',
    },
    História: {
      title: 'A vantagem do combo do dia',
      instructions:
        'Faz story AGORA: conta o benefício. Grava 5s, combo benefit.',
    },
    Preparação: {
      title: 'Preparando o combo especial',
      instructions:
        'Faz story AGORA: mostra o preparo. Grava 5s, combo preparation.',
    },
    Aberto: {
      title: 'Combo do dia disponível!',
      instructions:
        'Faz story AGORA: mostra o combo. Grava 5s, combo available.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro combo do dia servido',
      instructions:
        'Faz story AGORA: mostra o combo. Grava 3s, first combo.',
    },
    Produção: {
      title: 'Combos prontos para servir',
      instructions:
        'Faz story AGORA: mostra a produção. Grava 5s, combo production.',
    },
    'Prova social': {
      title: 'Clientes adoram o combo do dia',
      instructions:
        'Faz story AGORA: mostra a satisfação. Grava 5s, combo satisfaction.',
    },
    Escassez: {
      title: 'Últimos combos do dia',
      instructions:
        'Faz story AGORA: mostra o fim. Grava 3s, last combos.',
    },
    Encerramento: {
      title: 'Combos do dia esgotados!',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, combos sold out.',
    },
  },
  'Mais Vendido': {
    Movimento: {
      title: 'O prato mais vendido espera por si',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, bestseller.',
    },
    História: {
      title: 'Por que é o mais vendido',
      instructions:
        'Faz story AGORA: conta o segredo. Grava 5s, bestseller secret.',
    },
    Preparação: {
      title: 'Preparando o favorito',
      instructions:
        'Faz story AGORA: mostra o preparo. Grava 5s, bestseller prep.',
    },
    Aberto: {
      title: 'Experimente o favorito dos clientes',
      instructions:
        'Faz story AGORA: mostra o prato. Grava 5s, try bestseller.',
    },
    'Primeiros pedidos': {
      title: 'Primeira venda do favorito',
      instructions:
        'Faz story AGORA: mostra a venda. Grava 3s, first bestseller.',
    },
    Produção: {
      title: 'Produzindo o sucesso do dia',
      instructions:
        'Faz story AGORA: mostra a produção. Grava 5s, bestseller production.',
    },
    'Prova social': {
      title: 'Clientes provam o favorito',
      instructions:
        'Faz story AGORA: mostra a escolha. Grava 5s, customer choice.',
    },
    Escassez: {
      title: 'Favorito a esgotar rápido',
      instructions:
        'Faz story AGORA: mostra a urgência. Grava 3s, bestseller urgency.',
    },
    Encerramento: {
      title: 'Favorito esgotado novamente!',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, bestseller sold out.',
    },
  },
  'Mais Lucrativo': {
    Movimento: {
      title: 'Experimente o nosso destaque lucrativo',
      instructions:
        'Faz story AGORA: mostra o destaque. Grava 5s, profitable highlight.',
    },
    História: {
      title: 'A escolha inteligente do dia',
      instructions:
        'Faz story AGORA: conta a vantagem. Grava 5s, smart choice.',
    },
    Preparação: {
      title: 'Preparando o prato premium',
      instructions:
        'Faz story AGORA: mostra o preparo. Grava 5s, premium prep.',
    },
    Aberto: {
      title: 'Premium qualidade ao seu alcance',
      instructions:
        'Faz story AGORA: mostra o valor. Grava 5s, premium value.',
    },
    'Primeiros pedidos': {
      title: 'Primeira venda premium do dia',
      instructions:
        'Faz story AGORA: mostra a escolha. Grava 3s, first premium.',
    },
    Produção: {
      title: 'Pratos premium em produção',
      instructions:
        'Faz story AGORA: mostra a qualidade. Grava 5s, premium production.',
    },
    'Prova social': {
      title: 'Clientes escolhem qualidade',
      instructions:
        'Faz story AGORA: mostra o gosto. Grava 5s, quality choice.',
    },
    Escassez: {
      title: 'Últimas porções premium',
      instructions:
        'Faz story AGORA: mostra a exclusividade. Grava 3s, last premium.',
    },
    Encerramento: {
      title: 'Premium vendido com sucesso!',
      instructions:
        'Faz story AGORA: mostra o resultado. Grava 5s, premium success.',
    },
  },
  'Favorito dos Clientes': {
    Movimento: {
      title: 'O prato que os clientes amam',
      instructions:
        'Faz story AGORA: mostra o favorito. Grava 5s, customer favorite.',
    },
    História: {
      title: 'Por que os clientes amam este prato',
      instructions:
        'Faz story AGORA: conta o amor. Grava 5s, loved dish.',
    },
    Preparação: {
      title: 'Preparando com carinho o favorito',
      instructions:
        'Faz story AGORA: mostra o cuidado. Grava 5s, care in prep.',
    },
    Aberto: {
      title: 'Venha provar o favorito',
      instructions:
        'Faz story AGORA: mostra o convite. Grava 5s, try favorite.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro favorito servido',
      instructions:
        'Faz story AGORA: mostra a entrega. Grava 3s, first favorite.',
    },
    Produção: {
      title: 'Favoritos saindo da cozinha',
      instructions:
        'Faz story AGORA: mostra o fluxo. Grava 5s, favorite flow.',
    },
    'Prova social': {
      title: 'Clientes apaixonados pelo favorito',
      instructions:
        'Faz story AGORA: mostra a paixão. Grava 5s, customer passion.',
    },
    Escassez: {
      title: 'Favorito a esgotar novamente',
      instructions:
        'Faz story AGORA: mostra a urgência. Grava 3s, favorite urgency.',
    },
    Encerramento: {
      title: 'Favorito esgotado com sucesso!',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, favorite sold out.',
    },
  },
  'Desafio da Equipa': {
    Movimento: {
      title: 'Desafio especial da equipa hoje',
      instructions:
        'Faz story AGORA: mostra o desafio. Grava 5s, team challenge.',
    },
    História: {
      title: 'A equipa preparou um desafio',
      instructions:
        'Faz story AGORA: conta o desafio. Grava 5s, challenge story.',
    },
    Preparação: {
      title: 'Preparando o desafio especial',
      instructions:
        'Faz story AGORA: mostra o preparo. Grava 5s, challenge prep.',
    },
    Aberto: {
      title: 'Desafio disponível para provar',
      instructions:
        'Faz story AGORA: mostra o desafio. Grava 5s, challenge ready.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro desafio aceito',
      instructions:
        'Faz story AGORA: mostra a aceitação. Grava 3s, challenge accepted.',
    },
    Produção: {
      title: 'Desafio em execução',
      instructions:
        'Faz story AGORA: mostra a ação. Grava 5s, challenge in action.',
    },
    'Prova social': {
      title: 'Clientes aceitam o desafio',
      instructions:
        'Faz story AGORA: mostra a participação. Grava 5s, challenge participation.',
    },
    Escassez: {
      title: 'Últimas chances do desafio',
      instructions:
        'Faz story AGORA: mostra o fim. Grava 3s, last challenge.',
    },
    Encerramento: {
      title: 'Desafio concluído com sucesso!',
      instructions:
        'Faz story AGORA: mostra o resultado. Grava 5s, challenge success.',
    },
  },
  'Melhor Semana': {
    Movimento: {
      title: 'Preparando a melhor semana',
      instructions:
        'Faz story AGORA: mostra a preparação. Grava 5s, best week prep.',
    },
    História: {
      title: 'A semana que vai ser especial',
      instructions:
        'Faz story AGORA: conta o plano. Grava 5s, special week plan.',
    },
    Preparação: {
      title: 'Cuidado extra esta semana',
      instructions:
        'Faz story AGORA: mostra o cuidado. Grava 5s, extra care.',
    },
    Aberto: {
      title: 'Iniciando a melhor semana',
      instructions:
        'Faz story AGORA: mostra o início. Grava 5s, week start.',
    },
    'Primeiros pedidos': {
      title: 'Primeiro pedido da semana especial',
      instructions:
        'Faz story AGORA: mostra o começo. Grava 3s, week beginning.',
    },
    Produção: {
      title: 'Produzindo excelência esta semana',
      instructions:
        'Faz story AGORA: mostra a qualidade. Grava 5s, week excellence.',
    },
    'Prova social': {
      title: 'Clientes a desfrutar da semana',
      instructions:
        'Faz story AGORA: mostra a experiência. Grava 5s, week experience.',
    },
    Escassez: {
      title: 'Semana a terminar com sucesso',
      instructions:
        'Faz story AGORA: mostra o fim. Grava 3s, week ending.',
    },
    Encerramento: {
      title: 'Semana concluída com excelência!',
      instructions:
        'Faz story AGORA: mostra o sucesso. Grava 5s, week success.',
    },
  },
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém o tema da semana para um determinado dia
 * @param date - Data em UTC
 * @returns Número da semana (1-4) que roda no mês
 */
function getWeekOfMonth(date: Date): number {
  // DECISÃO: Use getUTCDate() because we're working with UTC dates
  const dayOfMonth = date.getUTCDate();
  // DECISÃO: Semanas começam no dia 1, não no domingo da primeira semana
  // Semana 1: dias 1-7, Semana 2: dias 8-14, Semana 3: dias 15-21, Semana 4: dias 22-31
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Converte hora local para UTC baseado no timezone
 * @param localDate - Data em UTC
 * @param hour - Hora local (0-23)
 
 * @param timezone - Timezone (ex: 'Africa/Maputo')
 * @returns Data/hora em UTC
 */
function localHourToUTC(localDate: Date, hour: number, timezone: string): Date {
  // DECISÃO: usa Intl para obter a data local no timezone correto (nunca sistema do SO)
  // Passo 1: obter YYYY-MM-DD no timezone do restaurante
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(localDate);
  const getPart = (type: string) => dateParts.find((p) => p.type === type)!.value;
  const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;

  // Passo 2: construir um timestamp "ingênuo" tratando a hora local como UTC
  const pad = (n: number) => String(n).padStart(2, '0');
  const naive = new Date(`${dateStr}T${pad(hour)}:00:00Z`);

  // Passo 3: ver como o timestamp ingênuo aparece no timezone alvo
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(naive);
  const getTzPart = (type: string) => tzParts.find((p) => p.type === type)!.value;
  const tzYear = parseInt(getTzPart('year'));
  const tzMonth = parseInt(getTzPart('month')) - 1;
  const tzDay = parseInt(getTzPart('day'));
  const tzHour = parseInt(getTzPart('hour')) % 24;
  const tzMin = parseInt(getTzPart('minute'));
  const tzSec = parseInt(getTzPart('second'));

  // Diferença entre o que o timezone mostra vs. o que queremos (como valores UTC "relógio")
  const tzShownMs = Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMin, tzSec);
  const [y, m, d] = dateStr.split('-').map(Number);
  const wantedMs = Date.UTC(y, m - 1, d, hour, 0, 0);

  // Subtrair a diferença para obter o UTC correto
  return new Date(naive.getTime() - (tzShownMs - wantedMs));
}

/**
 * Obtém o conteúdo do story baseado no tema e slot
 * @param theme - Nome do tema
 * @param slotName - Nome do slot
 * @returns { title, instructions }
 */
function getStoryContent(theme: string, slotName: string): StoryContent {
  // STORY_CONTENT cobre os 28 temas × 9 slots; este fallback é defensivo.
  // DECISÃO: nunca devolver alerta sem contexto (§14) — o fallback mantém tema + slot.
  return (
    STORY_CONTENT[theme]?.[slotName] || {
      title: `${theme} — ${slotName}`,
      instructions: `Faz story AGORA sobre "${theme}" (momento "${slotName}"): mostra algo real do restaurante neste instante. Grava 5s, faz close no produto.`,
    }
  );
}

// ============================================================================
// FUNÇÃO PRINCIPAL: generateStoryTasks
// DECISÃO: Função pura, sem efeitos colaterais
// ============================================================================

/**
 * Gera tasks de story para um restaurante
 * @param restaurant - Dados do restaurante
 * @param fromDate - Data inicial em UTC
 * @param days - Número de dias a gerar
 * @returns Array de StoryTask
 */
export function generateStoryTasks(
  restaurant: Restaurant,
  fromDate: Date,
  days: number
): StoryTask[] {
  const tasks: StoryTask[] = [];
  const { id: restaurant_id, tenant_id, open_hour, close_hour, timezone } = restaurant;

  // Iterar por cada dia
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(fromDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + dayOffset);

    const weekday = currentDate.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const weekOfMonth = getWeekOfMonth(currentDate);

    // Obter tema da semana (rotação 1-2-3-4)
    const weekTheme = WEEK_THEMES[(weekOfMonth - 1) % 4];
    const theme = weekTheme.daily_themes[weekday];

    // Iterar por cada slot horário dentro do horário de funcionamento
    for (const slot of FIXED_SLOTS) {
      // DECISÃO: close_hour < 23 → exclusivo (alerta até 1h antes de fechar);
      // close_hour >= 23 → todos os 9 slots incluídos (restaurante aberto até final do dia)
      if (slot.hour < open_hour || (close_hour < 23 && slot.hour >= close_hour)) {
        continue;
      }

      // Calcular scheduled_for em UTC
      const scheduledFor = localHourToUTC(currentDate, slot.hour, timezone);

      // Obter conteúdo do story
      const content = getStoryContent(theme, slot.name);

      tasks.push({
        tenant_id,
        restaurant_id,
        scheduled_for: scheduledFor.toISOString(),
        week_of_month: weekOfMonth,
        weekday,
        hour: slot.hour,
        theme,
        title: content.title,
        instructions: content.instructions,
      });
    }
  }

  return tasks;
}

// ============================================================================
// EXPORTS
// ============================================================================
 
