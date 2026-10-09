import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Blocca nella barra degli strumenti',
      body: 'Tieni Stylebot a portata di clic.',
      captions: {
        menu: 'Stylebot parte dal menu delle estensioni.',
        pinned: 'Bloccato. Ora Stylebot è nella barra degli strumenti.',
      },
    },
    open: {
      title: 'Apri l’editor',
      keysBody: 'Fai clic sull’icona o premi {keys}.',
      captions: {
        iconThenStyle:
          'Fai clic sull’icona di Stylebot, poi su Personalizza questa pagina.',
        orKeys: 'Oppure premi {keys} per aprirlo direttamente.',
      },
    },
    pick: {
      title: 'Scegli un elemento',
      fieldsBody:
        'Fai clic per selezionare. I campi mostrano i suoi stili attuali.',
      captions: {
        hoverToSee: 'Passa il mouse per vedere cosa puoi personalizzare.',
        select:
          'Fai clic per selezionare. Il selettore CSS si compila da solo.',
        computed:
          'Ogni campo mostra il valore calcolato attuale dell’elemento.',
      },
    },
    style: {
      title: 'Personalizzalo',
      body: 'Usa la scheda Di base o scrivi CSS.',
      captions: {
        size: 'Imposta la dimensione…',
        color: '…e il colore.',
        plainCss: 'Ogni modifica è semplice CSS, salvato per questo sito.',
        byHand: 'Oppure scrivi il CSS a mano.',
        live: 'La pagina si aggiorna mentre scrivi.',
      },
    },
    profiles: {
      title: 'Profili',
      looksBody: 'Salva aspetti diversi per lo stesso sito.',
      captions: {
        createForLook: 'Crea un profilo per un nuovo aspetto.',
        created: '{profile} parte da zero. {defaultProfile} resta salvato.',
        newspaperLook: 'Dagli un aspetto da giornale.',
        darkLook: 'Dagli un aspetto scuro e caldo.',
        switchAnytime: 'Passa dall’uno all’altro quando vuoi.',
        backToDefault: 'Di nuovo su {defaultProfile}. Un sito, due aspetti.',
      },
    },
  },
  browser: {
    extensions: 'Estensioni',
    fullAccess: 'Accesso completo',
    fullAccessNote:
      'Queste estensioni possono vedere e modificare le informazioni su questo sito.',
    otherExtensions: {
      adBlocker: 'Blocco annunci',
      passwordManager: 'Gestore password',
      translate: 'Traduttore',
      webArchive: 'Archivio web',
    },
  },
  popup: {
    readability: 'Leggibilità',
    styleThisPage: 'Personalizza questa pagina',
  },
  editor: {
    defaultProfile: 'Predefinito',
    newProfile: 'Giornale',
    newProfileDark: 'Nottambulo',
    createProfile: 'Crea profilo',
    pickAnElement: 'Scegli un elemento',
    tabs: {
      basic: 'Di base',
      code: 'Codice',
      presets: 'Preimpostazioni',
      chat: 'Chat',
    },
    basic: {
      hide: 'Nascondi',
      reset: 'Ripristina',
      text: 'Testo',
      font: 'Carattere',
      defaultFont: 'Predefinito',
      size: 'Dimensione',
      lineHeight: 'Interlinea',
      color: 'Colore',
      decoration: 'Decorazione',
      none: 'Nessuna',
      alignment: 'Allineamento',
      background: 'Sfondo',
      box: 'Box',
      effects: 'Effetti',
      moreProperties: 'Altre proprietà',
    },
    code: {
      noStyles: 'Ancora nessuno stile',
    },
    presets: {
      readability: 'Leggibilità',
      articlesOnly: 'Solo articoli',
      readabilityDescription:
        'Trasforma gli articoli di questo sito in una vista di lettura pulita e senza distrazioni, con tema, carattere e dimensione a tua scelta.',
      grayscale: 'Scala di grigi',
      grayscaleDescription: 'Applica la scala di grigi alla pagina.',
    },
  },
  article: {
    nav: {
      news: 'Notizie',
      travel: 'Viaggi',
      signIn: 'Accedi',
    },
    kicker: 'Viaggi · Approfondimento',
    headline: 'Il ritorno silenzioso del traghetto notturno',
    dek: 'Tre compagnie scommettono che i viaggiatori rinunceranno alla velocità in cambio di una cabina, una vista sul mare e niente aeroporto.',
    byline: 'Marta Linde · 24 set · 6 min di lettura',
    paragraphs: [
      'Vent’anni dopo la soppressione dell’ultima traversata notturna, tre compagnie rimettono in mare le cabine. L’idea è semplice: imbarcarsi dopo cena, dormire durante la traversata e svegliarsi in un altro paese.',
      'La prima linea riattivata ha esaurito i posti per tutta l’estate in una settimana. Gran parte dei passeggeri ha meno di quarant’anni, e molti non hanno mai viaggiato di notte, né in treno né in nave. Secondo le compagnie si riempiono prima le cabine, poi le poltrone reclinabili, poi il ponte.',
    ],
    quote:
      '«Nessuno lo prenota per risparmiare tempo. Lo prenotano per perderne un po’.»',
    quoteBy: '— Ines Varga, pianificatrice di rotte',
  },
  steps: {
    heading: 'Come funziona',
    counter: '{current} / {total}',
    jump: 'Vai a questo punto',
  },
};

export default demo;
