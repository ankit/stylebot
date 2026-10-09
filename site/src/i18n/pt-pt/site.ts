import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Mude o aspeto de qualquer site',
    titleSuffix: '{title} - Stylebot',
    description:
      'Aponte para algo numa página e altere-o, ou descreva o que quer. O Stylebot escreve o CSS. Gratuito e de código aberto para Chrome, Firefox e Edge.',
  },
  header: {
    home: 'Página inicial do Stylebot',
    manual: 'Manual',
    install: 'Instalar',
    language: 'Idioma',
    suggest: 'Ver esta página em português',
    dismiss: 'Dispensar',
    theme: 'Tema: {theme}',
  },
  themes: {
    light: 'Claro',
    dark: 'Escuro',
    stylebot: 'Stylebot',
    newsprint: 'Papel de jornal',
  },
  footer: {
    changelog: 'Registo de alterações',
    donate: 'Ofereça-me um café',
  },
  store: {
    add: 'Adicionar ao {store}',
    addFree: 'Adicionar ao {store} — é grátis',
    reinstall: 'Reinstalar no {store}',
  },
  zoom: {
    label: 'Captura de ecrã ampliada',
    close: 'Fechar',
  },
  home: {
    title: '{word} qualquer site.',
    titleWord: 'Estilize',
    titleWordHint: 'Clique para mudar o estilo',
    lede: 'Aponte para algo na página e altere-o, ou simplesmente descreva o que quer. O Stylebot escreve o CSS e aplica o seu estilo sempre que voltar.',
    also: 'Também para {first} e {second}',
    installTitle: 'Instalar o Stylebot',
    installBody:
      'Gratuito e de código aberto desde 2011. Sem conta e sem rastreio. Os seus estilos ficam no seu navegador e o código está no GitHub.',
    cli: 'Usa um agente de programação? Adicione a <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copiar',
    copied: 'Copiado',
    copyCommand: 'Copiar {command}',
    title: 'Funciona com o seu agente de programação',
    body: 'O Claude Code, o Codex, o Cursor ou qualquer agente que execute comandos pode usar o Stylebot a partir do terminal.',
    guide: 'Configurar a CLI →',
    demo: {
      terminal: 'Terminal · agente de programação',
      prompt: 'quero o {site} mais fácil de ler à noite',
      done: 'Fundo escuro, texto mais quente, corpo maior com serifa. Anúncio removido.',
      before: 'Antes',
      after: 'Depois',
      kicker: 'Viagens',
      headline: 'O regresso discreto do ferry noturno',
      dek: 'Três operadores apostam que os viajantes vão trocar a velocidade por um camarote, vista para o mar e nenhum aeroporto.',
      text: 'O das 22:40, de Rostock, parte sem alarde. Quando as luzes do porto ficam para trás, a maioria dos passageiros já encontrou o seu camarote e o bar acalmou num murmúrio baixo.',
      ad: 'Anúncio',
    },
    page: {
      title: 'Linha de comandos',
      description:
        'Controle o Stylebot a partir do terminal, ou deixe que um agente de programação como o Claude Code, o Codex ou o Cursor altere o estilo dos sites no seu navegador com a sua própria subscrição.',
      heading: 'O Stylebot no seu terminal',
      lede: 'Controle o Stylebot a partir da linha de comandos, ou deixe que um agente de programação como o Claude Code, o Codex ou o Cursor o faça. O agente altera o estilo dos sites diretamente no seu navegador, com a sua própria subscrição em vez de uma chave de API.',
      setup: 'Configuração',
      install: 'Instale o Stylebot',
      installBody:
        'Para Chrome ou Edge. A linha de comandos ainda não funciona no Firefox.',
      cli: 'Instale a CLI',
      cliBody: 'Requer o Node 20 ou posterior.',
      connect: 'Ligue-a aos seus navegadores',
      connectBody:
        'Isto regista a CLI no Chrome e no Edge, para que o Stylebot a consiga encontrar.',
      access: 'Ative o acesso por linha de comandos',
      accessBody:
        'Nas opções do Stylebot, em Geral, ative <strong>Permitir que as aplicações deste computador controlem o Stylebot</strong> e aceite o que o navegador pedir.',
      plugin: 'Adicione o plugin do Claude Code',
      optional: 'Opcional',
      pluginBody: 'No Claude Code, execute:',
      tryIt: 'Depois experimente:',
      commands: 'Comandos',
      commandsBody:
        'Um agente executa-os por si, mas também os pode executar. <code>stylebot --help</code> lista-os todos.',
      examples: {
        open: 'Abre a página numa janela por trás da sua e mostra o ID do separador.',
        outline: 'Mostra os elementos visíveis da página como um esquema.',
        css: 'Guarda o CSS como estilo do site, aplica-o e verifica a página.',
        screenshot: 'Guarda uma imagem do separador.',
      },
      privacy: 'Privacidade',
      privacyBody: [
        'O acesso por linha de comandos está desativado até o ativar. Enquanto estiver ativo, as aplicações deste computador podem ler as páginas abertas, tirar capturas de ecrã e alterar os seus estilos. Pode desativá-lo nas opções do Stylebot a qualquer momento.',
        'O Stylebot e a CLI só comunicam um com o outro, neste computador, e não enviam nada para lado nenhum. Um agente envia o que lê ao seu próprio fornecedor, tal como o Claude Code faz com a Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Estilos para começar',
    lede: 'Copie um e ajuste-o, ou comece de raiz.',
    hint: 'Cole-o no separador Código em {site}.',
    enlarge: 'Ampliar {site}: {name}',
    alt: '{site} estilizado com o Stylebot: {name}',
    install: 'Instalar',
    installTitle: 'Instalar no Stylebot',
    installed: 'Instalado',
    installedAs: 'Instalado como {name}',
    installFailed: 'Não foi possível instalar',
    copy: 'Copiar CSS',
    copied: 'Copiado',
    source: 'Ver no GitHub',
    lightbox: 'Site estilizado',
    close: 'Fechar',
  },
  quotes: {
    title: 'Quem usa, adora o Stylebot',
  },
  features: {
    title: 'Tudo o resto incluído.',
    previous: 'Funcionalidade anterior',
    next: 'Funcionalidade seguinte',
    sync: {
      title: 'Sincronização',
      body: 'Ligue o Google Drive e os seus estilos acompanham-no em todos os computadores em que iniciar sessão. O Stylebot sincroniza a cada 30 minutos e logo após cada edição.',
      connected: 'Ligado ao Google Drive',
      synced: 'Sincronizado há 2 minutos',
      syncNow: 'Sincronizar agora',
      savedTo: 'Guardado em',
      disconnect: 'Desligar',
      schedule: 'Frequência',
      scheduleValue: 'A cada 30 minutos e logo após editar um estilo',
    },
    history: {
      title: 'Histórico de versões',
      body: 'Todas as alterações aos seus estilos ficam guardadas, das mais recentes para as mais antigas. Abra uma entrada para ver o que mudou e restaurá-la com um clique.',
      today: 'Hoje, 25/09',
      yesterday: 'Ontem, 24/09',
      noChanges: 'Sem alterações',
      edited: 'Editado',
      sites: '10 sites',
      current: 'Atual',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Predefinições',
      body: 'O modo legível e a escala de cinzentos funcionam em qualquer site e combinam-se com as suas próprias alterações.',
      readability: 'Modo legível',
      articlesOnly: 'Apenas artigos',
      readabilityBody:
        'Uma vista de leitura limpa, com o tema, o tipo de letra e o tamanho que preferir.',
      grayscale: 'Escala de cinzentos',
      grayscaleBody: 'Aplicar escala de cinzentos à página.',
    },
    chat: {
      title: 'Chat',
      body: 'Não usa um agente de programação? Descreva uma alteração no separador Chat e o Stylebot escreve o CSS. Use a sua própria chave do Claude, OpenAI ou Gemini, que fica no seu navegador.',
      prompt: 'Torne o artigo mais fácil de ler à noite',
      reply:
        'Mudei para um fundo escuro com texto mais quente, e pus o corpo numa serifa maior, com mais espaço entre linhas.',
      updated: 'Estilos atualizados',
      undo: 'Anular',
      placeholder: 'Descreva uma alteração',
    },
  },
  welcome: {
    title: 'Boas-vindas',
    description:
      'Como funciona o Stylebot, do início ao fim, em cerca de um minuto.',
    heading: 'O Stylebot está instalado.',
    yourTurn: 'A sua vez.',
    yourTurnBody: 'Abra qualquer site e prima o atalho. Nada muda até o fazer.',
    manual: 'Manual',
    agentTitle: 'Ligue o seu agente de programação',
    agentBody:
      'O Claude Code, o Codex, o Cursor ou qualquer agente que execute comandos pode usar o Stylebot a partir do terminal.',
    agentPrompt:
      'quero este site com um tema Everforest e tipos de letra mais bonitos',
    agentReply: 'Mudei para as cores Everforest, com Lora e Newsreader.',
  },
  goodbye: {
    title: 'Adeus',
    description: 'Obrigado por usar o Stylebot.',
    panda: 'Um panda pixelizado a acenar adeus',
    heading: 'Obrigado por usar o Stylebot.',
    lede: 'Os seus estilos foram removidos deste navegador. Se ativou a sincronização, ainda tem uma cópia de segurança no seu Google Drive.',
    changedMind: 'Mudou de ideias?',
    note: 'Trabalho no Stylebot desde 2011. Obrigado por o experimentar e por qualquer comentário que deixe.',
    signature: '— Ankit',
    feedback: {
      question: 'Porque desinstalou?',
      optional: 'Opcional, demora um segundo.',
      reasons: [
        'Já não precisava dele',
        'Difícil de usar',
        'Estragou um site',
        'Falta uma funcionalidade',
        'Demasiado lento',
        'Outro motivo',
      ],
      placeholder: 'Mais alguma coisa? (opcional)',
      send: 'Enviar comentário',
      sendNote: 'Vai diretamente para o autor.',
      thanks: 'Obrigado. Todas as mensagens são lidas.',
    },
  },
  manual: {
    title: 'Manual',
    description:
      'Como usar o Stylebot: estilizar um site, perfis, a linha de comandos, o Chat, sincronização, regras de URL e atalhos.',
    lede: 'Como funciona o Stylebot, do primeiro estilo aos perfis, ao Chat e à sincronização.',
    sections: 'Secções do manual',
    toc: {
      start: 'Primeiros passos',
      profiles: 'Perfis',
      cli: 'Linha de comandos',
      chat: 'Chat',
      presets: 'Modo legível e escala de cinzentos',
      sync: 'Sincronização, backup e histórico',
      urls: 'Regras de URL',
      shortcuts: 'Atalhos de teclado',
      help: 'Ajuda e suporte',
    },
    start: {
      open: 'Clique no ícone do Stylebot na barra de ferramentas e depois em <strong>Estilizar esta página</strong>. Ou prima [[alt+shift+M]] em qualquer separador, ou clique com o botão direito num elemento e escolha <strong>Stylebot → Estilizar elemento</strong>.',
      shot: 'O separador Básico, a escolher uma ligação num artigo da Wikipédia',
      pick: 'Clique no seletor de elementos, passe o cursor pela página e clique num elemento. Prima [[↑]] antes de clicar para selecionar o elemento pai. Depois altere-o em <strong>Básico</strong>, ou escreva CSS em <strong>Código</strong>. As alterações são guardadas à medida que as faz e aplicadas sempre que visitar o site.',
      fonts: 'Tipos de letra',
      fontsBody:
        'Pesquise entre 400 <a href="https://fonts.google.com/">Google Fonts</a> e o Stylebot carrega a que escolher, ou escreva o nome de qualquer tipo de letra instalado no seu computador.',
      position: 'Posição do editor',
      positionBody:
        'No Chrome e no Edge, o editor abre no painel lateral. Use <strong>Posição</strong> no menu <strong>⋯</strong> do editor para o abrir numa janela separada ou fixá-lo na página. O Firefox não tem painel lateral.',
      off: 'Desativar um estilo',
      offBody:
        'Use o interruptor no pop-up, ou [[alt+shift+S]]. O estilo é mantido, apenas deixa de ser aplicado.',
      callout:
        'Alguns sites usam nomes de classes gerados automaticamente, que mudam quando o site é atualizado. Se um estilo deixar de funcionar, escolha o elemento novamente para obter um seletor novo.',
    },
    profiles: {
      intro:
        'Um perfil é uma folha de estilos separada para o mesmo site, para poder ter mais do que um aspeto e alternar entre eles. Só é aplicado um de cada vez, e todos os sites começam com Padrão.',
      shot: 'O pop-up no Hacker News com quatro perfis: Violet Hour, Everforest, Hearth e Newspaper',
      manage:
        'Clique no nome do perfil ao lado do site, no cabeçalho do editor, para criar, renomear, duplicar ou eliminar perfis. Alterne entre eles aí ou no pop-up, onde <strong>Sem estilo</strong> desativa o estilo no site. Os perfis novos começam vazios.',
    },
    cli: {
      intro:
        'O comando <code>stylebot</code> permite que um agente de programação como o Claude Code, o Codex ou o Cursor altere o estilo dos sites diretamente no seu navegador, com a sua própria subscrição em vez de uma chave de API. É a melhor forma de pôr um agente a estilizar um site, e também pode executar os comandos.',
      setup: 'Configuração',
      setupBody:
        'Instale a CLI, ligue-a aos seus navegadores e depois ative <strong>Permitir que as aplicações deste computador controlem o Stylebot</strong> nas Opções. A <a href="{cli}">página da linha de comandos</a> explica cada passo. Por agora, apenas no Chrome e no Edge.',
      claudeCodeBody:
        'Adicione o plugin do Stylebot e peça uma alteração com <code>/stylebot</code>, como um tema escuro para um site.',
      privacy: 'Privacidade',
      privacyBody:
        'O acesso por linha de comandos está desativado até o ativar. O Stylebot e a CLI só comunicam um com o outro, neste computador; um agente envia o que lê ao seu próprio fornecedor.',
    },
    chat: {
      intro:
        'O Chat é ideal para ajustes rápidos. Descreva a alteração que quer no separador Chat e o Stylebot escreve o CSS. Pode escolher um elemento para indicar algo concreto, ou anexar uma captura de ecrã para mostrar o que quer dizer. Para alterações maiores, como um tema totalmente novo, use a <a href="#cli">linha de comandos</a>.',
      shot: 'O separador Chat depois de pedir um tema de floresta com um tipo de letra serifado e legível no Hacker News',
      key: 'Use a sua própria chave',
      keyBody:
        'Ligue uma chave de API do Claude, OpenAI ou Gemini. As chaves ficam guardadas apenas neste computador e nunca são sincronizadas. As mensagens vão diretamente do seu navegador para o fornecedor.',
      changes: 'Para onde vão as alterações',
      changesBody:
        'Cada alteração é aplicada de imediato e adicionada à folha de estilos do perfil atual. Clique em <strong>N linhas adicionadas</strong> para a ver em Código, ou anule-a a partir do chat.',
      cost: 'Custo',
      costBody:
        'A contagem de tokens por baixo da caixa de mensagem mostra o que a conversa já usou, com um custo estimado.',
    },
    presets: {
      intro:
        'Ambos estão no separador Predefinições e combinam-se com as suas próprias alterações. O <strong>Modo legível</strong> transforma os artigos de um site numa vista de leitura limpa, com escolha de tema, tipo de letra, tamanho e largura; as páginas que não são artigos ficam como estão. A <strong>Escala de cinzentos</strong> remove a cor do site, com a intensidade que quiser.',
      shot: 'O artigo da Wikipédia sobre Matemática no modo legível, com as definições de leitura abertas',
    },
    sync: {
      shot: 'Opções, ligado ao Google Drive e sincronizado',
      drive: 'Sincronização com o Google Drive',
      driveBody:
        'Ligue o Google Drive nas Opções. Os seus estilos, incluindo os perfis, são sincronizados a cada 30 minutos e logo após cada edição. O Stylebot só vê os ficheiros que cria no seu Drive, e não existe nenhum servidor do Stylebot.',
      conflicts: 'Conflitos',
      conflictsBody:
        'Se um estilo tiver sido alterado em dois computadores, a sua edição mais recente é mantida e a outra versão fica guardada num comentário, para que nada se perca.',
      backup: 'Backup',
      backupBody:
        'Exporte e importe todos os seus estilos em JSON a partir das Opções.',
      history: 'Histórico de versões',
      historyBody:
        'Todas as alterações feitas neste computador ficam guardadas nas Opções, incluindo as que chegam pela sincronização. Restaure qualquer versão anterior, para alguns sites ou para todos.',
      historyShot:
        'Histórico de versões nas Opções, com a alteração mais recente primeiro',
    },
    urls: {
      intro:
        'Por predefinição, o Stylebot associa os estilos aos sites pelo nome de domínio. Edite o URL de um estilo nas Opções e use estes padrões para algo mais específico.',
      wildcards: {
        anything: 'Corresponde a qualquer sequência de caracteres.',
        segment:
          'Corresponde a qualquer sequência de caracteres até encontrar uma /.',
        list: 'Separa uma lista de padrões. Um URL corresponde se algum dos padrões corresponder.',
        regex: 'No início de um URL, transforma-o numa expressão regular.',
      },
      examplesTitle: 'Exemplos',
      examples: {
        domain:
          'O domínio docs.google.com ou qualquer um dos seus subdomínios.',
        prefix: 'Qualquer URL que comece por docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com e assim por diante.',
        subdomains: 'news.ycombinator.com e apps.ycombinator.com.',
        either:
          'Qualquer um dos domínios, ou qualquer um dos seus subdomínios.',
        regex: 'Apenas a página inicial do Reddit.',
        everywhere:
          'Todos os sites. Útil para estilos que quer em todo o lado.',
      },
    },
    shortcuts: {
      intro:
        'Os atalhos globais funcionam em qualquer página que o Stylebot consiga estilizar; altere-os nas definições de atalhos do navegador, às quais pode aceder a partir das Opções. Para ver os atalhos do próprio editor, prima [[?]] no editor.',
      or: 'ou',
      unset: 'Não definido; atribua-o no navegador',
      global: 'Globais',
      picker: 'Ao escolher um elemento',
      actions: {
        toggleEditor: 'Ativar/desativar editor',
        toggleStyling: 'Ativar/desativar estilo',
        toggleReadability: 'Ativar/desativar modo legível',
        toggleGrayscale: 'Ativar/desativar escala de cinzentos',
        parent: 'Selecionar o elemento pai',
        child: 'Voltar ao elemento filho',
        select: 'Selecionar o elemento realçado',
      },
    },
    help: {
      body: 'Encontrou um erro ou tem uma ideia? Abra uma issue no <a href="{issues}">GitHub</a>. O Stylebot é gratuito e de código aberto, mantido desde 2011. Se lhe for útil, pode apoiá-lo <a href="{donate}">oferecendo-me um café</a>.',
    },
  },
  privacy: {
    title: 'Privacidade',
    description:
      'O que o Stylebot faz com os seus dados: sem servidor, sem conta, sem análises.',
    lede: 'O Stylebot não tem servidor, conta nem análises. Os seus estilos ficam no seu navegador, a menos que ative a sincronização, o chat ou a linha de comandos, e nesse caso vão diretamente para um serviço que escolheu ou uma aplicação que autorizou.',
    updated: 'Última atualização: {date}',
    browser: {
      title: 'O que fica no seu navegador',
      body: [
        'Os seus estilos, perfis, definições, histórico, conversas do chat e chaves de API são guardados no armazenamento de extensões do navegador, e desinstalar o Stylebot remove-os. O Stylebot lê as páginas que visita para as estilizar e não envia nada delas, a menos que use o chat ou a linha de comandos.',
      ],
    },
    sync: {
      title: 'Sincronização com o Google Drive',
      body: [
        'Quando liga o Google Drive nas Opções, os seus estilos são guardados num ficheiro no seu próprio Drive. O Stylebot só consegue ver os ficheiros que cria. O token de acesso fica guardado no seu navegador e expira ao fim de uma hora. Pode desligar nas Opções ou na sua <a href="https://myaccount.google.com/connections">Conta Google</a>.',
        'A utilização, pelo Stylebot, das informações recebidas das APIs da Google cumpre a <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de Dados do Utilizador dos Serviços de API da Google</a>, incluindo os requisitos de Utilização Limitada.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Quando adiciona uma chave de API e envia uma mensagem, o seu navegador envia-a diretamente para esse fornecedor, juntamente com qualquer captura de ecrã que anexe, o endereço e o título da página, um esquema do que está visível na página, o respetivo CSS e os seus estilos. Isto pode incluir informações pessoais apresentadas na página, por isso não use o chat em páginas que não partilharia com o fornecedor. Aplica-se a política do fornecedor: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Linha de comandos',
      body: [
        'Quando ativa <q>Permitir que as aplicações deste computador controlem o Stylebot</q> nas Opções, as aplicações executadas com a sua conta de utilizador podem listar os seus separadores, ler páginas, tirar capturas de ecrã, e ler e alterar os seus estilos, através de uma ligação local que só o utilizador pode usar. O que leem pode chegar aos serviços que usam, como o modelo por trás de um agente de programação. Desative a definição para desligar.',
      ],
    },
    fonts: {
      title: 'Tipos de letra e CSS importado',
      body: [
        'Os tipos de letra do Google Fonts nos seus estilos são transferidos da Google, que vê o seu endereço IP. As folhas de estilos que importa com <code>@import</code> são obtidas a partir do respetivo endereço.',
      ],
    },
    site: {
      title: 'Este site',
      body: [
        'O stylebot.dev não tem anúncios nem cookies, e está alojado no GitHub Pages, que mantém registos de servidor normais. O Plausible conta as visitas por página, origem da visita, país e tipo de dispositivo, sem cookies nem nada que o identifique.',
      ],
    },
    sharing: {
      title: 'Partilha',
      body: [
        'O Stylebot não recolhe, vende nem partilha os seus dados. Estes só saem do seu navegador para os serviços acima, quando os usa.',
      ],
    },
    contact: {
      title: 'Alterações e contacto',
      body: [
        'As alterações a esta política estão listadas no <a href="{history}">histórico do site no GitHub</a>. Envie as suas questões para <a href="mailto:{email}">{email}</a> ou abra uma <a href="{issues}">issue no GitHub</a>.',
      ],
    },
    translation:
      'Esta é uma tradução. Se diferir da <a href="{original}">versão em inglês</a>, prevalece a versão em inglês.',
  },
  releases: {
    title: 'Novidades da {version}',
    bugFixes: 'E muitas <a href="{changelog}">correções de erros</a>',
    sections: 'Secções',
    r31: {
      description:
        'O Stylebot 3.1 traz sincronização e backup com o Google Drive, um editor redimensionável e paletas de cores.',
      syncTitle: 'Sincronização e backup com o Google Drive',
      syncAlt: 'A sincronizar estilos com o Google Drive',
      syncBody: [
        'Ative e autorize a sincronização com o Google Drive na <strong>página de Opções</strong> do Stylebot.',
        'Depois de ativada, clique em <strong>Sincronizar agora</strong> no pop-up ou na página de Opções para sincronizar os estilos do navegador com os que estão guardados no Google Drive.',
      ],
      resizeTitle: 'Redimensionar o editor do Stylebot',
      resizeAlt: 'A redimensionar o editor do Stylebot',
      resizeBody:
        'Agora pode redimensionar o editor do Stylebot e, opcionalmente, fazer a página encolher para que o conteúdo não fique por baixo do editor.',
      colorsTitle: 'Paletas de cores',
      colorsAlt: 'A escolher uma cor de uma paleta',
      colorsBody:
        'Um seletor de cores melhorado, com paletas, facilita a escolha de boas cores.',
    },
    r32: {
      description:
        'O Stylebot 3.2 traz estilos mais rápidos e sem cintilação, um modo legível redesenhado e um pop-up mais limpo.',
      lede: 'O Stylebot voltou a estar em desenvolvimento ativo, com mais atualizações planeadas.',
      fasterTitle: 'Estilos mais rápidos e sem cintilação',
      fasterBody:
        'O CSS fica agora em cache e é aplicado instantaneamente, por isso as páginas já não aparecem por instantes sem estilo enquanto os seus estilos carregam, e tudo responde mais depressa.',
      readabilityTitle: 'Um modo legível redesenhado',
      readabilityAlt:
        'Os novos controlos de tema e tipografia integrados do modo legível',
      readabilityItems: [
        'Novo algoritmo de extração de artigos, melhor a limpar as páginas',
        'Ativação mais rápida, aplicada antes de o resto da página carregar',
        'Personalização integrada de tema e tipografia',
        'Animação de carregamento mais suave',
        'Atalho de teclado para o ativar e desativar',
      ],
      popupTitle: 'Um pop-up mais limpo',
      popupAlt: 'O pop-up redesenhado do Stylebot',
      popupItems: [
        'Linhas de ativação totalmente clicáveis',
        'Botão direto para as definições',
        'Suporte para modo escuro',
      ],
    },
    r40: {
      description:
        'O Stylebot 4.0 traz um editor redesenhado, uma linha de comandos para agentes de programação, perfis, um painel lateral, o Chat, histórico de versões e sincronização.',
      lede: 'Um editor redesenhado, uma linha de comandos para agentes de programação, perfis e um painel lateral.',
      toc: {
        editor: 'Editor redesenhado',
        cli: 'Linha de comandos',
        profiles: 'Perfis',
        panel: 'Painel lateral',
        history: 'Histórico de versões',
        sync: 'Sincronização',
        chat: 'Chat',
        more: 'E mais',
      },
      editorTitle: 'Um editor redesenhado',
      editorAlt:
        'O separador Básico redesenhado, a estilizar o Hacker News com um perfil Newspaper',
      editorBody: 'Reconstruído de raiz, agora com modo escuro.',
      editorItems: [
        'Controlos agrupados que mostram os valores da própria página',
        'Melhor geração de seletores, com seletores que continuam a funcionar quando um site é atualizado e outros à escolha',
        'Indica quando outra regra substitui um valor',
        'Paletas de cores e conta-gotas',
        'Pré-visualize uma cor ou um tipo de letra na página ao passar o cursor por cima',
        'Edite qualquer outra propriedade CSS no próprio sítio, em Mais propriedades',
        'Suporte para anular',
      ],
      profilesTitle: 'Perfis',
      profilesAlt: 'O pop-up num site com dois perfis, Dracula e Gruvbox',
      profilesBody:
        'Tenha vários aspetos para um site e alterne entre eles no editor ou no pop-up.',
      panelTitle: 'O painel lateral, ou uma janela própria',
      panelAlt: 'O menu do editor, com Posição definida para o painel lateral',
      panelBody:
        'No Chrome e no Edge, o editor abre no painel lateral. Também pode destacá-lo para uma janela própria, em <strong>Posição</strong> no menu <strong>⋯</strong> do editor.',
      historyTitle: 'Histórico de versões',
      historyBody:
        'Todas as alterações ficam guardadas e pode restaurar qualquer versão anterior.',
      syncTitle: 'Sincronização',
      syncBody:
        'A sincronização com o Google Drive está mais robusta. As alterações feitas em diferentes computadores são combinadas, para que nenhuma se perca. É executada automaticamente a cada 30 minutos e logo após cada edição.',
      chatTitle: 'Chat',
      chatBody:
        'Não usa um agente de programação? Descreva o que quer, ou escolha um dos aspetos sugeridos, e o Stylebot escreve o CSS. Use a sua própria chave do Claude, OpenAI ou Gemini.',
      chatAlt:
        'O separador Chat a sugerir aspetos para a página: Acolhedor, Sereno e Só as ligações a cores',
      moreTitle: 'E mais',
      moreItems: [
        'Um novo stylebot.dev',
        'Um novo ícone do Stylebot',
        'Os estilos aplicam-se agora dentro do shadow DOM, por isso funcionam em sites feitos com web components',
        'Os atalhos do Stylebot estão agora nas definições de atalhos do navegador. No Chrome e no Edge, os que tinha alterado voltaram às predefinições, por isso volte a defini-los aí.',
        'O Stylebot está agora disponível em vietnamita',
      ],
    },
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'Esta página não existe.',
    heading: 'Esta página não existe, e tem um aspeto horrível.',
    done: 'Muito melhor. A página continua a não existir, mas pelo menos agora tem bom aspeto.',
    pageTitle: '404 Não encontrado',
    pageBody: 'O URL pedido não foi encontrado neste servidor.',
    pageLink: 'Ir para a página inicial',
    nice: '✨ Pôr isto bonito',
  },
};

export default site;
