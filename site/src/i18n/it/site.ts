import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Personalizza qualsiasi sito',
    titleSuffix: '{title} - Stylebot',
    description:
      'Indica qualcosa in una pagina e modificalo, oppure descrivi cosa vuoi. Stylebot scrive il CSS. Gratuito e open source per Chrome, Firefox ed Edge.',
  },
  header: {
    home: 'Home di Stylebot',
    manual: 'Manuale',
    install: 'Installa',
    language: 'Lingua',
    suggest: 'Visualizza questa pagina in italiano',
    dismiss: 'Ignora',
    theme: 'Tema: {theme}',
  },
  themes: {
    light: 'Chiaro',
    dark: 'Scuro',
    stylebot: 'Stylebot',
    newsprint: 'Giornale',
  },
  footer: {
    changelog: 'Registro modifiche',
    donate: 'Offrimi un caffè',
  },
  store: {
    add: 'Aggiungi a {store}',
    addFree: 'Aggiungi a {store}: è gratis',
    reinstall: 'Reinstalla per {store}',
  },
  zoom: {
    label: 'Screenshot ingrandito',
    close: 'Chiudi',
  },
  home: {
    title: '{word} qualsiasi sito.',
    titleWord: 'Ridisegna',
    titleWordHint: 'Fai clic per cambiare stile',
    lede: 'Indica qualcosa nella pagina e modificalo, oppure descrivi semplicemente cosa vuoi. Stylebot scrive il CSS e applica il tuo stile ogni volta che torni.',
    also: 'Anche su {first} e {second}',
    installTitle: 'Installa Stylebot',
    installBody:
      'Gratuito e open source dal 2011. Nessun account e nessun tracciamento. I tuoi stili restano nel tuo browser e il codice è su GitHub.',
    cli: 'Usi un agente di programmazione? Aggiungi la <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copia',
    copied: 'Copiato',
    copyCommand: 'Copia {command}',
    title: 'Funziona con il tuo agente di programmazione',
    body: 'Claude Code, Codex, Cursor o qualsiasi agente che esegue comandi può usare Stylebot dal terminale.',
    guide: 'Configura la CLI →',
    demo: {
      terminal: 'Terminale · agente di programmazione',
      prompt: 'rendi {site} più facile da leggere di notte',
      done: 'Sfondo scuro, testo più caldo, corpo serif più grande. Annuncio rimosso.',
      before: 'Prima',
      after: 'Dopo',
      kicker: 'Viaggi',
      headline: 'Il ritorno silenzioso del traghetto notturno',
      dek: 'Tre compagnie scommettono che i viaggiatori rinunceranno alla velocità in cambio di una cabina, una vista sul mare e niente aeroporto.',
      text: 'Il traghetto delle 22:40 da Rostock parte senza clamore. Quando le luci del porto restano alle spalle, quasi tutti i passeggeri hanno trovato la loro cabina e al bar è rimasto solo un brusio sommesso.',
      ad: 'Annuncio',
    },
    page: {
      title: 'Riga di comando',
      description:
        'Controlla Stylebot dal terminale, oppure lascia che un agente di programmazione come Claude Code, Codex o Cursor personalizzi i siti nel tuo browser con il tuo abbonamento.',
      heading: 'Stylebot dal terminale',
      lede: 'Controlla Stylebot dalla riga di comando, oppure lascia che lo faccia un agente di programmazione come Claude Code, Codex o Cursor. L’agente personalizza i siti direttamente nel tuo browser, usando il tuo abbonamento invece di una chiave API.',
      setup: 'Configurazione',
      install: 'Installa Stylebot',
      installBody:
        'Per Chrome o Edge. La riga di comando non funziona ancora su Firefox.',
      cli: 'Installa la CLI',
      cliBody: 'Richiede Node 20 o versioni successive.',
      connect: 'Collegala ai tuoi browser',
      connectBody:
        'Così la CLI viene registrata in Chrome ed Edge e Stylebot può raggiungerla.',
      access: 'Attiva l’accesso da riga di comando',
      accessBody:
        'Nelle opzioni di Stylebot, in Generali, attiva <strong>Consenti alle app di questo computer di controllare Stylebot</strong> e concedi ciò che chiede il browser.',
      plugin: 'Aggiungi il plugin per Claude Code',
      optional: 'Facoltativo',
      pluginBody: 'In Claude Code, esegui:',
      tryIt: 'Poi provalo:',
      commands: 'Comandi',
      commandsBody:
        'Li esegue un agente per te, ma puoi eseguirli anche tu. <code>stylebot --help</code> li elenca tutti.',
      examples: {
        open: 'Apre la pagina in una finestra dietro la tua e stampa l’ID della scheda.',
        outline: 'Stampa gli elementi visibili della pagina come struttura.',
        css: 'Salva il CSS come stile del sito, lo applica e controlla la pagina.',
        screenshot: 'Salva un’immagine della scheda.',
      },
      privacy: 'Privacy',
      privacyBody: [
        'L’accesso da riga di comando è disattivato finché non lo attivi. Quando è attivo, le app di questo computer possono leggere le pagine che hai aperto, acquisire screenshot e modificare i tuoi stili. Puoi disattivarlo in qualsiasi momento nelle opzioni di Stylebot.',
        'Stylebot e la CLI comunicano solo tra loro, su questo computer, e non inviano nulla altrove. Un agente invia ciò che legge al proprio provider, come fa Claude Code con Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Stili da cui partire',
    lede: 'Copiane uno e adattalo ai tuoi gusti, oppure parti da zero.',
    hint: 'Incollalo nella scheda Codice su {site}.',
    enlarge: 'Ingrandisci {site}: {name}',
    alt: '{site} personalizzato con Stylebot: {name}',
    install: 'Installa',
    installTitle: 'Installa in Stylebot',
    installed: 'Installato',
    installedAs: 'Installato come {name}',
    installFailed: 'Installazione non riuscita',
    copy: 'Copia CSS',
    copied: 'Copiato',
    source: 'Vedi su GitHub',
    lightbox: 'Sito personalizzato',
    close: 'Chiudi',
  },
  quotes: {
    title: 'Chi usa Stylebot lo adora',
  },
  features: {
    title: 'E non finisce qui.',
    previous: 'Funzione precedente',
    next: 'Funzione successiva',
    sync: {
      title: 'Sincronizzazione',
      body: 'Collega Google Drive e i tuoi stili ti seguono su ogni computer a cui accedi. Stylebot sincronizza ogni 30 minuti e subito dopo ogni modifica.',
      connected: 'Connesso a Google Drive',
      synced: 'Sincronizzato 2 minuti fa',
      syncNow: 'Sincronizza ora',
      savedTo: 'Salvato in',
      disconnect: 'Disconnetti',
      schedule: 'Frequenza',
      scheduleValue: 'Ogni 30 minuti e subito dopo che modifichi uno stile',
    },
    history: {
      title: 'Cronologia versioni',
      body: 'Ogni modifica ai tuoi stili viene conservata, dalla più recente. Apri una voce per vedere cosa è cambiato e ripristinala con un clic.',
      today: 'Oggi, 25 set',
      yesterday: 'Ieri, 24 set',
      noChanges: 'Nessuna modifica',
      edited: 'Modificato',
      sites: '10 siti',
      current: 'Attuale',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Preimpostazioni',
      body: 'Leggibilità e scala di grigi funzionano su qualsiasi sito e si sommano alle tue modifiche.',
      readability: 'Leggibilità',
      articlesOnly: 'Solo articoli',
      readabilityBody:
        'Una vista di lettura pulita, con tema, carattere e dimensione a tua scelta.',
      grayscale: 'Scala di grigi',
      grayscaleBody: 'Applica la scala di grigi alla pagina.',
    },
    chat: {
      title: 'Chat',
      body: 'Niente agente di programmazione? Descrivi una modifica nella scheda Chat e Stylebot scrive il CSS. Usa la tua chiave di Claude, OpenAI o Gemini, che resta nel tuo browser.',
      prompt: 'Rendi l’articolo più facile da leggere di notte',
      reply:
        'Ho messo uno sfondo scuro con testo più caldo e un corpo serif più grande, con più interlinea.',
      updated: 'Stili aggiornati',
      undo: 'Annulla',
      placeholder: 'Descrivi una modifica',
    },
  },
  welcome: {
    title: 'Benvenuto',
    description:
      'Come funziona Stylebot, dall’inizio alla fine, in circa un minuto.',
    heading: 'Stylebot è installato.',
    yourTurn: 'Tocca a te.',
    yourTurnBody:
      'Apri un sito qualsiasi e premi la scorciatoia. Non cambia nulla finché non lo fai tu.',
    manual: 'Manuale',
    agentTitle: 'Collega il tuo agente di programmazione',
    agentBody:
      'Claude Code, Codex, Cursor o qualsiasi agente che esegue comandi può usare Stylebot dal terminale.',
    agentPrompt: 'dai a questo sito un tema Everforest con caratteri più belli',
    agentReply: 'Ho applicato i colori Everforest, con Lora e Newsreader.',
  },
  goodbye: {
    title: 'Arrivederci',
    description: 'Grazie per aver usato Stylebot.',
    panda: 'Un panda in pixel art che saluta',
    heading: 'Grazie per aver usato Stylebot.',
    lede: 'I tuoi stili sono stati rimossi da questo browser. Se avevi attivato la sincronizzazione, un backup è ancora nel tuo Google Drive.',
    changedMind: 'Hai cambiato idea?',
    note: 'Lavoro a Stylebot dal 2011. Grazie per averlo provato e per qualsiasi feedback vorrai lasciare.',
    signature: '— Ankit',
    feedback: {
      question: 'Perché l’hai disinstallato?',
      optional: 'Facoltativo, ci vuole un secondo.',
      reasons: [
        'Non mi serviva più',
        'Difficile da usare',
        'Ha rotto un sito',
        'Manca una funzione',
        'Troppo lento',
        'Altro',
      ],
      placeholder: 'Qualcos’altro? (facoltativo)',
      send: 'Invia feedback',
      sendNote: 'Arriva direttamente allo sviluppatore.',
      thanks: 'Grazie. Leggo ogni messaggio.',
    },
  },
  manual: {
    title: 'Manuale',
    description:
      'Come usare Stylebot: personalizzare un sito, profili, riga di comando, Chat, sincronizzazione, regole URL e scorciatoie.',
    lede: 'Come funziona Stylebot, dal tuo primo stile ai profili, a Chat e alla sincronizzazione.',
    sections: 'Sezioni del manuale',
    toc: {
      start: 'Per iniziare',
      profiles: 'Profili',
      cli: 'Riga di comando',
      chat: 'Chat',
      presets: 'Leggibilità e scala di grigi',
      sync: 'Sincronizzazione, backup e cronologia',
      urls: 'Regole URL',
      shortcuts: 'Scorciatoie da tastiera',
      help: 'Aiuto e supporto',
    },
    start: {
      open: 'Fai clic sull’icona di Stylebot nella barra degli strumenti, poi su <strong>Personalizza questa pagina</strong>. Oppure premi [[alt+shift+M]] in qualsiasi scheda, o fai clic destro su un elemento e scegli <strong>Stylebot → Personalizza elemento</strong>.',
      shot: 'La scheda Di base, mentre seleziona un link in un articolo di Wikipedia',
      pick: 'Fai clic sul selettore, passa il mouse sulla pagina e fai clic su un elemento. Premi [[↑]] prima di fare clic per selezionare invece l’elemento padre. Poi modificalo in <strong>Di base</strong>, oppure scrivi CSS in <strong>Codice</strong>. Le modifiche si salvano mentre le fai e si applicano ogni volta che visiti il sito.',
      fonts: 'Caratteri',
      fontsBody:
        'Cerca tra 400 <a href="https://fonts.google.com/">Google Fonts</a> e Stylebot carica quello che scegli, oppure digita il nome di qualsiasi carattere installato sul tuo computer.',
      position: 'Posizione dell’editor',
      positionBody:
        'In Chrome ed Edge l’editor si apre nel pannello laterale. Usa <strong>Posizione</strong> nel suo menu <strong>⋯</strong> per aprirlo in una finestra separata o agganciarlo alla pagina. Firefox non ha il pannello laterale.',
      off: 'Disattivare uno stile',
      offBody:
        'Usa l’interruttore nel popup, oppure [[alt+shift+S]]. Lo stile resta salvato, ma non viene applicato.',
      callout:
        'Alcuni siti usano nomi di classe generati automaticamente, che cambiano quando il sito si aggiorna. Se uno stile smette di funzionare, seleziona di nuovo l’elemento per ottenere un nuovo selettore.',
    },
    profiles: {
      intro:
        'Un profilo è un foglio di stile separato per lo stesso sito: così puoi tenere più di un aspetto e passare dall’uno all’altro. Se ne applica uno alla volta e ogni sito parte da Predefinito.',
      shot: 'Il popup su Hacker News con quattro profili: Violet Hour, Everforest, Hearth e Newspaper',
      manage:
        'Fai clic sul nome del profilo accanto al sito, nell’intestazione dell’editor, per creare, rinominare, duplicare o eliminare i profili. Puoi passare dall’uno all’altro lì o nel popup, dove <strong>Nessuno stile</strong> disattiva la personalizzazione per il sito. I nuovi profili partono vuoti.',
    },
    cli: {
      intro:
        'Il comando <code>stylebot</code> permette a un agente di programmazione come Claude Code, Codex o Cursor di personalizzare i siti direttamente nel tuo browser, usando il tuo abbonamento invece di una chiave API. È il modo migliore per far personalizzare un sito a un agente, e puoi eseguire i comandi anche tu.',
      setup: 'Configurazione',
      setupBody:
        'Installa la CLI, collegala ai tuoi browser, poi attiva <strong>Consenti alle app di questo computer di controllare Stylebot</strong> nelle Opzioni. La <a href="{cli}">pagina sulla riga di comando</a> ti guida passo passo. Per ora solo Chrome ed Edge.',
      claudeCodeBody:
        'Aggiungi il plugin di Stylebot e chiedi una modifica con <code>/stylebot</code>, ad esempio un tema scuro per un sito.',
      privacy: 'Privacy',
      privacyBody:
        'L’accesso da riga di comando è disattivato finché non lo attivi. Stylebot e la CLI comunicano solo tra loro, su questo computer; un agente invia ciò che legge al proprio provider.',
    },
    chat: {
      intro:
        'Chat è l’ideale per piccoli ritocchi. Descrivi la modifica che vuoi nella scheda Chat e Stylebot scrive il CSS. Puoi scegliere un elemento per indicare a cosa ti riferisci, o allegare uno screenshot per mostrare cosa intendi. Per modifiche più ampie, come un tema tutto nuovo, usa la <a href="#cli">riga di comando</a>.',
      shot: 'La scheda Chat dopo aver chiesto un tema ispirato alla foresta con un carattere serif leggibile su Hacker News',
      key: 'Usa la tua chiave',
      keyBody:
        'Collega una chiave API di Claude, OpenAI o Gemini. Le chiavi sono salvate solo su questo computer e mai sincronizzate. I messaggi vanno direttamente dal tuo browser al provider.',
      changes: 'Dove finiscono le modifiche',
      changesBody:
        'Ogni modifica viene applicata subito e aggiunta al foglio di stile del profilo attuale. Fai clic su <strong>N righe aggiunte</strong> per vederla in Codice, oppure annullala dalla chat.',
      cost: 'Costo',
      costBody:
        'Il conteggio dei token sotto la casella del messaggio mostra quanto ha usato la conversazione, con un costo stimato.',
    },
    presets: {
      intro:
        'Si trovano entrambe nella scheda Preimpostazioni e si sommano alle tue modifiche. <strong>Leggibilità</strong> trasforma gli articoli di un sito in una vista di lettura pulita, con tema, carattere, dimensione e larghezza a scelta, e lascia stare le pagine che non sono articoli. <strong>Scala di grigi</strong> toglie il colore al sito, con l’intensità che vuoi.',
      shot: 'L’articolo di Wikipedia sulla Matematica nella vista Leggibilità, con le impostazioni di lettura aperte',
    },
    sync: {
      shot: 'Opzioni, connesso a Google Drive e sincronizzato',
      drive: 'Sincronizzazione con Google Drive',
      driveBody:
        'Collega Google Drive nelle Opzioni. I tuoi stili, profili compresi, si sincronizzano ogni 30 minuti e subito dopo ogni modifica. Stylebot vede solo i file che crea nel tuo Drive, e non esiste alcun server di Stylebot.',
      conflicts: 'Conflitti',
      conflictsBody:
        'Se uno stile è cambiato su due computer, viene mantenuta la tua modifica più recente e l’altra versione viene salvata in un commento, così non si perde nulla.',
      backup: 'Backup',
      backupBody: 'Esporta e importa tutti i tuoi stili in JSON dalle Opzioni.',
      history: 'Cronologia versioni',
      historyBody:
        'Ogni modifica su questo computer viene conservata nelle Opzioni, comprese quelle arrivate tramite la sincronizzazione. Ripristina qualsiasi versione precedente, per alcuni siti o per tutti.',
      historyShot:
        'Cronologia versioni nelle Opzioni, dalla modifica più recente',
    },
    urls: {
      intro:
        'Per impostazione predefinita, Stylebot associa gli stili ai siti in base al nome di dominio. Modifica l’URL di uno stile nelle Opzioni e usa questi pattern per regole più specifiche.',
      wildcards: {
        anything: 'Corrisponde a qualsiasi sequenza di caratteri.',
        segment:
          'Corrisponde a qualsiasi sequenza di caratteri fino alla prima /.',
        list: 'Separa un elenco di pattern. Un URL corrisponde se corrisponde almeno uno dei pattern.',
        regex: 'All’inizio di un URL, lo trasforma in un’espressione regolare.',
      },
      examplesTitle: 'Esempi',
      examples: {
        domain:
          'Il dominio docs.google.com o uno qualsiasi dei suoi sottodomini.',
        prefix: 'Qualsiasi URL che inizia con docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com e così via.',
        subdomains: 'news.ycombinator.com e apps.ycombinator.com.',
        either: 'Uno dei due domini, o uno qualsiasi dei loro sottodomini.',
        regex: 'Solo la home page di Reddit.',
        everywhere: 'Tutti i siti. Utile per gli stili che vuoi ovunque.',
      },
    },
    shortcuts: {
      intro:
        'Le scorciatoie globali funzionano su qualsiasi pagina che Stylebot può personalizzare; puoi cambiarle nelle impostazioni delle scorciatoie del browser, a cui trovi il link nelle Opzioni. Per le scorciatoie dell’editor, premi [[?]] nell’editor.',
      or: 'o',
      unset: 'Non impostata; assegnala nel browser',
      global: 'Globali',
      picker: 'Durante la selezione di un elemento',
      actions: {
        toggleEditor: 'Attiva/disattiva editor',
        toggleStyling: 'Attiva/disattiva stile',
        toggleReadability: 'Attiva/disattiva leggibilità',
        toggleGrayscale: 'Attiva/disattiva scala di grigi',
        parent: 'Seleziona l’elemento padre',
        child: 'Torna all’elemento figlio',
        select: 'Seleziona l’elemento evidenziato',
      },
    },
    help: {
      body: 'Hai trovato un bug o hai un’idea? Apri una segnalazione su <a href="{issues}">GitHub</a>. Stylebot è gratuito e open source, mantenuto dal 2011. Se ti è utile, puoi sostenerlo <a href="{donate}">offrendomi un caffè</a>.',
    },
  },
  privacy: {
    title: 'Privacy',
    description:
      'Cosa fa Stylebot con i tuoi dati: nessun server, nessun account, nessuna analisi.',
    lede: 'Stylebot non ha server, account né strumenti di analisi. I tuoi stili restano nel tuo browser, a meno che tu non attivi la sincronizzazione, la chat o la riga di comando: in quel caso vanno direttamente a un servizio che hai scelto o a un’app che hai autorizzato.',
    updated: 'Ultimo aggiornamento: {date}',
    browser: {
      title: 'Cosa resta nel tuo browser',
      body: [
        'I tuoi stili, profili, impostazioni, la cronologia, le conversazioni in chat e le chiavi API sono salvati nello spazio di archiviazione delle estensioni del tuo browser, e disinstallando Stylebot vengono rimossi. Stylebot legge le pagine che visiti per personalizzarne lo stile, e non ne invia nulla a meno che tu non usi la chat o la riga di comando.',
      ],
    },
    sync: {
      title: 'Sincronizzazione con Google Drive',
      body: [
        'Quando colleghi Google Drive nelle Opzioni, i tuoi stili vengono salvati in un file nel tuo Drive. Stylebot può vedere solo i file che crea. Il suo token di accesso resta nel tuo browser e scade dopo un’ora. Disconnettiti nelle Opzioni o dal tuo <a href="https://myaccount.google.com/connections">account Google</a>.',
        'L’uso da parte di Stylebot delle informazioni ricevute dalle API di Google rispetta le <a href="https://developers.google.com/terms/api-services-user-data-policy">Norme relative ai dati utente dei servizi API di Google</a>, inclusi i requisiti di utilizzo limitato.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Quando aggiungi una chiave API e invii un messaggio, il tuo browser lo manda direttamente a quel provider insieme agli eventuali screenshot allegati, all’indirizzo e al titolo della pagina, a una struttura di ciò che è visibile nella pagina, al suo CSS e ai tuoi stili. Possono esserci informazioni personali mostrate nella pagina, quindi non usare la chat su pagine che non condivideresti con il provider. Si applicano le sue norme: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Riga di comando',
      body: [
        'Quando attivi <q>Consenti alle app di questo computer di controllare Stylebot</q> nelle Opzioni, le app eseguite con il tuo utente possono elencare le tue schede, leggere le pagine, acquisire screenshot e leggere e modificare i tuoi stili, tramite una connessione locale che solo tu puoi usare. Ciò che leggono può arrivare ai servizi che usano, come il modello dietro un agente di programmazione. Disattiva l’impostazione per scollegarle.',
      ],
    },
    fonts: {
      title: 'Caratteri e CSS importato',
      body: [
        'I caratteri di Google Fonts nei tuoi stili vengono scaricati da Google, che vede il tuo indirizzo IP. I fogli di stile che importi con <code>@import</code> vengono scaricati dal loro indirizzo.',
      ],
    },
    site: {
      title: 'Questo sito',
      body: [
        'stylebot.dev non ha pubblicità né cookie ed è ospitato su GitHub Pages, che conserva i normali log del server. Plausible conta le visite per pagina, sito di provenienza, paese e tipo di dispositivo, senza cookie né nulla che ti identifichi.',
      ],
    },
    sharing: {
      title: 'Condivisione',
      body: [
        'Stylebot non raccoglie, vende né condivide i tuoi dati. I dati lasciano il tuo browser solo verso i servizi indicati sopra, quando li usi.',
      ],
    },
    contact: {
      title: 'Modifiche e contatti',
      body: [
        'Le modifiche a queste norme sono elencate nella <a href="{history}">cronologia del sito su GitHub</a>. Per domande scrivi a <a href="mailto:{email}">{email}</a> o apri una <a href="{issues}">segnalazione su GitHub</a>.',
      ],
    },
    translation:
      'Questa è una traduzione. In caso di differenze rispetto alla <a href="{original}">versione inglese</a>, fa fede la versione inglese.',
  },
  releases: {
    title: 'Novità della versione {version}',
    bugFixes: 'E tante <a href="{changelog}">correzioni di bug</a>',
    sections: 'Sezioni',
    r31: {
      description:
        'Stylebot 3.1 aggiunge sincronizzazione e backup con Google Drive, un editor ridimensionabile e le tavolozze di colori.',
      syncTitle: 'Sincronizzazione e backup con Google Drive',
      syncAlt: 'Sincronizzazione degli stili con Google Drive',
      syncBody: [
        'Attiva e autorizza la sincronizzazione con Google Drive dalla <strong>pagina Opzioni</strong> di Stylebot.',
        'Una volta attivata, fai clic su <strong>Sincronizza ora</strong> nel popup o nella pagina Opzioni per sincronizzare gli stili del browser con quelli salvati su Google Drive.',
      ],
      resizeTitle: 'Ridimensiona l’editor di Stylebot',
      resizeAlt: 'Ridimensionamento dell’editor di Stylebot',
      resizeBody:
        'Ora puoi ridimensionare l’editor di Stylebot e, se vuoi, restringere la pagina perché il suo contenuto non finisca sotto l’editor.',
      colorsTitle: 'Tavolozze di colori',
      colorsAlt: 'Scelta di un colore da una tavolozza',
      colorsBody:
        'Un selettore colori migliorato, con le tavolozze, rende più facile scegliere colori azzeccati.',
    },
    r32: {
      description:
        'Stylebot 3.2 porta stili più veloci e senza sfarfallii, una modalità Leggibilità ridisegnata e un popup più pulito.',
      lede: 'Stylebot è tornato in sviluppo attivo, con altri aggiornamenti in programma.',
      fasterTitle: 'Stili più veloci, senza sfarfallii',
      fasterBody:
        'Ora il CSS viene memorizzato nella cache e applicato all’istante, così le pagine non lampeggiano più senza stile mentre i tuoi stili si caricano, e tutto risulta più reattivo.',
      readabilityTitle: 'Una modalità Leggibilità ridisegnata',
      readabilityAlt:
        'I nuovi controlli integrati per tema e tipografia della modalità Leggibilità',
      readabilityItems: [
        'Nuovo algoritmo di estrazione degli articoli, più efficace nel ripulire le pagine',
        'Attivazione più rapida, prima che il resto della pagina si carichi',
        'Personalizzazione integrata di tema e tipografia',
        'Animazione di caricamento più fluida',
        'Scorciatoia da tastiera per attivarla e disattivarla',
      ],
      popupTitle: 'Un popup più pulito',
      popupAlt: 'Il popup ridisegnato di Stylebot',
      popupItems: [
        'Righe con interruttore cliccabili per intero',
        'Pulsante diretto per le impostazioni',
        'Supporto per la modalità scura',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 porta un editor ridisegnato, una riga di comando per gli agenti di programmazione, i profili, il pannello laterale, Chat, la cronologia versioni e la sincronizzazione.',
      lede: 'Un editor ridisegnato, una riga di comando per gli agenti di programmazione, i profili e il pannello laterale.',
      toc: {
        editor: 'Editor ridisegnato',
        cli: 'Riga di comando',
        profiles: 'Profili',
        panel: 'Pannello laterale',
        history: 'Cronologia versioni',
        sync: 'Sincronizzazione',
        chat: 'Chat',
        more: 'E altro ancora',
      },
      editorTitle: 'Un editor ridisegnato',
      editorAlt:
        'La scheda Di base ridisegnata, mentre personalizza Hacker News con un profilo Newspaper',
      editorBody: 'Ricostruito da zero, ora con la modalità scura.',
      editorItems: [
        'Controlli raggruppati che mostrano i valori della pagina stessa',
        'Selettori generati meglio, che continuano a funzionare quando un sito si aggiorna, con alternative tra cui scegliere',
        'Indica quando un’altra regola sovrascrive un valore',
        'Tavolozze di colori e contagocce',
        'Anteprima di un colore o di un carattere sulla pagina passandoci sopra il mouse',
        'Modifica sul posto qualsiasi altra proprietà CSS in Altre proprietà',
        'Annulla le modifiche',
      ],
      profilesTitle: 'Profili',
      profilesAlt: 'Il popup su un sito con due profili, Dracula e Gruvbox',
      profilesBody:
        'Tieni più aspetti per un sito e passa dall’uno all’altro dall’editor o dal popup.',
      panelTitle: 'Il pannello laterale, o una finestra tutta sua',
      panelAlt:
        'Il menu dell’editor, con Posizione impostata sul pannello laterale',
      panelBody:
        'In Chrome ed Edge l’editor si apre nel pannello laterale. Oppure staccalo in una finestra a sé, da <strong>Posizione</strong> nel menu <strong>⋯</strong> dell’editor.',
      historyTitle: 'Cronologia versioni',
      historyBody:
        'Ogni modifica viene conservata e puoi ripristinare qualsiasi versione precedente.',
      syncTitle: 'Sincronizzazione',
      syncBody:
        'La sincronizzazione con Google Drive è più affidabile. Le modifiche fatte su computer diversi vengono unite, così non se ne perde nessuna. Parte da sola ogni 30 minuti e subito dopo ogni modifica.',
      chatTitle: 'Chat',
      chatBody:
        'Niente agente di programmazione? Descrivi cosa vuoi, o scegli uno stile suggerito, e Stylebot scrive il CSS. Usa la tua chiave di Claude, OpenAI o Gemini.',
      chatAlt:
        'La scheda Chat che suggerisce stili per la pagina: Accogliente, Calmo e Solo i link a colori',
      moreTitle: 'E altro ancora',
      moreItems: [
        'Un nuovo stylebot.dev',
        'Una nuova icona per Stylebot',
        'Ora gli stili si applicano anche dentro lo shadow DOM, quindi funzionano sui siti creati con i web component',
        'Le scorciatoie di Stylebot ora si trovano nelle impostazioni delle scorciatoie del browser. In Chrome ed Edge, quelle che avevi cambiato sono tornate ai valori predefiniti: reimpostale lì.',
        'Stylebot ora è disponibile in vietnamita',
      ],
    },
  },
  notFound: {
    title: 'Pagina non trovata',
    description: 'Questa pagina non esiste.',
    heading: 'Questa pagina non esiste, e ha un aspetto orribile.',
    done: 'Molto meglio. La pagina continua a non esistere, ma almeno adesso è bella.',
    pageTitle: '404 Non trovato',
    pageBody: 'L’URL richiesto non è stato trovato su questo server.',
    pageLink: 'Vai alla home page',
    nice: '✨ Rendila bella',
  },
};

export default site;
