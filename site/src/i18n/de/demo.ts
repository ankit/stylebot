import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'An die Symbolleiste anheften',
      body: 'So ist Stylebot nur einen Klick entfernt.',
      captions: {
        menu: 'Stylebot ist zuerst im Erweiterungsmenü.',
        pinned: 'Angeheftet. Stylebot ist jetzt in Ihrer Symbolleiste.',
      },
    },
    open: {
      title: 'Editor öffnen',
      keysBody: 'Klicken Sie auf das Symbol oder drücken Sie {keys}.',
      captions: {
        iconThenStyle:
          'Klicken Sie auf das Stylebot-Symbol, dann auf „Diese Seite stylen“.',
        orKeys: 'Oder drücken Sie {keys}, um ihn direkt zu öffnen.',
      },
    },
    pick: {
      title: 'Element auswählen',
      fieldsBody:
        'Zum Auswählen klicken. Die Felder zeigen die aktuellen Stile.',
      captions: {
        hoverToSee:
          'Zeigen Sie auf etwas, um zu sehen, was sich gestalten lässt.',
        select:
          'Zum Auswählen klicken. Der Selektor wird automatisch ausgefüllt.',
        computed:
          'Jedes Feld zeigt den aktuellen berechneten Wert des Elements.',
      },
    },
    style: {
      title: 'Gestalten',
      body: 'Nutzen Sie den Tab „Einfach“ oder schreiben Sie CSS.',
      captions: {
        size: 'Größe festlegen…',
        color: '…und die Farbe.',
        plainCss:
          'Jede Änderung ist einfaches CSS, gespeichert für diese Website.',
        byHand: 'Oder schreiben Sie CSS von Hand.',
        live: 'Die Seite aktualisiert sich beim Tippen.',
      },
    },
    profiles: {
      title: 'Profile',
      looksBody: 'Speichern Sie verschiedene Looks für dieselbe Website.',
      captions: {
        createForLook: 'Erstellen Sie ein Profil für einen neuen Look.',
        created: '{profile} beginnt leer. {defaultProfile} bleibt gespeichert.',
        newspaperLook: 'Geben Sie ihm einen Zeitungslook.',
        darkLook: 'Geben Sie ihm einen warmen, dunklen Look.',
        switchAnytime: 'Wechseln Sie jederzeit zwischen beiden.',
        backToDefault: 'Zurück zu {defaultProfile}. Eine Website, zwei Looks.',
      },
    },
  },
  browser: {
    extensions: 'Erweiterungen',
    fullAccess: 'Vollzugriff',
    fullAccessNote:
      'Diese Erweiterungen können Informationen auf dieser Website sehen und ändern.',
    otherExtensions: {
      adBlocker: 'Werbeblocker',
      passwordManager: 'Passwortmanager',
      translate: 'Übersetzer',
      webArchive: 'Webarchiv',
    },
  },
  popup: {
    readability: 'Lesbarkeit',
    styleThisPage: 'Diese Seite stylen',
  },
  editor: {
    defaultProfile: 'Standard',
    newProfile: 'Zeitung',
    newProfileDark: 'Nachteule',
    createProfile: 'Profil erstellen',
    pickAnElement: 'Element auswählen',
    tabs: {
      basic: 'Einfach',
      code: 'Code',
      presets: 'Voreinstellungen',
      chat: 'Chat',
    },
    basic: {
      hide: 'Ausblenden',
      reset: 'Zurücksetzen',
      text: 'Text',
      font: 'Schriftart',
      defaultFont: 'Standard',
      size: 'Größe',
      lineHeight: 'Zeilenhöhe',
      color: 'Farbe',
      decoration: 'Textdekoration',
      none: 'Keiner',
      alignment: 'Ausrichtung',
      background: 'Hintergrund',
      box: 'Box',
      effects: 'Effekte',
      moreProperties: 'Weitere Eigenschaften',
    },
    code: {
      noStyles: 'Noch keine Stile',
    },
    presets: {
      readability: 'Lesbarkeit',
      articlesOnly: 'Nur Artikel',
      readabilityDescription:
        'Verwandeln Sie die Artikel dieser Website in eine aufgeräumte, ablenkungsfreie Leseansicht – mit Design, Schriftart und Größe Ihrer Wahl.',
      grayscale: 'Graustufen',
      grayscaleDescription: 'Wenden Sie Graustufen auf die Seite an.',
    },
  },
  article: {
    nav: {
      news: 'Nachrichten',
      travel: 'Reisen',
      signIn: 'Anmelden',
    },
    kicker: 'Reisen · Reportage',
    headline: 'Die leise Rückkehr der Nachtfähre',
    dek: 'Drei Reedereien setzen darauf, dass Reisende Tempo gegen eine Kabine, Meerblick und keinen Flughafen eintauschen.',
    byline: 'Marta Linde · 24. Sept. · 6 Min. Lesezeit',
    paragraphs: [
      'Zwanzig Jahre nach dem Aus für die letzte Nachtüberfahrt bringen drei Reedereien wieder Kabinen aufs Wasser. Das Versprechen ist einfach: nach dem Abendessen an Bord gehen, die Überfahrt verschlafen und in einem anderen Land aufwachen.',
      'Die erste wiederbelebte Linie war binnen einer Woche für den ganzen Sommer ausgebucht. Die meisten Fahrgäste sind unter vierzig, viele sind noch nie über Nacht gereist, weder im Zug noch auf dem Schiff. Laut den Reedereien sind zuerst die Kabinen weg, dann die Liegesitze, dann das Deck.',
    ],
    quote:
      '„Niemand bucht das, um Zeit zu sparen. Man bucht es, um ein wenig zu verlieren.“',
    quoteBy: '— Ines Varga, Routenplanerin',
  },
  steps: {
    heading: 'So funktioniert es',
    counter: '{current} / {total}',
    jump: 'Zu dieser Stelle springen',
  },
};

export default demo;
