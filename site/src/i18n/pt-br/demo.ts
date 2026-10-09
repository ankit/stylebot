import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Fixe na barra de ferramentas',
      body: 'Deixe o Stylebot a um clique de distância.',
      captions: {
        menu: 'O Stylebot começa no menu de extensões.',
        pinned: 'Fixado. O Stylebot agora está na sua barra de ferramentas.',
      },
    },
    open: {
      title: 'Abra o editor',
      keysBody: 'Clique no ícone ou pressione {keys}.',
      captions: {
        iconThenStyle:
          'Clique no ícone do Stylebot e depois em Estilizar esta página.',
        orKeys: 'Ou pressione {keys} para abrir direto.',
      },
    },
    pick: {
      title: 'Escolha um elemento',
      fieldsBody:
        'Clique para selecionar. Os campos mostram os estilos atuais.',
      captions: {
        hoverToSee: 'Passe o mouse para ver o que pode ser estilizado.',
        select: 'Clique para selecionar. O seletor é preenchido para você.',
        computed: 'Cada campo mostra o valor calculado atual do elemento.',
      },
    },
    style: {
      title: 'Mude o estilo',
      body: 'Use os controles do Básico ou escreva CSS.',
      captions: {
        size: 'Defina o tamanho…',
        color: '…e a cor.',
        plainCss: 'Cada mudança é CSS puro, salvo para este site.',
        byHand: 'Ou escreva CSS à mão.',
        live: 'A página é atualizada enquanto você digita.',
      },
    },
    profiles: {
      title: 'Perfis',
      looksBody: 'Salve visuais diferentes para o mesmo site.',
      captions: {
        createForLook: 'Crie um perfil para um visual novo.',
        created: '{profile} começa vazio. {defaultProfile} continua salvo.',
        newspaperLook: 'Dê a ele um visual de jornal.',
        darkLook: 'Dê a ele um visual escuro e aconchegante.',
        switchAnytime: 'Alterne entre eles quando quiser.',
        backToDefault: 'De volta ao {defaultProfile}. Um site, dois visuais.',
      },
    },
  },
  browser: {
    extensions: 'Extensões',
    fullAccess: 'Acesso total',
    fullAccessNote:
      'Estas extensões podem ver e alterar informações neste site.',
    otherExtensions: {
      adBlocker: 'Bloqueador de anúncios',
      passwordManager: 'Gerenciador de senhas',
      translate: 'Tradutor',
      webArchive: 'Arquivo da web',
    },
  },
  popup: {
    readability: 'Modo legível',
    styleThisPage: 'Estilizar esta página',
  },
  editor: {
    defaultProfile: 'Padrão',
    newProfile: 'Jornal',
    newProfileDark: 'Coruja noturna',
    createProfile: 'Criar perfil',
    pickAnElement: 'Escolher um elemento',
    tabs: {
      basic: 'Básico',
      code: 'Código',
      presets: 'Predefinições',
      chat: 'Chat',
    },
    basic: {
      hide: 'Ocultar',
      reset: 'Redefinir',
      text: 'Texto',
      font: 'Fonte',
      defaultFont: 'Padrão',
      size: 'Tamanho',
      lineHeight: 'Altura da linha',
      color: 'Cor',
      decoration: 'Decoração',
      none: 'Nenhum',
      alignment: 'Alinhamento',
      background: 'Fundo',
      box: 'Caixa',
      effects: 'Efeitos',
      moreProperties: 'Mais propriedades',
    },
    code: {
      noStyles: 'Nenhum estilo ainda',
    },
    presets: {
      readability: 'Modo legível',
      articlesOnly: 'Somente artigos',
      readabilityDescription:
        'Transforme os artigos deste site em uma leitura limpa e sem distrações, com o tema, a fonte e o tamanho que você preferir.',
      grayscale: 'Escala de cinza',
      grayscaleDescription: 'Aplicar escala de cinza à página.',
    },
  },
  article: {
    nav: {
      news: 'Notícias',
      travel: 'Viagem',
      signIn: 'Entrar',
    },
    kicker: 'Viagem · Reportagem',
    headline: 'A volta silenciosa da balsa noturna',
    dek: 'Três operadoras apostam que os viajantes vão trocar a velocidade por uma cabine, vista para o mar e nada de aeroporto.',
    byline: 'Marta Linde · 24 set. · 6 min de leitura',
    paragraphs: [
      'Vinte anos depois do fim da última travessia noturna, três operadoras estão colocando cabines de volta na água. A proposta é simples: embarcar depois do jantar, dormir durante a travessia e acordar em outro país.',
      'As reservas da primeira linha reaberta se esgotaram para o verão inteiro em uma semana. A maioria dos passageiros tem menos de quarenta anos, e muitos nunca viajaram de noite, nem de trem nem de navio. Segundo as operadoras, primeiro lotam as cabines, depois as poltronas reclináveis, depois o convés.',
    ],
    quote:
      '“Ninguém reserva isso para ganhar tempo. Reservam para perder um pouco.”',
    quoteBy: '— Ines Varga, planejadora de rotas',
  },
  steps: {
    heading: 'Como funciona',
    counter: '{current} / {total}',
    jump: 'Ir para este ponto',
  },
};

export default demo;
