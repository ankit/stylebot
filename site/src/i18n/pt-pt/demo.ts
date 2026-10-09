import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Afixe-o na barra de ferramentas',
      body: 'Tenha o Stylebot à distância de um clique.',
      captions: {
        menu: 'O Stylebot começa no menu de extensões.',
        pinned: 'Afixado. O Stylebot está agora na barra de ferramentas.',
      },
    },
    open: {
      title: 'Abrir o editor',
      keysBody: 'Clique no ícone ou prima {keys}.',
      captions: {
        iconThenStyle:
          'Clique no ícone do Stylebot e depois em Estilizar esta página.',
        orKeys: 'Ou prima {keys} para o abrir diretamente.',
      },
    },
    pick: {
      title: 'Escolher um elemento',
      fieldsBody:
        'Clique para selecionar. Os campos mostram os estilos atuais.',
      captions: {
        hoverToSee: 'Passe o cursor para ver o que pode estilizar.',
        select: 'Clique para selecionar. O seletor CSS é preenchido por si.',
        computed: 'Cada campo mostra o valor calculado atual do elemento.',
      },
    },
    style: {
      title: 'Estilize-o',
      body: 'Use os controlos do Básico ou escreva CSS.',
      captions: {
        size: 'Defina o tamanho…',
        color: '…e a cor.',
        plainCss: 'Cada alteração é CSS simples, guardado para este site.',
        byHand: 'Ou escreva CSS à mão.',
        live: 'A página atualiza-se enquanto escreve.',
      },
    },
    profiles: {
      title: 'Perfis',
      looksBody: 'Guarde diferentes aspetos para o mesmo site.',
      captions: {
        createForLook: 'Crie um perfil para um novo aspeto.',
        created: '{profile} começa vazio. {defaultProfile} continua guardado.',
        newspaperLook: 'Dê-lhe um aspeto de jornal.',
        darkLook: 'Dê-lhe um aspeto escuro e acolhedor.',
        switchAnytime: 'Alterne entre eles quando quiser.',
        backToDefault: 'De volta ao {defaultProfile}. Um site, dois aspetos.',
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
      passwordManager: 'Gestor de palavras-passe',
      translate: 'Tradutor',
      webArchive: 'Arquivo web',
    },
  },
  popup: {
    readability: 'Modo legível',
    styleThisPage: 'Estilizar esta página',
  },
  editor: {
    defaultProfile: 'Padrão',
    newProfile: 'Jornal',
    newProfileDark: 'Ave noturna',
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
      font: 'Tipo de letra',
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
      noStyles: 'Ainda sem estilos',
    },
    presets: {
      readability: 'Modo legível',
      articlesOnly: 'Apenas artigos',
      readabilityDescription:
        'Transforme os artigos deste site numa leitura limpa e sem distrações, com o tema, o tipo de letra e o tamanho que preferir.',
      grayscale: 'Escala de cinzentos',
      grayscaleDescription: 'Aplicar escala de cinzentos à página.',
    },
  },
  article: {
    nav: {
      news: 'Notícias',
      travel: 'Viagens',
      signIn: 'Iniciar sessão',
    },
    kicker: 'Viagens · Grande reportagem',
    headline: 'O regresso discreto do ferry noturno',
    dek: 'Três operadores apostam que os viajantes vão trocar a velocidade por um camarote, vista para o mar e nenhum aeroporto.',
    byline: 'Marta Linde · 24 set. · 6 min de leitura',
    paragraphs: [
      'Vinte anos depois de ter sido suprimida a última travessia noturna, três operadores voltam a pôr camarotes na água. A proposta é simples: embarcar depois do jantar, dormir durante a travessia e acordar noutro país.',
      'As reservas da primeira linha reaberta esgotaram para todo o verão numa semana. A maioria dos passageiros tem menos de quarenta anos, e muitos nunca viajaram de noite, nem de comboio nem de barco. Segundo os operadores, primeiro enchem os camarotes, depois os assentos reclináveis e, por fim, o convés.',
    ],
    quote:
      '«Ninguém reserva isto para poupar tempo. Reservam para perder um pouco.»',
    quoteBy: '— Ines Varga, planeadora de rotas',
  },
  steps: {
    heading: 'Como funciona',
    counter: '{current} / {total}',
    jump: 'Saltar para este ponto',
  },
};

export default demo;
