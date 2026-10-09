import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Jede Website neu gestalten',
    titleSuffix: '{title} - Stylebot',
    description:
      'Zeigen Sie auf etwas auf einer Seite und ändern Sie es, oder beschreiben Sie, was Sie möchten. Stylebot schreibt das CSS. Kostenlos und Open Source für Chrome, Firefox und Edge.',
  },
  header: {
    home: 'Stylebot-Startseite',
    manual: 'Handbuch',
    install: 'Installieren',
    language: 'Sprache',
    suggest: 'Diese Seite auf Deutsch ansehen',
    dismiss: 'Schließen',
    theme: 'Design: {theme}',
  },
  themes: {
    light: 'Hell',
    dark: 'Dunkel',
    stylebot: 'Stylebot',
    newsprint: 'Zeitungspapier',
  },
  footer: {
    changelog: 'Änderungsprotokoll',
    donate: 'Kaffee spendieren',
  },
  store: {
    add: 'Zu {store} hinzufügen',
    addFree: 'Zu {store} hinzufügen – kostenlos',
    reinstall: 'Für {store} neu installieren',
  },
  zoom: {
    label: 'Vergrößerter Screenshot',
    close: 'Schließen',
  },
  home: {
    title: '{word} Sie jede Website neu.',
    titleWord: 'Gestalten',
    titleWordHint: 'Zum Umgestalten klicken',
    lede: 'Zeigen Sie auf etwas auf der Seite und ändern Sie es, oder beschreiben Sie einfach, was Sie möchten. Stylebot schreibt das CSS und lädt Ihren Stil bei jedem Besuch.',
    also: 'Auch für {first} und {second}',
    installTitle: 'Stylebot installieren',
    installBody:
      'Kostenlos und Open Source seit 2011. Kein Konto, kein Tracking. Ihre Stile bleiben in Ihrem Browser, und der Code liegt auf GitHub.',
    cli: 'Sie nutzen einen Coding-Agenten? Fügen Sie die <a href="#cli">CLI</a> hinzu:',
  },
  cli: {
    copy: 'Kopieren',
    copied: 'Kopiert',
    copyCommand: '{command} kopieren',
    title: 'Funktioniert mit Ihrem Coding-Agenten',
    body: 'Claude Code, Codex, Cursor oder jeder andere Agent, der Befehle ausführt, kann Stylebot über das Terminal nutzen.',
    guide: 'CLI einrichten →',
    demo: {
      terminal: 'Terminal · Coding-Agent',
      prompt: 'mach {site} nachts besser lesbar',
      done: 'Dunkler Hintergrund, wärmerer Text, größere Serifenschrift. Werbung entfernt.',
      before: 'Vorher',
      after: 'Nachher',
      kicker: 'Reisen',
      headline: 'Die leise Rückkehr der Nachtfähre',
      dek: 'Drei Reedereien setzen darauf, dass Reisende Tempo gegen eine Kabine, Meerblick und keinen Flughafen eintauschen.',
      text: 'Die Fähre um 22:40 ab Rostock legt ohne Aufhebens ab. Wenn die Hafenlichter zurückbleiben, haben die meisten Passagiere ihre Kabinen bezogen, und in der Bar herrscht nur noch leises Gemurmel.',
      ad: 'Anzeige',
    },
    page: {
      title: 'Befehlszeile',
      description:
        'Steuern Sie Stylebot über Ihr Terminal, oder lassen Sie einen Coding-Agenten wie Claude Code, Codex oder Cursor Websites in Ihrem Browser umgestalten – mit Ihrem eigenen Abo.',
      heading: 'Stylebot im Terminal',
      lede: 'Steuern Sie Stylebot über die Befehlszeile, oder überlassen Sie das einem Coding-Agenten wie Claude Code, Codex oder Cursor. Der Agent gestaltet Websites direkt in Ihrem Browser um – mit Ihrem eigenen Abo statt einem API-Schlüssel.',
      setup: 'Einrichtung',
      install: 'Stylebot installieren',
      installBody:
        'Für Chrome oder Edge. Unter Firefox funktioniert die Befehlszeile noch nicht.',
      cli: 'CLI installieren',
      cliBody: 'Erfordert Node 20 oder neuer.',
      connect: 'Mit Ihren Browsern verbinden',
      connectBody:
        'Damit wird die CLI bei Chrome und Edge registriert, sodass Stylebot sie erreichen kann.',
      access: 'Befehlszeilenzugriff aktivieren',
      accessBody:
        'Aktivieren Sie in den Optionen von Stylebot unter „Grundeinstellungen“ <strong>Apps auf diesem Computer Stylebot steuern lassen</strong> und erlauben Sie, was der Browser abfragt.',
      plugin: 'Claude Code-Plugin hinzufügen',
      optional: 'Optional',
      pluginBody: 'Führen Sie in Claude Code Folgendes aus:',
      tryIt: 'Dann probieren Sie es aus:',
      commands: 'Befehle',
      commandsBody:
        'Ein Agent führt sie für Sie aus, aber Sie können sie auch selbst ausführen. <code>stylebot --help</code> listet alle auf.',
      examples: {
        open: 'Öffnet die Seite in einem Fenster hinter Ihrem und gibt ihre Tab-ID aus.',
        outline: 'Gibt die sichtbaren Elemente der Seite als Gliederung aus.',
        css: 'Speichert das CSS als Stil der Website, wendet es an und prüft die Seite.',
        screenshot: 'Speichert ein Bild des Tabs.',
      },
      privacy: 'Datenschutz',
      privacyBody: [
        'Der Befehlszeilenzugriff ist ausgeschaltet, bis Sie ihn aktivieren. Solange er aktiv ist, können Apps auf diesem Computer Ihre geöffneten Seiten lesen, Screenshots aufnehmen und Ihre Stile ändern. Sie können ihn jederzeit in den Optionen von Stylebot ausschalten.',
        'Stylebot und die CLI kommunizieren nur miteinander, auf diesem Computer, und senden nichts nach außen. Ein Agent sendet, was er liest, an seinen eigenen Anbieter, so wie Claude Code an Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Stile als Ausgangspunkt',
    lede: 'Kopieren Sie einen und passen Sie ihn an, oder fangen Sie bei null an.',
    hint: 'Fügen Sie ihn auf {site} in den Code-Tab ein.',
    enlarge: '{site} vergrößern: {name}',
    alt: '{site}, mit Stylebot neu gestaltet: {name}',
    install: 'Installieren',
    installTitle: 'In Stylebot installieren',
    installed: 'Installiert',
    installedAs: 'Installiert als {name}',
    installFailed: 'Installation fehlgeschlagen',
    copy: 'CSS kopieren',
    copied: 'Kopiert',
    source: 'Auf GitHub ansehen',
    lightbox: 'Neu gestaltete Website',
    close: 'Schließen',
  },
  quotes: {
    title: 'Nutzer lieben Stylebot',
  },
  features: {
    title: 'Was Sie sonst noch bekommen.',
    previous: 'Vorherige Funktion',
    next: 'Nächste Funktion',
    sync: {
      title: 'Synchronisierung',
      body: 'Verbinden Sie Google Drive, und Ihre Stile begleiten Sie auf jeden Computer, an dem Sie sich anmelden. Stylebot synchronisiert alle 30 Minuten und direkt nach jeder Änderung.',
      connected: 'Mit Google Drive verbunden',
      synced: 'Synchronisiert vor 2 Minuten',
      syncNow: 'Jetzt synchronisieren',
      savedTo: 'Gespeichert in',
      disconnect: 'Trennen',
      schedule: 'Zeitplan',
      scheduleValue: 'Alle 30 Minuten und direkt nach jeder Stiländerung',
    },
    history: {
      title: 'Versionsverlauf',
      body: 'Jede Änderung an Ihren Stilen bleibt erhalten, die neueste zuerst. Öffnen Sie einen Eintrag, um zu sehen, was sich geändert hat, und stellen Sie ihn mit einem Klick wieder her.',
      today: 'Heute, 25. Sept.',
      yesterday: 'Gestern, 24. Sept.',
      noChanges: 'Keine Änderungen',
      edited: 'Bearbeitet',
      sites: '10 Websites',
      current: 'Aktuell',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Voreinstellungen',
      body: 'Lesbarkeit und Graustufen funktionieren auf jeder Website und lassen sich mit Ihren eigenen Änderungen kombinieren.',
      readability: 'Lesbarkeit',
      articlesOnly: 'Nur Artikel',
      readabilityBody:
        'Eine aufgeräumte Leseansicht mit Design, Schriftart und Größe Ihrer Wahl.',
      grayscale: 'Graustufen',
      grayscaleBody: 'Wenden Sie Graustufen auf die Seite an.',
    },
    chat: {
      title: 'Chat',
      body: 'Kein Coding-Agent? Beschreiben Sie im Chat-Tab eine Änderung, und Stylebot schreibt das CSS. Mit Ihrem eigenen Schlüssel für Claude, OpenAI oder Gemini, der in Ihrem Browser bleibt.',
      prompt: 'Mach den Artikel nachts besser lesbar',
      reply:
        'Auf einen dunklen Hintergrund mit wärmerem Text umgestellt und den Fließtext in einer größeren Serifenschrift mit mehr Zeilenabstand gesetzt.',
      updated: 'Stile aktualisiert',
      undo: 'Rückgängig',
      placeholder: 'Beschreiben Sie eine Änderung',
    },
  },
  welcome: {
    title: 'Willkommen',
    description:
      'So funktioniert Stylebot, von Anfang bis Ende, in etwa einer Minute.',
    heading: 'Stylebot ist installiert.',
    yourTurn: 'Jetzt sind Sie dran.',
    yourTurnBody:
      'Öffnen Sie eine beliebige Website und drücken Sie die Tastenkombination. Bis dahin ändert sich nichts.',
    manual: 'Handbuch',
    agentTitle: 'Verbinden Sie Ihren Coding-Agenten',
    agentBody:
      'Claude Code, Codex, Cursor oder jeder andere Agent, der Befehle ausführt, kann Stylebot über das Terminal nutzen.',
    agentPrompt:
      'gib dieser Seite ein Everforest-Design mit schöneren Schriften',
    agentReply: 'Auf Everforest-Farben mit Lora und Newsreader umgestellt.',
  },
  goodbye: {
    title: 'Auf Wiedersehen',
    description: 'Danke, dass Sie Stylebot verwendet haben.',
    panda: 'Ein Pixel-Panda, der zum Abschied winkt',
    heading: 'Danke, dass Sie Stylebot verwendet haben.',
    lede: 'Ihre Stile wurden aus diesem Browser entfernt. Falls Sie die Synchronisierung aktiviert hatten, liegt noch ein Backup in Ihrem Google Drive.',
    changedMind: 'Doch anders entschieden?',
    note: 'Ich arbeite seit 2011 an Stylebot. Danke, dass Sie es ausprobiert haben, und für jedes Feedback.',
    signature: '— Ankit',
    feedback: {
      question: 'Warum haben Sie Stylebot deinstalliert?',
      optional: 'Optional, dauert nur einen Moment.',
      reasons: [
        'Brauche ich nicht mehr',
        'Schwer zu bedienen',
        'Hat eine Website kaputt gemacht',
        'Eine Funktion fehlt',
        'Zu langsam',
        'Etwas anderes',
      ],
      placeholder: 'Sonst noch etwas? (optional)',
      send: 'Feedback senden',
      sendNote: 'Geht direkt an den Entwickler.',
      thanks: 'Danke. Jede Nachricht wird gelesen.',
    },
  },
  manual: {
    title: 'Handbuch',
    description:
      'So nutzen Sie Stylebot: Websites gestalten, Profile, die Befehlszeile, Chat, Synchronisierung, URL-Regeln und Tastenkombinationen.',
    lede: 'So funktioniert Stylebot, von Ihrem ersten Stil bis zu Profilen, Chat und Synchronisierung.',
    sections: 'Abschnitte des Handbuchs',
    toc: {
      start: 'Erste Schritte',
      profiles: 'Profile',
      cli: 'Befehlszeile',
      chat: 'Chat',
      presets: 'Lesbarkeit und Graustufen',
      sync: 'Synchronisierung, Backup und Verlauf',
      urls: 'URL-Regeln',
      shortcuts: 'Tastenkombinationen',
      help: 'Hilfe und Support',
    },
    start: {
      open: 'Klicken Sie in der Symbolleiste auf das Stylebot-Symbol und dann auf <strong>Diese Seite stylen</strong>. Oder drücken Sie auf einem beliebigen Tab [[alt+shift+M]], oder klicken Sie mit der rechten Maustaste auf ein Element und wählen Sie <strong>Stylebot → Element gestalten</strong>.',
      shot: 'Der Tab „Einfach“ bei der Auswahl eines Links in einem Wikipedia-Artikel',
      pick: 'Klicken Sie auf die Elementauswahl, zeigen Sie auf die Seite und klicken Sie auf ein Element. Drücken Sie vor dem Klicken [[↑]], um stattdessen das übergeordnete Element auszuwählen. Ändern Sie es dann unter <strong>Einfach</strong>, oder schreiben Sie CSS unter <strong>Code</strong>. Änderungen werden sofort gespeichert und bei jedem Besuch der Website geladen.',
      fonts: 'Schriftarten',
      fontsBody:
        'Durchsuchen Sie 400 <a href="https://fonts.google.com/">Google Fonts</a>, und Stylebot lädt die gewählte Schrift. Oder geben Sie eine beliebige auf Ihrem Computer installierte Schriftart ein.',
      position: 'Position des Editors',
      positionBody:
        'In Chrome und Edge öffnet sich der Editor im Seitenbereich. Über <strong>Position</strong> in seinem Menü <strong>⋯</strong> öffnen Sie ihn in einem separaten Fenster oder docken ihn in der Seite an. Firefox hat keinen Seitenbereich.',
      off: 'Einen Stil ausschalten',
      offBody:
        'Verwenden Sie den Schalter im Popup oder [[alt+shift+S]]. Der Stil bleibt erhalten, wird aber nicht angewendet.',
      callout:
        'Manche Websites verwenden automatisch generierte Klassennamen, die sich bei Updates ändern. Wenn ein Stil nicht mehr funktioniert, wählen Sie das Element erneut aus, um einen neuen Selektor zu erhalten.',
    },
    profiles: {
      intro:
        'Ein Profil ist ein eigenes Stylesheet für dieselbe Website. So können Sie mehrere Looks behalten und zwischen ihnen wechseln. Es ist immer nur eines aktiv, und jede Website beginnt mit „Standard“.',
      shot: 'Das Popup auf Hacker News mit vier Profilen: Violet Hour, Everforest, Hearth und Newspaper',
      manage:
        'Klicken Sie im Kopfbereich des Editors auf den Profilnamen neben der Website, um Profile zu erstellen, umzubenennen, zu duplizieren oder zu löschen. Wechseln Sie dort oder im Popup zwischen ihnen; im Popup schaltet <strong>Kein Stil</strong> das Styling für die Website aus. Neue Profile sind anfangs leer.',
    },
    cli: {
      intro:
        'Mit dem Befehl <code>stylebot</code> kann ein Coding-Agent wie Claude Code, Codex oder Cursor Websites direkt in Ihrem Browser umgestalten – mit Ihrem eigenen Abo statt einem API-Schlüssel. So lassen Sie eine Website am besten von einem Agenten gestalten, und Sie können die Befehle auch selbst ausführen.',
      setup: 'Einrichtung',
      setupBody:
        'Installieren Sie die CLI, verbinden Sie sie mit Ihren Browsern und aktivieren Sie dann in den Optionen <strong>Apps auf diesem Computer Stylebot steuern lassen</strong>. Die <a href="{cli}">Seite zur Befehlszeile</a> führt durch jeden Schritt. Vorerst nur für Chrome und Edge.',
      claudeCodeBody:
        'Fügen Sie das Stylebot-Plugin hinzu und bitten Sie mit <code>/stylebot</code> um eine Änderung, etwa ein dunkles Design für eine Website.',
      privacy: 'Datenschutz',
      privacyBody:
        'Der Befehlszeilenzugriff ist ausgeschaltet, bis Sie ihn aktivieren. Stylebot und die CLI kommunizieren nur miteinander, auf diesem Computer; ein Agent sendet, was er liest, an seinen eigenen Anbieter.',
    },
    chat: {
      intro:
        'Der Chat eignet sich ideal für schnelle Korrekturen. Beschreiben Sie im Chat-Tab die gewünschte Änderung, und Stylebot schreibt das CSS. Sie können ein Element auswählen, um auf etwas zu zeigen, oder einen Screenshot anhängen, um zu zeigen, was Sie meinen. Für größere Änderungen, etwa ein ganz neues Design, nutzen Sie die <a href="#cli">Befehlszeile</a>.',
      shot: 'Der Chat-Tab nach der Bitte um ein Wald-Design mit gut lesbarer Serifenschrift auf Hacker News',
      key: 'Eigener Schlüssel',
      keyBody:
        'Verbinden Sie einen API-Schlüssel für Claude, OpenAI oder Gemini. Schlüssel werden nur auf diesem Computer gespeichert und nie synchronisiert. Nachrichten gehen direkt von Ihrem Browser an den Anbieter.',
      changes: 'Wohin Änderungen gehen',
      changesBody:
        'Jede Änderung wird sofort angewendet und dem Stylesheet des aktuellen Profils hinzugefügt. Klicken Sie auf <strong>N Zeilen hinzugefügt</strong>, um sie unter „Code“ zu sehen, oder machen Sie sie im Chat rückgängig.',
      cost: 'Kosten',
      costBody:
        'Die Token-Anzahl unter dem Eingabefeld zeigt, wie viel die Unterhaltung verbraucht hat, samt geschätzten Kosten.',
    },
    presets: {
      intro:
        'Beide finden Sie im Tab „Voreinstellungen“, und sie lassen sich mit Ihren eigenen Änderungen kombinieren. <strong>Lesbarkeit</strong> verwandelt die Artikel einer Website in eine aufgeräumte Leseansicht, mit Design, Schriftart, Größe und Breite Ihrer Wahl; Seiten, die keine Artikel sind, bleiben unverändert. <strong>Graustufen</strong> entfernt die Farbe von der Website, in beliebiger Stärke.',
      shot: 'Der Wikipedia-Artikel über Mathematik in der Lesbarkeitsansicht, mit geöffneten Leseeinstellungen',
    },
    sync: {
      shot: 'Optionen, mit Google Drive verbunden und synchronisiert',
      drive: 'Google Drive-Synchronisierung',
      driveBody:
        'Verbinden Sie Google Drive in den Optionen. Ihre Stile, einschließlich Profile, werden alle 30 Minuten und direkt nach jeder Änderung synchronisiert. Stylebot sieht nur die Dateien, die es selbst in Ihrem Drive erstellt, und es gibt keinen Stylebot-Server.',
      conflicts: 'Konflikte',
      conflictsBody:
        'Wurde ein Stil auf zwei Computern geändert, bleibt Ihre neuere Änderung erhalten, und die andere Version wird in einem Kommentar gespeichert. So geht nichts verloren.',
      backup: 'Backup',
      backupBody:
        'Exportieren und importieren Sie alle Ihre Stile als JSON in den Optionen.',
      history: 'Versionsverlauf',
      historyBody:
        'Jede Änderung auf diesem Computer bleibt in den Optionen erhalten, auch solche, die per Synchronisierung eintreffen. Stellen Sie jede frühere Version wieder her, für einzelne Websites oder alle.',
      historyShot: 'Versionsverlauf in den Optionen, neueste Änderung zuerst',
    },
    urls: {
      intro:
        'Standardmäßig ordnet Stylebot Stile den Websites anhand des Domainnamens zu. Bearbeiten Sie die URL eines Stils in den Optionen und verwenden Sie diese Muster für genauere Regeln.',
      wildcards: {
        anything: 'Passt auf eine beliebige Zeichenfolge.',
        segment: 'Passt auf eine beliebige Zeichenfolge bis zum nächsten /.',
        list: 'Trennt eine Liste von Mustern. Eine URL passt, wenn eines der Muster passt.',
        regex: 'Macht die URL am Anfang zu einem regulären Ausdruck.',
      },
      examplesTitle: 'Beispiele',
      examples: {
        domain: 'Die Domain docs.google.com oder eine ihrer Subdomains.',
        prefix: 'Jede URL, die mit docs beginnt.',
        numbered: 'docs.google.com, docs1.google.com, docs2.google.com usw.',
        subdomains: 'news.ycombinator.com und apps.ycombinator.com.',
        either: 'Eine der beiden Domains oder eine ihrer Subdomains.',
        regex: 'Nur die Reddit-Startseite.',
        everywhere:
          'Jede Website. Nützlich für Stile, die überall gelten sollen.',
      },
    },
    shortcuts: {
      intro:
        'Globale Tastenkombinationen funktionieren auf jeder Seite, die Stylebot gestalten kann. Ändern lassen sie sich in den Tastenkombinations-Einstellungen Ihres Browsers, verlinkt in den Optionen. Die Tastenkombinationen des Editors sehen Sie, wenn Sie dort [[?]] drücken.',
      or: 'oder',
      unset: 'Nicht festgelegt; im Browser zuweisen',
      global: 'Global',
      picker: 'Bei der Elementauswahl',
      actions: {
        toggleEditor: 'Editor umschalten',
        toggleStyling: 'Styling umschalten',
        toggleReadability: 'Lesbarkeit umschalten',
        toggleGrayscale: 'Graustufen umschalten',
        parent: 'Übergeordnetes Element auswählen',
        child: 'Zurück zum untergeordneten Element',
        select: 'Hervorgehobenes Element auswählen',
      },
    },
    help: {
      body: 'Einen Fehler gefunden oder eine Idee? Erstellen Sie ein Issue auf <a href="{issues}">GitHub</a>. Stylebot ist kostenlos und Open Source und wird seit 2011 gepflegt. Wenn es Ihnen nützt, können Sie es unterstützen, indem Sie <a href="{donate}">mir einen Kaffee spendieren</a>.',
    },
  },
  privacy: {
    title: 'Datenschutz',
    description:
      'Was Stylebot mit Ihren Daten macht: kein Server, kein Konto, keine Analysetools.',
    lede: 'Stylebot hat keinen Server, kein Konto und keine Analysetools. Ihre Stile bleiben in Ihrem Browser, es sei denn, Sie aktivieren die Synchronisierung, den Chat oder die Befehlszeile – dann gehen sie direkt an einen Dienst, den Sie gewählt haben, oder an eine App, die Sie zugelassen haben.',
    updated: 'Zuletzt aktualisiert: {date}',
    browser: {
      title: 'Was in Ihrem Browser bleibt',
      body: [
        'Ihre Stile, Profile, Einstellungen, der Verlauf, Chat-Unterhaltungen und API-Schlüssel werden im Erweiterungsspeicher Ihres Browsers gespeichert und beim Deinstallieren von Stylebot entfernt. Stylebot liest die Seiten, die Sie besuchen, um sie zu gestalten, und sendet nichts davon weiter, es sei denn, Sie nutzen den Chat oder die Befehlszeile.',
      ],
    },
    sync: {
      title: 'Google Drive-Synchronisierung',
      body: [
        'Wenn Sie Google Drive in den Optionen verbinden, werden Ihre Stile in einer Datei in Ihrem eigenen Drive gespeichert. Stylebot sieht nur die Dateien, die es selbst erstellt. Sein Zugriffstoken bleibt in Ihrem Browser und läuft nach einer Stunde ab. Trennen Sie die Verbindung in den Optionen oder in Ihrem <a href="https://myaccount.google.com/connections">Google-Konto</a>.',
        'Die Nutzung von Informationen, die Stylebot von Google APIs erhält, entspricht der <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, einschließlich der Anforderungen zur eingeschränkten Nutzung (Limited Use).',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Wenn Sie einen API-Schlüssel hinzufügen und eine Nachricht senden, schickt Ihr Browser sie direkt an diesen Anbieter, zusammen mit angehängten Screenshots, Adresse und Titel der Seite, einer Übersicht dessen, was auf der Seite sichtbar ist, sowie deren CSS und Ihren Stilen. Darin können personenbezogene Daten stecken, die auf der Seite angezeigt werden. Verwenden Sie den Chat daher nicht auf Seiten, die Sie nicht mit dem Anbieter teilen würden. Es gilt dessen Datenschutzerklärung: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Befehlszeile',
      body: [
        'Wenn Sie in den Optionen <q>Apps auf diesem Computer Stylebot steuern lassen</q> aktivieren, können Apps, die unter Ihrem Benutzerkonto laufen, Ihre Tabs auflisten, Seiten lesen, Screenshots aufnehmen sowie Ihre Stile lesen und ändern – über eine lokale Verbindung, die nur Sie nutzen können. Was sie lesen, kann an die Dienste gelangen, die sie nutzen, etwa an das Modell hinter einem Coding-Agenten. Schalten Sie die Einstellung aus, um die Verbindung zu trennen.',
      ],
    },
    fonts: {
      title: 'Schriftarten und importiertes CSS',
      body: [
        'Schriftarten von Google Fonts in Ihren Stilen werden von Google heruntergeladen, das dabei Ihre IP-Adresse sieht. Stylesheets, die Sie per <code>@import</code> einbinden, werden von ihrer Adresse geladen.',
      ],
    },
    site: {
      title: 'Diese Website',
      body: [
        'stylebot.dev verwendet keine Werbung und keine Cookies und wird auf GitHub Pages gehostet, das übliche Server-Logs speichert. Plausible zählt Besuche nach Seite, verweisender Seite, Land und Gerätetyp, ohne Cookies und ohne Daten, die Sie identifizieren.',
      ],
    },
    sharing: {
      title: 'Weitergabe',
      body: [
        'Stylebot erhebt, verkauft und teilt Ihre Daten nicht. Daten verlassen Ihren Browser nur für die oben genannten Dienste, und nur, wenn Sie diese nutzen.',
      ],
    },
    contact: {
      title: 'Änderungen und Kontakt',
      body: [
        'Änderungen an dieser Erklärung sind im <a href="{history}">Verlauf der Website auf GitHub</a> aufgeführt. Fragen richten Sie an <a href="mailto:{email}">{email}</a> oder über ein <a href="{issues}">GitHub-Issue</a>.',
      ],
    },
    translation:
      'Dies ist eine Übersetzung. Bei Abweichungen von der <a href="{original}">englischen Fassung</a> gilt die englische Fassung.',
  },
  releases: {
    title: 'Neu in {version}',
    bugFixes: 'Und viele <a href="{changelog}">Fehlerbehebungen</a>',
    sections: 'Abschnitte',
    r31: {
      description:
        'Stylebot 3.1 bringt Synchronisierung und Backup mit Google Drive, einen Editor mit anpassbarer Größe und Farbpaletten.',
      syncTitle: 'Synchronisierung und Backup mit Google Drive',
      syncAlt: 'Stile mit Google Drive synchronisieren',
      syncBody: [
        'Aktivieren und autorisieren Sie die Synchronisierung mit Google Drive auf der <strong>Optionsseite</strong> von Stylebot.',
        'Danach klicken Sie im Popup oder auf der Optionsseite auf <strong>Jetzt synchronisieren</strong>, um die Stile Ihres Browsers mit denen in Google Drive abzugleichen.',
      ],
      resizeTitle: 'Größe des Stylebot-Editors ändern',
      resizeAlt: 'Die Größe des Stylebot-Editors wird geändert',
      resizeBody:
        'Sie können die Größe des Stylebot-Editors jetzt ändern und die Seite optional schmaler machen, damit ihr Inhalt nicht unter dem Editor liegt.',
      colorsTitle: 'Farbpaletten',
      colorsAlt: 'Auswahl einer Farbe aus einer Palette',
      colorsBody:
        'Eine verbesserte Farbauswahl mit Paletten erleichtert die Wahl guter Farben.',
    },
    r32: {
      description:
        'Stylebot 3.2 bringt schnelleres Styling ohne Flackern, einen neu gestalteten Lesbarkeitsmodus und ein aufgeräumteres Popup.',
      lede: 'Stylebot wird wieder aktiv entwickelt, und weitere Updates sind geplant.',
      fasterTitle: 'Schnelleres Styling ohne Flackern',
      fasterBody:
        'CSS wird jetzt zwischengespeichert und sofort angewendet. Seiten blitzen nicht mehr ungestylt auf, bis Ihre Stile geladen sind, und alles fühlt sich flotter an.',
      readabilityTitle: 'Ein neu gestalteter Lesbarkeitsmodus',
      readabilityAlt:
        'Die neuen Design- und Typografie-Einstellungen direkt im Lesbarkeitsmodus',
      readabilityItems: [
        'Neuerer Algorithmus zur Artikelerkennung, der Seiten besser aufräumt',
        'Schnellere Aktivierung, noch bevor der Rest der Seite geladen ist',
        'Design und Typografie direkt anpassbar',
        'Flüssigere Ladeanimation',
        'Tastenkombination zum Umschalten',
      ],
      popupTitle: 'Ein aufgeräumteres Popup',
      popupAlt: 'Das neu gestaltete Popup von Stylebot',
      popupItems: [
        'Vollständig anklickbare Schalterzeilen',
        'Direkter Zugang zu den Einstellungen',
        'Unterstützung für den Dunkelmodus',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 bringt einen neu gestalteten Editor, eine Befehlszeile für Coding-Agenten, Profile, einen Seitenbereich, Chat, einen Versionsverlauf und Synchronisierung.',
      lede: 'Ein neu gestalteter Editor, eine Befehlszeile für Coding-Agenten, Profile und ein Seitenbereich.',
      toc: {
        editor: 'Neuer Editor',
        cli: 'Befehlszeile',
        profiles: 'Profile',
        panel: 'Seitenbereich',
        history: 'Versionsverlauf',
        sync: 'Synchronisierung',
        chat: 'Chat',
        more: 'Und mehr',
      },
      editorTitle: 'Ein neu gestalteter Editor',
      editorAlt:
        'Der neu gestaltete Tab „Einfach“ beim Gestalten von Hacker News mit einem Newspaper-Profil',
      editorBody: 'Von Grund auf neu entwickelt, jetzt mit Dunkelmodus.',
      editorItems: [
        'Gruppierte Steuerelemente, die die Werte der Seite anzeigen',
        'Bessere Selektoren, die auch nach einem Update der Website funktionieren, mit Alternativen zur Auswahl',
        'Zeigt an, wenn eine andere Regel einen Wert überschreibt',
        'Farbpaletten und eine Pipette',
        'Vorschau einer Farbe oder Schrift auf der Seite, wenn Sie darauf zeigen',
        'Jede andere CSS-Eigenschaft direkt unter „Weitere Eigenschaften“ bearbeiten',
        'Änderungen rückgängig machen',
      ],
      profilesTitle: 'Profile',
      profilesAlt:
        'Das Popup auf einer Website mit zwei Profilen, Dracula und Gruvbox',
      profilesBody:
        'Legen Sie mehrere Looks für eine Website an und wechseln Sie im Editor oder im Popup zwischen ihnen.',
      panelTitle: 'Im Seitenbereich oder im eigenen Fenster',
      panelAlt:
        'Das Menü des Editors, mit „Position“ auf den Seitenbereich gesetzt',
      panelBody:
        'In Chrome und Edge öffnet sich der Editor im Seitenbereich. Oder lösen Sie ihn in ein eigenes Fenster heraus, über <strong>Position</strong> im Menü <strong>⋯</strong> des Editors.',
      historyTitle: 'Versionsverlauf',
      historyBody:
        'Jede Änderung bleibt erhalten, und Sie können jede frühere Version wiederherstellen.',
      syncTitle: 'Synchronisierung',
      syncBody:
        'Die Google Drive-Synchronisierung ist robuster. Änderungen von verschiedenen Computern werden zusammengeführt, sodass keine verloren geht. Sie läuft automatisch alle 30 Minuten und direkt nach jeder Änderung.',
      chatTitle: 'Chat',
      chatBody:
        'Kein Coding-Agent? Beschreiben Sie, was Sie möchten, oder wählen Sie einen vorgeschlagenen Look, und Stylebot schreibt das CSS. Mit Ihrem eigenen Schlüssel für Claude, OpenAI oder Gemini.',
      chatAlt:
        'Der Chat-Tab schlägt Looks für die Seite vor: „Gemütlich“, „Ruhig“ und „Nur Links in Farbe“',
      moreTitle: 'Und mehr',
      moreItems: [
        'Ein neues stylebot.dev',
        'Ein neues Stylebot-Symbol',
        'Stile greifen jetzt auch im Shadow DOM und funktionieren so auf Websites mit Web Components',
        'Die Tastenkombinationen von Stylebot befinden sich jetzt in den Tastenkombinations-Einstellungen Ihres Browsers. In Chrome und Edge sind von Ihnen geänderte Tastenkombinationen wieder auf den Standard zurückgesetzt; legen Sie sie dort neu fest.',
        'Stylebot gibt es jetzt auf Vietnamesisch',
      ],
    },
  },
  notFound: {
    title: 'Seite nicht gefunden',
    description: 'Diese Seite existiert nicht.',
    heading: 'Diese Seite existiert nicht, und sie sieht furchtbar aus.',
    done: 'Viel besser. Die Seite existiert zwar immer noch nicht, aber wenigstens sieht sie jetzt gut aus.',
    pageTitle: '404 Nicht gefunden',
    pageBody: 'Die angeforderte URL wurde auf diesem Server nicht gefunden.',
    pageLink: 'Zur Startseite',
    nice: '✨ Einfach schön machen',
  },
};

export default site;
