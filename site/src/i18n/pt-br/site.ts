import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Mude o visual de qualquer site',
    titleSuffix: '{title} - Stylebot',
    description:
      'Aponte para algo na página e altere, ou descreva o que você quer. O Stylebot escreve o CSS. Gratuito e de código aberto para Chrome, Firefox e Edge.',
  },
  header: {
    home: 'Página inicial do Stylebot',
    manual: 'Manual',
    install: 'Instalar',
    language: 'Idioma',
    theme: 'Tema: {theme}',
  },
  themes: {
    light: 'Claro',
    dark: 'Escuro',
    stylebot: 'Stylebot',
    newsprint: 'Jornal',
  },
  footer: {
    changelog: 'Registro de mudanças',
    donate: 'Me pague um café',
  },
  store: {
    add: 'Adicionar ao {store}',
    reinstall: 'Reinstalar no {store}',
  },
  zoom: {
    label: 'Captura de tela ampliada',
    close: 'Fechar',
  },
  home: {
    title: '{word} qualquer site.',
    titleWord: 'Estilize',
    titleWordHint: 'Clique para mudar o visual',
    lede: 'Aponte para algo na página e altere, ou simplesmente descreva o que você quer. O Stylebot escreve o CSS e aplica seu estilo toda vez que você volta.',
    also: 'Também no {first} e no {second}',
    desktopOnly:
      'O Stylebot funciona no <strong>Chrome, Firefox e Edge</strong> para computador.',
    video: 'Vídeo de demonstração do Stylebot',
    installTitle: 'Instale o Stylebot',
    installBody:
      'Gratuito e de código aberto desde 2011. Sem conta e sem rastreamento. Seus estilos ficam no seu navegador, e o código está no GitHub.',
    cli: 'Usa um agente de programação? Adicione a <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copiar',
    copied: 'Copiado',
    copyCommand: 'Copiar {command}',
    title: 'Funciona com seu agente de programação',
    body: 'O Stylebot tem uma CLI, então qualquer agente que execute comandos pode mudar o estilo de um site.',
    guide: 'Configurar a CLI →',
    demo: {
      terminal: 'Terminal · agente de programação',
      prompt: 'deixe {site} mais fácil de ler à noite',
      done: 'Fundo escuro, texto mais quente, corpo serifado maior. Anúncio removido.',
      before: 'Antes',
      after: 'Depois',
      kicker: 'Viagem',
      headline: 'A volta silenciosa da balsa noturna',
      dek: 'Três operadoras apostam que os viajantes vão trocar a velocidade por uma cabine, vista para o mar e nada de aeroporto.',
      text: 'A das 22:40 sai de Rostock sem alarde. Quando as luzes do porto ficam para trás, a maioria dos passageiros já encontrou sua cabine e o bar se acomodou em um murmúrio baixo.',
      ad: 'Anúncio',
    },
    page: {
      title: 'Linha de comando',
      description:
        'Controle o Stylebot pelo terminal ou deixe um agente de programação como o Claude Code, o Codex ou o Cursor mudar o estilo dos sites no seu navegador com a sua própria assinatura.',
      heading: 'O Stylebot no seu terminal',
      lede: 'Controle o Stylebot pela linha de comando ou deixe um agente de programação como o Claude Code, o Codex ou o Cursor fazer isso. O agente muda o estilo dos sites direto no seu navegador, usando a sua própria assinatura, sem chave de API.',
      setup: 'Configuração',
      install: 'Instale o Stylebot',
      installBody:
        'Para Chrome ou Edge. A linha de comando ainda não funciona no Firefox.',
      cli: 'Instale a CLI',
      cliBody: 'É preciso ter o Node 20 ou mais recente.',
      connect: 'Conecte aos seus navegadores',
      connectBody:
        'Isso registra a CLI no Chrome e no Edge, para que o Stylebot consiga acessá-la.',
      access: 'Ative o acesso por linha de comando',
      accessBody:
        'Nas opções do Stylebot, em Geral, ative <strong>Permitir acesso pela linha de comando</strong> e permita o que o navegador pedir.',
      plugin: 'Adicione o plugin do Claude Code',
      optional: 'Opcional',
      pluginBody: 'No Claude Code, execute:',
      tryIt: 'Depois, experimente:',
      commands: 'Comandos',
      commandsBody:
        'Um agente executa esses comandos para você, mas você também pode executá-los. <code>stylebot --help</code> lista todos.',
      examples: {
        open: 'Abre a página em uma janela atrás da sua e mostra o id da aba.',
        outline: 'Mostra a estrutura dos elementos visíveis da página.',
        css: 'Salva o CSS como estilo do site, aplica e confere a página.',
        screenshot: 'Salva uma imagem da aba.',
      },
      privacy: 'Privacidade',
      privacyBody: [
        'O acesso por linha de comando fica desativado até você ativá-lo. Enquanto estiver ativado, os apps deste computador podem ler as páginas abertas, tirar capturas de tela e alterar seus estilos. Desative nas opções do Stylebot quando quiser.',
        'O Stylebot e a CLI só se comunicam entre si, neste computador, e não enviam nada para lugar nenhum. Um agente envia o que lê ao próprio provedor, como o Claude Code faz com a Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Estilos para começar',
    lede: 'Copie um e ajuste do seu jeito, ou comece do zero.',
    hint: 'Cole na aba Código em {site}.',
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
    title: 'Quem usa adora o Stylebot',
  },
  features: {
    title: 'E tudo o mais que vem junto.',
    previous: 'Recurso anterior',
    next: 'Próximo recurso',
    sync: {
      title: 'Sincronização',
      body: 'Conecte o Google Drive e seus estilos acompanham você em todos os computadores em que você entrar. O Stylebot sincroniza a cada 30 minutos e logo depois que você edita.',
      connected: 'Conectado ao Google Drive',
      synced: 'Sincronizado há 2 minutos',
      syncNow: 'Sincronizar agora',
      savedTo: 'Salvo em',
      disconnect: 'Desconectar',
      schedule: 'Frequência',
      scheduleValue: 'A cada 30 minutos e logo depois que você edita um estilo',
    },
    history: {
      title: 'Histórico de versões',
      body: 'Cada alteração nos seus estilos fica salva, das mais recentes para as mais antigas. Abra uma entrada para ver o que mudou e restaurá-la com um clique.',
      today: 'Hoje, 25 de set.',
      yesterday: 'Ontem, 24 de set.',
      noChanges: 'Sem alterações',
      edited: 'Editado',
      sites: '10 sites',
      current: 'Atual',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Predefinições',
      body: 'O modo legível e a escala de cinza funcionam em qualquer site e se somam às suas próprias mudanças.',
      readability: 'Modo legível',
      articlesOnly: 'Somente artigos',
      readabilityBody:
        'Uma leitura limpa, com o tema, a fonte e o tamanho que você preferir.',
      grayscale: 'Escala de cinza',
      grayscaleBody: 'Aplicar escala de cinza à página.',
    },
  },
  welcome: {
    title: 'Boas-vindas',
    description:
      'Como o Stylebot funciona, do início ao fim, em cerca de um minuto.',
    heading: 'O Stylebot está instalado.',
    yourTurn: 'Sua vez.',
    yourTurnBody:
      'Abra qualquer site e pressione o atalho. Nada muda até você fazer isso.',
    manual: 'Manual',
    agentTitle: 'Usa um agente de programação?',
    agentBody:
      'Você também pode adicionar a CLI do Stylebot para que seu agente mude o estilo dos sites para você.',
    agentPrompt:
      'coloca um tema Everforest neste site, com fontes mais bonitas',
    agentReply: 'Mudei para as cores do Everforest, com Lora e Newsreader.',
  },
  goodbye: {
    title: 'Até logo',
    description: 'Obrigado por usar o Stylebot.',
    heading: 'Obrigado por usar o Stylebot.',
    lede: 'Seus estilos foram removidos deste navegador. Se você ativou a sincronização, ainda há um backup no seu Google Drive.',
    changedMind: 'Mudou de ideia?',
    feedback: {
      question: 'Por que você desinstalou?',
      reasons: [
        'Não precisava mais',
        'Difícil de usar',
        'Quebrou um site',
        'Falta um recurso',
        'Muito lento',
        'Outro motivo',
      ],
      placeholder: 'Algo mais? (opcional)',
      send: 'Enviar comentário',
      thanks: 'Obrigado por enviar seu comentário.',
    },
  },
  manual: {
    title: 'Manual',
    description:
      'Como usar o Stylebot: estilizar um site, perfis, a linha de comando, sincronização, regras de URL e atalhos.',
    lede: 'Como o Stylebot funciona, do seu primeiro estilo aos perfis e à sincronização.',
    sections: 'Seções do manual',
    toc: {
      start: 'Primeiros passos',
      profiles: 'Perfis',
      presets: 'Predefinições',
      sync: 'Sincronização e histórico de versões',
      urls: 'Regras de URL',
      cli: 'CLI',
      shortcuts: 'Atalhos de teclado',
      help: 'Ajuda e suporte',
    },
    start: {
      open: 'Clique no ícone do Stylebot na barra de ferramentas e depois em <strong>Estilizar esta página</strong>. Ou pressione [[alt+shift+M]] em qualquer aba, ou clique com o botão direito em um elemento e escolha <strong>Stylebot → Estilizar elemento</strong>.',
      shot: 'A aba Básico, escolhendo um link em um artigo da Wikipédia',
      pick: 'Clique no seletor de elementos, passe o mouse sobre a página e clique em um elemento. Pressione [[↑]] antes de clicar para selecionar o elemento pai. Depois altere-o em <strong>Básico</strong> ou escreva CSS em <strong>Código</strong>. As mudanças são salvas na hora e aplicadas toda vez que você visita o site.',
      fonts: 'Fontes',
      fontsBody:
        'Pesquise entre 400 <a href="https://fonts.google.com/">Google Fonts</a> e o Stylebot carrega a que você escolher, ou digite qualquer fonte instalada no seu computador.',
      position: 'Posição do editor',
      positionBody:
        'No Chrome e no Edge, o editor abre no painel lateral. Use <strong>Posição</strong> no menu <strong>⋯</strong> dele para abri-lo em uma janela separada ou fixá-lo na página. O Firefox não tem painel lateral.',
      off: 'Desativar um estilo',
      offBody:
        'Use o botão no pop-up ou [[alt+shift+S]]. O estilo é mantido, só não é aplicado.',
      callout:
        'Alguns sites usam nomes de classe gerados automaticamente, que mudam quando o site é atualizado. Se um estilo parar de funcionar, escolha o elemento de novo para obter um seletor atualizado.',
    },
    profiles: {
      intro:
        'Um perfil é uma folha de estilo separada para o mesmo site, para você manter mais de um visual e alternar entre eles. Só um é aplicado por vez, e todo site começa com o Padrão.',
      shot: 'O pop-up no Hacker News com quatro perfis: Violet Hour, Everforest, Hearth e Newspaper',
      manage:
        'Clique no nome do perfil ao lado do site, no cabeçalho do editor, para criar, renomear, duplicar ou excluir perfis. Alterne entre eles ali ou no pop-up, onde <strong>Sem estilo</strong> desativa o estilo no site. Perfis novos começam vazios.',
    },
    cli: {
      intro:
        'O comando <code>stylebot</code> permite que um agente de programação como o Claude Code, o Codex ou o Cursor mude o estilo dos sites direto no seu navegador, usando a sua própria assinatura, sem chave de API. Você também pode executar os comandos.',
      setup: 'Configuração',
      setupBody:
        'Instale a CLI, conecte aos seus navegadores e ative <strong>Permitir acesso pela linha de comando</strong> nas Opções. A <a href="{cli}">página da CLI</a> explica cada passo. Por enquanto, só no Chrome e no Edge.',
      claudeCodeBody:
        'Adicione o plugin do Stylebot e peça uma mudança com <code>/stylebot</code>, como um tema escuro para um site.',
      privacy: 'Privacidade',
      privacyBody:
        'O acesso à CLI fica desativado até você ativá-lo. O Stylebot e a CLI só se comunicam entre si, neste computador; um agente envia o que lê ao próprio provedor.',
    },
    presets: {
      intro:
        'A aba Predefinições tem duas, e as duas se somam às suas próprias mudanças. O <strong>Modo legível</strong> transforma os artigos de um site em uma leitura limpa, com tema, fonte, tamanho e largura à sua escolha; páginas que não são artigos ficam como estão. A <strong>Escala de cinza</strong> remove a cor do site, na intensidade que você quiser.',
      shot: 'O artigo da Wikipédia sobre Matemática no modo legível, com as configurações de leitura abertas',
    },
    sync: {
      shot: 'Opções, conectado ao Google Drive e sincronizado',
      drive: 'Sincronização com o Google Drive',
      driveBody:
        'Conecte o Google Drive nas Opções. Seus estilos, incluindo os perfis, são sincronizados a cada 30 minutos e logo depois que você edita. O Stylebot só vê os arquivos que cria no seu Drive, e não existe servidor do Stylebot.',
      conflicts: 'Conflitos',
      conflictsBody:
        'Se um estilo mudou em dois computadores, sua edição mais recente é mantida e a outra versão fica salva em um comentário, então nada se perde.',
      backup: 'Backup',
      backupBody: 'Exporte e importe todos os seus estilos em JSON nas Opções.',
      history: 'Histórico de versões',
      historyBody:
        'Cada alteração neste computador fica salva nas Opções, incluindo as que chegam pela sincronização. Restaure qualquer versão anterior, de alguns sites ou de todos.',
      historyShot:
        'Histórico de versões nas Opções, com a alteração mais recente primeiro',
    },
    urls: {
      intro:
        'Por padrão, o Stylebot associa estilos a sites pelo nome de domínio. Edite a URL de um estilo nas Opções e use estes padrões para algo mais específico.',
      wildcards: {
        anything: 'Corresponde a qualquer sequência de caracteres.',
        segment:
          'Corresponde a qualquer sequência de caracteres até encontrar uma /.',
        list: 'Separa uma lista de padrões. Uma URL corresponde se qualquer um dos padrões corresponder.',
        regex: 'No início de uma URL, transforma-a em uma expressão regular.',
      },
      examplesTitle: 'Exemplos',
      examples: {
        domain: 'O domínio docs.google.com ou qualquer um de seus subdomínios.',
        prefix: 'Qualquer URL que comece com docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com e assim por diante.',
        subdomains: 'news.ycombinator.com e apps.ycombinator.com.',
        either: 'Qualquer um dos dois domínios ou seus subdomínios.',
        regex: 'Só a página inicial do Reddit.',
        everywhere:
          'Todos os sites. Útil para estilos que você quer em todo lugar.',
      },
    },
    shortcuts: {
      intro:
        'Os atalhos globais funcionam em qualquer página que o Stylebot pode estilizar; altere-os nas configurações de atalhos do seu navegador, com link nas Opções. Para ver os atalhos do próprio editor, pressione [[?]] no editor.',
      or: 'ou',
      unset: 'Não definido; defina no seu navegador',
      global: 'Globais',
      picker: 'Ao escolher um elemento',
      actions: {
        toggleEditor: 'Ativar/desativar editor',
        toggleStyling: 'Ativar/desativar estilo',
        toggleReadability: 'Ativar/desativar modo legível',
        toggleGrayscale: 'Ativar/desativar escala de cinza',
        parent: 'Selecionar o elemento pai',
        child: 'Voltar ao elemento filho',
        select: 'Selecionar o elemento destacado',
      },
    },
    help: {
      body: 'Encontrou um bug ou tem uma ideia? Abra uma issue no <a href="{issues}">GitHub</a>. O Stylebot é gratuito e de código aberto, mantido desde 2011. Se ele for útil para você, dá para apoiá-lo <a href="{donate}">me pagando um café</a>.',
    },
  },
  privacy: {
    title: 'Privacidade',
    description:
      'O que o Stylebot faz com seus dados: sem servidor, sem conta, sem análise de uso.',
    lede: 'O Stylebot não tem servidor, conta nem análise de uso, e não coleta, vende nem compartilha seus dados. Eles só saem do seu navegador quando você usa um dos recursos abaixo.',
    updated: 'Última atualização: {date}',
    browser: {
      title: 'No seu navegador',
      body: [
        'Seus estilos, configurações e histórico ficam salvos no seu navegador, e desinstalar o Stylebot remove tudo isso. As fontes do Google Fonts e as folhas de estilo que você importa com <code>@import</code> são baixadas de onde estão hospedadas, e quem as hospeda vê seu endereço IP.',
      ],
    },
    sync: {
      title: 'Sincronização com o Google Drive',
      body: [
        'Ao conectar o Google Drive nas Opções, seus estilos são salvos em um arquivo no seu próprio Drive. O Stylebot só consegue ver os arquivos que ele cria, e o token de acesso fica no seu navegador. Desconecte nas Opções ou na sua <a href="https://myaccount.google.com/connections">Conta do Google</a>.',
        'O uso que o Stylebot faz das informações recebidas das APIs do Google segue a <a href="https://developers.google.com/terms/api-services-user-data-policy">Política de dados do usuário dos serviços de API do Google</a>, incluindo os requisitos de uso limitado.',
      ],
    },
    cli: {
      title: 'Linha de comando',
      body: [
        'Ativar <q>Permitir acesso pela linha de comando</q> nas Opções permite que os apps executados com o seu usuário leiam suas abas, páginas e estilos, tirem capturas de tela e alterem seus estilos, por uma conexão local. O que eles leem pode chegar aos serviços que usam, como o modelo de um agente de programação.',
      ],
    },
    site: {
      title: 'Este site',
      body: [
        'O stylebot.dev não tem anúncios nem cookies. Ele é hospedado no GitHub Pages, que mantém registros de servidor, e o Plausible conta as visitas e os cliques sem identificar você.',
      ],
    },
    translation:
      'Esta é uma tradução. Se ela divergir da <a href="{original}">versão em inglês</a>, vale a versão em inglês.',
  },
  releases: {
    title: 'Novidades da versão {version}',
    bugFixes: 'E muitas <a href="{changelog}">correções de bugs</a>',
    sections: 'Seções',
    r31: {
      description:
        'O Stylebot 3.1 traz sincronização e backup com o Google Drive, um editor redimensionável e paletas de cores.',
      syncTitle: 'Sincronização e backup com o Google Drive',
      syncAlt: 'Sincronizando estilos com o Google Drive',
      syncBody: [
        'Ative e autorize a sincronização com o Google Drive na <strong>página de Opções</strong> do Stylebot.',
        'Depois de ativá-la, clique em <strong>Sincronizar agora</strong> no pop-up ou na página de Opções para sincronizar os estilos do seu navegador com os que estão salvos no Google Drive.',
      ],
      resizeTitle: 'Redimensione o editor do Stylebot',
      resizeAlt: 'Redimensionando o editor do Stylebot',
      resizeBody:
        'Agora você pode redimensionar o editor do Stylebot e, se quiser, fazer a página encolher para que o conteúdo não fique por baixo do editor.',
      colorsTitle: 'Paletas de cores',
      colorsAlt: 'Escolhendo uma cor de uma paleta',
      colorsBody:
        'Um seletor de cores melhorado, com paletas, facilita escolher boas cores.',
    },
    r32: {
      description:
        'O Stylebot 3.2 traz estilo mais rápido e sem piscar, um modo legível redesenhado e um pop-up mais limpo.',
      lede: 'O Stylebot voltou a ser desenvolvido ativamente, com mais atualizações planejadas.',
      fasterTitle: 'Estilo mais rápido e sem piscar',
      fasterBody:
        'O CSS agora fica em cache e é aplicado na hora, então as páginas não piscam mais sem estilo enquanto seus estilos carregam, e tudo fica mais ágil.',
      readabilityTitle: 'Um modo legível redesenhado',
      readabilityAlt:
        'Os novos controles de tema e tipografia do modo legível, na própria página',
      readabilityItems: [
        'Novo algoritmo de extração de artigos, melhor para limpar as páginas',
        'Ativação mais rápida, aplicada antes de o resto da página carregar',
        'Personalização de tema e tipografia na própria página',
        'Animação de carregamento mais suave',
        'Atalho de teclado para ativar e desativar',
      ],
      popupTitle: 'Um pop-up mais limpo',
      popupAlt: 'O pop-up redesenhado do Stylebot',
      popupItems: [
        'Linhas de ativação totalmente clicáveis',
        'Botão direto para as configurações',
        'Suporte ao modo escuro',
      ],
    },
    r40: {
      description:
        'O Stylebot 4.0 traz um editor redesenhado, uma linha de comando para agentes de programação, perfis, um painel lateral, o Chat, histórico de versões e sincronização.',
      lede: 'Um editor redesenhado, uma linha de comando para agentes de programação, perfis e um painel lateral.',
      toc: {
        editor: 'Editor redesenhado',
        cli: 'Linha de comando',
        profiles: 'Perfis',
        panel: 'Painel lateral',
        history: 'Histórico de versões',
        sync: 'Sincronização',
        chat: 'Chat',
        more: 'E mais',
      },
      editorTitle: 'Um editor redesenhado',
      editorAlt:
        'A aba Básico redesenhada, estilizando o Hacker News com um perfil Newspaper',
      editorBody: 'Refeito do zero, agora com modo escuro.',
      editorItems: [
        'Controles agrupados que mostram os valores da própria página',
        'Seletores melhores, que continuam funcionando quando o site é atualizado, e outros para escolher',
        'Mostra quando outra regra sobrescreve um valor',
        'Paletas de cores e conta-gotas',
        'Passe o mouse sobre uma cor ou fonte para vê-la na página',
        'Edite qualquer outra propriedade CSS ali mesmo, em Mais propriedades',
        'Desfazer',
      ],
      profilesTitle: 'Perfis',
      profilesAlt: 'O pop-up em um site com dois perfis, Dracula e Gruvbox',
      profilesBody:
        'Guarde vários visuais para um site e alterne entre eles pelo editor ou pelo pop-up.',
      panelTitle: 'O painel lateral, ou uma janela própria',
      panelAlt: 'O menu do editor, com Posição definida como painel lateral',
      panelBody:
        'No Chrome e no Edge, o editor abre no painel lateral. Ou abra-o em uma janela própria, em <strong>Posição</strong> no menu <strong>⋯</strong> do editor.',
      historyTitle: 'Histórico de versões',
      historyBody:
        'Cada alteração fica salva, e você pode restaurar qualquer versão anterior.',
      syncTitle: 'Sincronização',
      syncBody:
        'A sincronização com o Google Drive está mais robusta. As edições de computadores diferentes são mescladas, então nenhuma se perde. Ela roda sozinha a cada 30 minutos e logo depois que você edita.',
      chatTitle: 'Chat',
      chatBody:
        'Não usa um agente de programação? Descreva o que você quer, ou escolha um visual sugerido, e o Stylebot escreve o CSS. Use sua própria chave do Claude, OpenAI ou Gemini.',
      chatAlt:
        'A aba Chat sugerindo visuais para a página: Aconchegante, Tranquilo e Só os links em cor',
      moreTitle: 'E mais',
      moreItems: [
        'Um novo stylebot.dev',
        'Um novo ícone do Stylebot',
        'Os estilos agora se aplicam dentro do shadow DOM, então funcionam em sites feitos com web components',
        'Os atalhos do Stylebot agora ficam nas configurações de atalhos do navegador. No Chrome e no Edge, os que você tinha alterado voltaram ao padrão; defina-os de novo lá.',
        'O Stylebot agora está disponível em vietnamita',
      ],
    },
  },
  notFound: {
    title: 'Página não encontrada',
    description: 'Esta página não existe.',
    heading: 'Esta página não existe, e está horrível.',
    done: 'Bem melhor. A página continua não existindo, mas pelo menos agora está bonita.',
    pageTitle: '404 Não encontrado',
    pageBody: 'A URL solicitada não foi encontrada neste servidor.',
    pageLink: 'Ir para a página inicial',
    nice: '✨ Só deixe bonito',
  },
};

export default site;
