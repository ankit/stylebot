import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Schimbă aspectul oricărui site',
    titleSuffix: '{title} - Stylebot',
    description:
      'Arată spre ceva de pe o pagină și modifică-l, sau descrie ce vrei. Stylebot scrie CSS-ul. Gratuit și open source pentru Chrome, Firefox și Edge.',
  },
  header: {
    home: 'Pagina principală Stylebot',
    manual: 'Manual',
    install: 'Instalează',
    language: 'Limbă',
    suggest: 'Vezi această pagină în română',
    dismiss: 'Închide',
    theme: 'Temă: {theme}',
  },
  themes: {
    light: 'Luminoasă',
    dark: 'Întunecată',
    stylebot: 'Stylebot',
    newsprint: 'Ziar',
  },
  footer: {
    changelog: 'Jurnal de modificări',
    donate: 'Cumpără-mi o cafea',
  },
  store: {
    add: 'Adaugă în {store}',
    addFree: 'Adaugă în {store} — e gratuit',
    reinstall: 'Reinstalează pentru {store}',
  },
  zoom: {
    label: 'Captură de ecran mărită',
    close: 'Închide',
  },
  home: {
    title: '{word} orice site.',
    titleWord: 'Stilizează',
    titleWordHint: 'Dă clic pentru alt stil',
    lede: 'Arată spre ceva de pe pagină și modifică-l, sau pur și simplu descrie ce vrei. Stylebot scrie CSS-ul și îți încarcă stilul de fiecare dată când revii.',
    also: 'Disponibil și pentru {first} și {second}',
    installTitle: 'Instalează Stylebot',
    installBody:
      'Gratuit și open source din 2011. Fără cont și fără urmărire. Stilurile tale rămân în browser, iar codul este pe GitHub.',
    cli: 'Folosești un agent de programare? Adaugă și <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copiază',
    copied: 'Copiat',
    copyCommand: 'Copiază {command}',
    title: 'Funcționează cu agentul tău de programare',
    body: 'Claude Code, Codex, Cursor sau orice agent care rulează comenzi poate folosi Stylebot din terminal.',
    guide: 'Configurează CLI →',
    demo: {
      terminal: 'Terminal · agent de programare',
      prompt: 'fă {site} mai ușor de citit noaptea',
      done: 'Fundal întunecat, text mai cald, corp de text serif mai mare. Reclamă eliminată.',
      before: 'Înainte',
      after: 'După',
      kicker: 'Călătorii',
      headline: 'Întoarcerea discretă a feribotului de noapte',
      dek: 'Trei operatori mizează că pasagerii vor da viteza pe o cabină, o vedere la mare și niciun aeroport.',
      text: 'Cursa de 22:40 din Rostock pleacă fără fast. Până rămân în urmă luminile portului, majoritatea pasagerilor și-au găsit cabinele, iar la bar s-a așternut un murmur domol.',
      ad: 'Reclamă',
    },
    page: {
      title: 'Linia de comandă',
      description:
        'Controlează Stylebot din terminal sau lasă un agent de programare precum Claude Code, Codex sau Cursor să schimbe stilul site-urilor în browserul tău, cu propriul abonament.',
      heading: 'Stylebot din terminal',
      lede: 'Controlează Stylebot din linia de comandă sau lasă un agent de programare precum Claude Code, Codex sau Cursor să o facă. Agentul schimbă stilul site-urilor direct în browserul tău, cu propriul abonament, fără cheie API.',
      setup: 'Configurare',
      install: 'Instalează Stylebot',
      installBody:
        'Pentru Chrome sau Edge. Linia de comandă nu funcționează încă în Firefox.',
      cli: 'Instalează CLI',
      cliBody: 'Necesită Node 20 sau o versiune mai nouă.',
      connect: 'Conectează-l la browserele tale',
      connectBody:
        'Astfel, CLI-ul este înregistrat în Chrome și Edge, ca Stylebot să poată comunica cu el.',
      access: 'Activează accesul din linia de comandă',
      accessBody:
        'În opțiunile Stylebot, la „De bază”, activează <strong>Permite aplicațiilor de pe acest computer să controleze Stylebot</strong> și acceptă ce îți cere browserul.',
      plugin: 'Adaugă pluginul Claude Code',
      optional: 'Opțional',
      pluginBody: 'În Claude Code, rulează:',
      tryIt: 'Apoi încearcă:',
      commands: 'Comenzi',
      commandsBody:
        'Un agent le rulează pentru tine, dar le poți rula și singur. <code>stylebot --help</code> le listează pe toate.',
      examples: {
        open: 'Deschide pagina într-o fereastră din spatele celei curente și afișează ID-ul filei.',
        outline:
          'Afișează elementele vizibile ale paginii sub formă de schiță.',
        css: 'Salvează CSS-ul ca stil al site-ului, îl aplică și verifică pagina.',
        screenshot: 'Salvează o imagine a filei.',
      },
      privacy: 'Confidențialitate',
      privacyBody: [
        'Accesul din linia de comandă este dezactivat până îl activezi. Cât timp e activ, aplicațiile de pe acest calculator îți pot citi paginile deschise, pot face capturi de ecran și îți pot schimba stilurile. Îl poți dezactiva oricând din opțiunile Stylebot.',
        'Stylebot și CLI-ul comunică doar între ele, pe acest calculator, și nu trimit nimic nicăieri. Un agent trimite ce citește propriului furnizor, așa cum Claude Code trimite la Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Stiluri de la care să pornești',
    lede: 'Copiază unul și ajustează-l sau pornește de la zero.',
    hint: 'Lipește-l în fila Cod pe {site}.',
    enlarge: 'Mărește {site}: {name}',
    alt: '{site} restilizat cu Stylebot: {name}',
    install: 'Instalează',
    installTitle: 'Instalează în Stylebot',
    installed: 'Instalat',
    installedAs: 'Instalat ca {name}',
    installFailed: 'Nu s-a putut instala',
    copy: 'Copiază CSS',
    copied: 'Copiat',
    source: 'Vezi pe GitHub',
    lightbox: 'Site restilizat',
    close: 'Închide',
  },
  quotes: {
    title: 'Oamenii iubesc Stylebot',
  },
  features: {
    title: 'Tot ce mai primești.',
    previous: 'Funcția anterioară',
    next: 'Funcția următoare',
    sync: {
      title: 'Sincronizare',
      body: 'Conectează Google Drive și stilurile te urmează pe fiecare calculator pe care te conectezi. Stylebot sincronizează la fiecare 30 de minute și imediat după ce faci o modificare.',
      connected: 'Conectat la Google Drive',
      synced: 'Sincronizat acum 2 minute',
      syncNow: 'Sincronizează acum',
      savedTo: 'Salvat în',
      disconnect: 'Deconectează',
      schedule: 'Program',
      scheduleValue:
        'La fiecare 30 de minute și imediat după ce modifici un stil',
    },
    history: {
      title: 'Istoricul versiunilor',
      body: 'Fiecare modificare a stilurilor este păstrată, cele mai noi primele. Deschide o intrare ca să vezi ce s-a schimbat și restaureaz-o cu un clic.',
      today: 'Astăzi, 25 sept.',
      yesterday: 'Ieri, 24 sept.',
      noChanges: 'Nicio modificare',
      edited: 'Editat',
      sites: '10 site-uri',
      current: 'Curentă',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'Presetări',
      body: 'Lizibilitatea și modul alb-negru funcționează pe orice site și se combină cu propriile tale modificări.',
      readability: 'Lizibilitate',
      articlesOnly: 'Doar articole',
      readabilityBody:
        'O vizualizare de citire curată, cu tema, fontul și mărimea alese de tine.',
      grayscale: 'Alb-negru',
      grayscaleBody: 'Aplică modul alb-negru pe pagină.',
    },
    chat: {
      title: 'Chat',
      body: 'Nu ai un agent de programare? Descrie o modificare în fila Chat, iar Stylebot scrie CSS-ul. Folosește propria cheie Claude, OpenAI sau Gemini. Cheia rămâne în browserul tău.',
      prompt: 'Fă articolul mai ușor de citit noaptea',
      reply:
        'Am trecut la un fundal întunecat cu text mai cald și am pus corpul textului într-un serif mai mare, cu rânduri mai aerisite.',
      updated: 'Stiluri actualizate',
      undo: 'Anulează',
      placeholder: 'Descrie o modificare',
    },
  },
  welcome: {
    title: 'Bun venit',
    description:
      'Cum funcționează Stylebot, de la început până la sfârșit, în cam un minut.',
    heading: 'Stylebot este instalat.',
    yourTurn: 'E rândul tău.',
    yourTurnBody:
      'Deschide orice site și apasă comanda rapidă. Nimic nu se schimbă până nu o faci tu.',
    manual: 'Manual',
    agentTitle: 'Conectează-ți agentul de programare',
    agentBody:
      'Claude Code, Codex, Cursor sau orice agent care rulează comenzi poate folosi Stylebot din terminal.',
    agentPrompt:
      'pune pe site-ul ăsta o temă Everforest cu fonturi mai frumoase',
    agentReply: 'Am trecut la culorile Everforest, cu Lora și Newsreader.',
  },
  goodbye: {
    title: 'La revedere',
    description: 'Mulțumesc că ai folosit Stylebot.',
    panda: 'Un panda pixelat care îți face cu mâna',
    heading: 'Mulțumesc că ai folosit Stylebot.',
    lede: 'Stilurile tale au fost eliminate din acest browser. Dacă ai activat sincronizarea, o copie de rezervă se află încă în Google Drive.',
    changedMind: 'Te-ai răzgândit?',
    note: 'Lucrez la Stylebot din 2011. Mulțumesc că l-ai încercat și pentru orice părere îmi lași.',
    signature: '— Ankit',
    feedback: {
      question: 'De ce l-ai dezinstalat?',
      optional: 'Opțional, durează o secundă.',
      reasons: [
        'Nu mai aveam nevoie de el',
        'Greu de folosit',
        'A stricat un site',
        'Lipsește o funcție',
        'Prea lent',
        'Altceva',
      ],
      placeholder: 'Mai e ceva? (opțional)',
      send: 'Trimite feedback',
      sendNote: 'Ajunge direct la dezvoltator.',
      thanks: 'Mulțumesc. Citesc fiecare mesaj.',
    },
  },
  manual: {
    title: 'Manual',
    description:
      'Cum folosești Stylebot: stilizarea unui site, profiluri, linia de comandă, Chat, sincronizare, reguli URL și comenzi rapide.',
    lede: 'Cum funcționează Stylebot, de la primul stil la profiluri, Chat și sincronizare.',
    sections: 'Secțiunile manualului',
    toc: {
      start: 'Primii pași',
      profiles: 'Profiluri',
      cli: 'Linia de comandă',
      chat: 'Chat',
      presets: 'Lizibilitate și alb-negru',
      sync: 'Sincronizare, copii de rezervă și istoric',
      urls: 'Reguli URL',
      shortcuts: 'Comenzi rapide',
      help: 'Ajutor și asistență',
    },
    start: {
      open: 'Dă clic pe pictograma Stylebot din bara de instrumente, apoi pe <strong>Stilizează această pagină</strong>. Sau apasă [[alt+shift+M]] în orice filă, ori dă clic dreapta pe un element și alege <strong>Stylebot → Stilizează elementul</strong>.',
      shot: 'Fila Simplu, cu un link ales dintr-un articol Wikipedia',
      pick: 'Dă clic pe selectorul de elemente, treci cu mouse-ul peste pagină și dă clic pe un element. Apasă [[↑]] înainte de clic ca să selectezi elementul părinte. Apoi modifică-l în <strong>Simplu</strong> sau scrie CSS în <strong>Cod</strong>. Modificările se salvează pe măsură ce le faci și se încarcă de fiecare dată când vizitezi site-ul.',
      fonts: 'Fonturi',
      fontsBody:
        'Caută printre 400 de <a href="https://fonts.google.com/">Google Fonts</a>, iar Stylebot îl încarcă pe cel ales, sau scrie numele oricărui font instalat pe calculator.',
      position: 'Poziția editorului',
      positionBody:
        'În Chrome și Edge, editorul se deschide în panoul lateral. Folosește <strong>Poziție</strong> din meniul <strong>⋯</strong> ca să-l deschizi într-o fereastră separată sau să-l andochezi în pagină. Firefox nu are panou lateral.',
      off: 'Dezactivarea unui stil',
      offBody:
        'Folosește comutatorul din fereastra pop-up sau [[alt+shift+S]]. Stilul rămâne păstrat, doar că nu se aplică.',
      callout:
        'Unele site-uri folosesc nume de clase generate automat, care se schimbă când site-ul se actualizează. Dacă un stil nu mai funcționează, alege din nou elementul ca să obții un selector nou.',
    },
    profiles: {
      intro:
        'Un profil este o foaie de stil separată pentru același site, ca să poți păstra mai multe aspecte și să comuți între ele. Doar unul se aplică la un moment dat, iar fiecare site pornește cu Implicit.',
      shot: 'Fereastra pop-up pe Hacker News, cu patru profiluri: Violet Hour, Everforest, Hearth și Newspaper',
      manage:
        'Dă clic pe numele profilului de lângă site, în antetul editorului, ca să creezi, redenumești, duplici sau ștergi profiluri. Comută între ele acolo sau în fereastra pop-up, unde <strong>Fără stil</strong> dezactivează stilurile pentru site. Profilurile noi pornesc goale.',
    },
    cli: {
      intro:
        'Comanda <code>stylebot</code> îi permite unui agent de programare precum Claude Code, Codex sau Cursor să schimbe stilul site-urilor direct în browserul tău, cu propriul abonament, fără cheie API. Este cel mai bun mod de a lăsa un agent să stilizeze un site, iar comenzile le poți rula și singur.',
      setup: 'Configurare',
      setupBody:
        'Instalează CLI, conectează-l la browserele tale, apoi activează <strong>Permite aplicațiilor de pe acest computer să controleze Stylebot</strong> în Opțiuni. <a href="{cli}">Pagina despre linia de comandă</a> te ghidează pas cu pas. Deocamdată doar în Chrome și Edge.',
      claudeCodeBody:
        'Adaugă pluginul Stylebot și cere o modificare cu <code>/stylebot</code>, de exemplu o temă întunecată pentru un site.',
      privacy: 'Confidențialitate',
      privacyBody:
        'Accesul din linia de comandă este dezactivat până îl activezi. Stylebot și CLI-ul comunică doar între ele, pe acest calculator; un agent trimite ce citește propriului furnizor.',
    },
    chat: {
      intro:
        'Fila Chat e ideală pentru remedieri rapide. Descrie acolo modificarea pe care o vrei, iar Stylebot scrie CSS-ul. Poți alege un element ca să arăți spre ceva anume sau poți atașa o captură de ecran ca să arăți ce ai în minte. Pentru modificări mai mari, cum ar fi o temă complet nouă, folosește <a href="#cli">linia de comandă</a>.',
      shot: 'Fila Chat pe Hacker News, după cererea unei teme în nuanțe de pădure, cu un font serif ușor de citit',
      key: 'Folosește propria cheie',
      keyBody:
        'Conectează o cheie API Claude, OpenAI sau Gemini. Cheile sunt salvate doar pe acest calculator și nu sunt sincronizate niciodată. Mesajele merg direct din browser la furnizor.',
      changes: 'Unde ajung modificările',
      changesBody:
        'Fiecare modificare se aplică imediat și se adaugă în foaia de stil a profilului curent. Dă clic pe <strong>N linii adăugate</strong> ca s-o vezi în Cod sau anuleaz-o din chat.',
      cost: 'Cost',
      costBody:
        'Numărul de tokenuri de sub caseta de mesaj arată cât a folosit conversația, cu un cost estimat.',
    },
    presets: {
      intro:
        'Ambele sunt în fila Presetări și se combină cu propriile tale modificări. <strong>Lizibilitate</strong> transformă articolele unui site într-o vizualizare de citire curată, cu temă, font, mărime și lățime la alegere; paginile care nu sunt articole rămân neatinse. <strong>Alb-negru</strong> elimină culorile de pe site, cu orice intensitate.',
      shot: 'Articolul Wikipedia despre matematică în vizualizarea Lizibilitate, cu Setări de citire deschise',
    },
    sync: {
      shot: 'Opțiuni, conectat la Google Drive și sincronizat',
      drive: 'Sincronizare cu Google Drive',
      driveBody:
        'Conectează Google Drive în Opțiuni. Stilurile tale, inclusiv profilurile, se sincronizează la fiecare 30 de minute și imediat după ce faci o modificare. Stylebot vede doar fișierele pe care le creează în Drive și nu există niciun server Stylebot.',
      conflicts: 'Conflicte',
      conflictsBody:
        'Dacă un stil s-a schimbat pe două calculatoare, se păstrează modificarea ta mai recentă, iar cealaltă versiune este salvată într-un comentariu, așa că nu se pierde nimic.',
      backup: 'Copie de rezervă',
      backupBody: 'Exportă și importă toate stilurile ca JSON din Opțiuni.',
      history: 'Istoricul versiunilor',
      historyBody:
        'Fiecare modificare de pe acest calculator este păstrată în Opțiuni, inclusiv cele care vin prin sincronizare. Restaurează orice versiune anterioară, pentru unele site-uri sau pentru toate.',
      historyShot:
        'Istoricul versiunilor în Opțiuni, cu cea mai nouă modificare prima',
    },
    urls: {
      intro:
        'În mod implicit, Stylebot asociază stilurile cu site-urile după numele de domeniu. Editează URL-ul unui stil în Opțiuni și folosește aceste modele pentru ceva mai specific.',
      wildcards: {
        anything: 'Potrivește orice secvență de caractere.',
        segment: 'Potrivește orice secvență de caractere până la primul /.',
        list: 'Separă o listă de modele. Un URL se potrivește dacă se potrivește oricare dintre modele.',
        regex: 'La începutul unui URL, îl transformă într-o expresie regulată.',
      },
      examplesTitle: 'Exemple',
      examples: {
        domain:
          'Domeniul docs.google.com sau oricare dintre subdomeniile sale.',
        prefix: 'Orice URL care începe cu docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com și așa mai departe.',
        subdomains: 'news.ycombinator.com și apps.ycombinator.com.',
        either: 'Oricare dintre domenii sau oricare dintre subdomeniile lor.',
        regex: 'Doar pagina principală Reddit.',
        everywhere:
          'Toate site-urile. Util pentru stilurile pe care le vrei peste tot.',
      },
    },
    shortcuts: {
      intro:
        'Comenzile rapide globale funcționează pe orice pagină pe care Stylebot o poate stiliza; le schimbi din setările de comenzi rapide ale browserului, la care ajungi din Opțiuni. Pentru comenzile rapide ale editorului, apasă [[?]] în editor.',
      or: 'sau',
      unset: 'Nesetată; atribuie-o din browser',
      global: 'Globale',
      picker: 'În timp ce alegi un element',
      actions: {
        toggleEditor: 'Comută editorul',
        toggleStyling: 'Comută stilurile',
        toggleReadability: 'Comută lizibilitatea',
        toggleGrayscale: 'Comută modul alb-negru',
        parent: 'Selectează elementul părinte',
        child: 'Revino la elementul copil',
        select: 'Selectează elementul evidențiat',
      },
    },
    help: {
      body: 'Ai găsit o eroare sau ai o idee? Deschide un issue pe <a href="{issues}">GitHub</a>. Stylebot este gratuit și open source, întreținut din 2011. Dacă îți este util, îl poți susține <a href="{donate}">cumpărându-mi o cafea</a>.',
    },
  },
  privacy: {
    title: 'Confidențialitate',
    description:
      'Ce face Stylebot cu datele tale: fără server, fără cont, fără statistici.',
    lede: 'Stylebot nu are server, cont sau statistici. Stilurile tale rămân în browser, cu excepția cazului în care activezi sincronizarea, chatul sau linia de comandă; atunci ajung direct la un serviciu ales de tine sau la o aplicație căreia i-ai dat voie.',
    updated: 'Ultima actualizare: {date}',
    browser: {
      title: 'Ce rămâne în browser',
      body: [
        'Stilurile, profilurile, setările, istoricul, conversațiile din chat și cheile API sunt salvate în spațiul de stocare pentru extensii al browserului, iar dezinstalarea Stylebot le elimină. Stylebot citește paginile pe care le vizitezi ca să le stilizeze și nu trimite nimic din ele decât dacă folosești chatul sau linia de comandă.',
      ],
    },
    sync: {
      title: 'Sincronizare cu Google Drive',
      body: [
        'Când conectezi Google Drive în Opțiuni, stilurile tale sunt salvate într-un fișier din propriul tău Drive. Stylebot poate vedea doar fișierele pe care le creează. Tokenul său de acces rămâne în browser și expiră după o oră. Te poți deconecta din Opțiuni sau din <a href="https://myaccount.google.com/connections">contul Google</a>.',
        'Utilizarea de către Stylebot a informațiilor primite de la API-urile Google respectă <a href="https://developers.google.com/terms/api-services-user-data-policy">Politica privind datele utilizatorilor pentru serviciile API Google</a>, inclusiv cerințele de utilizare limitată.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Când adaugi o cheie API și trimiți un mesaj, browserul îl trimite direct furnizorului respectiv, împreună cu orice captură de ecran atașată, adresa și titlul paginii, o schiță a ceea ce se vede pe pagină, CSS-ul ei și stilurile tale. Acestea pot include informații personale afișate pe pagină, așa că nu folosi chatul pe pagini pe care nu le-ai împărtăși furnizorului. Se aplică politica acestuia: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Linia de comandă',
      body: [
        'Când activezi <q>Permite aplicațiilor de pe acest computer să controleze Stylebot</q> în Opțiuni, aplicațiile care rulează în numele tău îți pot lista filele, pot citi pagini, pot face capturi de ecran și îți pot citi și modifica stilurile, printr-o conexiune locală pe care doar tu o poți folosi. Ce citesc poate ajunge la serviciile pe care le folosesc, cum ar fi modelul din spatele unui agent de programare. Dezactivează setarea ca să deconectezi.',
      ],
    },
    fonts: {
      title: 'Fonturi și CSS importat',
      body: [
        'Fonturile Google Fonts din stilurile tale sunt descărcate de la Google, care îți vede adresa IP. Foile de stil importate cu <code>@import</code> sunt descărcate de la adresa lor.',
      ],
    },
    site: {
      title: 'Acest site',
      body: [
        'stylebot.dev nu are reclame sau cookie-uri și este găzduit pe GitHub Pages, care păstrează jurnale standard de server. Plausible numără vizitele după pagină, sursa vizitei, țară și tipul de dispozitiv, fără cookie-uri și fără nimic care să te identifice.',
      ],
    },
    sharing: {
      title: 'Partajare',
      body: [
        'Stylebot nu colectează, nu vinde și nu partajează datele tale. Acestea părăsesc browserul doar către serviciile de mai sus, atunci când le folosești.',
      ],
    },
    contact: {
      title: 'Modificări și contact',
      body: [
        'Modificările acestei politici sunt listate în <a href="{history}">istoricul site-ului pe GitHub</a>. Pentru întrebări, scrie la <a href="mailto:{email}">{email}</a> sau deschide un <a href="{issues}">issue pe GitHub</a>.',
      ],
    },
    translation:
      'Aceasta este o traducere. Dacă diferă de <a href="{original}">versiunea în engleză</a>, se aplică versiunea în engleză.',
  },
  releases: {
    title: 'Noutăți în {version}',
    bugFixes: 'Și multe <a href="{changelog}">remedieri de erori</a>',
    sections: 'Secțiuni',
    r31: {
      description:
        'Stylebot 3.1 aduce sincronizare și copii de rezervă cu Google Drive, un editor redimensionabil și palete de culori.',
      syncTitle: 'Sincronizare și copii de rezervă cu Google Drive',
      syncAlt: 'Sincronizarea stilurilor cu Google Drive',
      syncBody: [
        'Activează și autorizează sincronizarea cu Google Drive din <strong>pagina Opțiuni</strong> a Stylebot.',
        'După ce o activezi, dă clic pe <strong>Sincronizează acum</strong> în fereastra pop-up sau în pagina Opțiuni ca să sincronizezi stilurile din browser cu cele salvate în Google Drive.',
      ],
      resizeTitle: 'Redimensionează editorul Stylebot',
      resizeAlt: 'Redimensionarea editorului Stylebot',
      resizeBody:
        'Acum poți redimensiona editorul Stylebot și, opțional, poți micșora pagina, ca să nu-i rămână conținutul sub editor.',
      colorsTitle: 'Palete de culori',
      colorsAlt: 'Alegerea unei culori dintr-o paletă',
      colorsBody:
        'Un selector de culori îmbunătățit, cu palete, te ajută să alegi mai ușor culori bune.',
    },
    r32: {
      description:
        'Stylebot 3.2 aduce stilizare mai rapidă, fără pâlpâire, modul Lizibilitate reproiectat și o fereastră pop-up mai curată.',
      lede: 'Stylebot este din nou în dezvoltare activă și urmează mai multe actualizări.',
      fasterTitle: 'Stilizare mai rapidă, fără pâlpâire',
      fasterBody:
        'CSS-ul este acum memorat în cache și aplicat instantaneu, așa că paginile nu mai apar o clipă fără stil până se încarcă stilurile tale, iar totul pare mai rapid.',
      readabilityTitle: 'Modul Lizibilitate, reproiectat',
      readabilityAlt:
        'Noile controale de temă și tipografie din modul Lizibilitate',
      readabilityItems: [
        'Algoritm nou de extragere a articolelor, mai bun la curățarea paginilor',
        'Activare mai rapidă, înainte să se încarce restul paginii',
        'Temă și tipografie personalizabile direct în pagină',
        'Animație de încărcare mai fluidă',
        'Comandă rapidă pentru activare și dezactivare',
      ],
      popupTitle: 'O fereastră pop-up mai curată',
      popupAlt: 'Fereastra pop-up reproiectată a Stylebot',
      popupItems: [
        'Rânduri de comutare pe care poți da clic oriunde',
        'Buton direct pentru setări',
        'Suport pentru modul întunecat',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 aduce un editor reproiectat, o linie de comandă pentru agenții de programare, profiluri, un panou lateral, Chat, istoricul versiunilor și sincronizare.',
      lede: 'Un editor reproiectat, o linie de comandă pentru agenții de programare, profiluri și un panou lateral.',
      toc: {
        editor: 'Editor reproiectat',
        cli: 'Linia de comandă',
        profiles: 'Profiluri',
        panel: 'Panou lateral',
        history: 'Istoricul versiunilor',
        sync: 'Sincronizare',
        chat: 'Chat',
        more: 'Și altele',
      },
      editorTitle: 'Un editor reproiectat',
      editorAlt:
        'Fila Simplu reproiectată, stilizând Hacker News cu un profil Newspaper',
      editorBody: 'Reconstruit de la zero, acum cu mod întunecat.',
      editorItems: [
        'Controale grupate care arată valorile proprii ale paginii',
        'Selectori generați mai bine, care funcționează în continuare când site-ul se actualizează, plus alternative din care să alegi',
        'Arată când o altă regulă suprascrie o valoare',
        'Palete de culori și pipetă',
        'Previzualizează o culoare sau un font pe pagină trecând cu mouse-ul peste el',
        'Orice altă proprietate CSS, editabilă pe loc în Mai multe proprietăți',
        'Suport pentru anulare',
      ],
      profilesTitle: 'Profiluri',
      profilesAlt:
        'Fereastra pop-up pe un site cu două profiluri, Dracula și Gruvbox',
      profilesBody:
        'Păstrează mai multe aspecte pentru un site și comută între ele din editor sau din fereastra pop-up.',
      panelTitle: 'Panoul lateral sau o fereastră separată',
      panelAlt: 'Meniul editorului, cu Poziție setată pe panoul lateral',
      panelBody:
        'În Chrome și Edge, editorul se deschide în panoul lateral. Sau îl poți muta într-o fereastră separată, din <strong>Poziție</strong>, în meniul <strong>⋯</strong> al editorului.',
      historyTitle: 'Istoricul versiunilor',
      historyBody:
        'Fiecare modificare este păstrată și poți restaura orice versiune anterioară.',
      syncTitle: 'Sincronizare',
      syncBody:
        'Sincronizarea cu Google Drive este mai robustă. Modificările de pe calculatoare diferite sunt combinate, așa că nu se pierde nimic. Rulează singură la fiecare 30 de minute și imediat după ce faci o modificare.',
      chatTitle: 'Chat',
      chatBody:
        'Nu ai un agent de programare? Descrie ce vrei sau alege un aspect sugerat, iar Stylebot scrie CSS-ul. Folosește propria cheie Claude, OpenAI sau Gemini.',
      chatAlt:
        'Fila Chat sugerând aspecte pentru pagină: Primitor, Liniștit și Doar linkurile colorate',
      moreTitle: 'Și altele',
      moreItems: [
        'Un nou stylebot.dev',
        'O nouă pictogramă Stylebot',
        'Stilurile se aplică acum și în shadow DOM, așa că funcționează pe site-urile construite cu web components',
        'Comenzile rapide ale Stylebot se află acum în setările de comenzi rapide ale browserului. În Chrome și Edge, cele pe care le-ai schimbat au revenit la valorile implicite, așa că setează-le din nou acolo.',
        'Stylebot este acum disponibil în vietnameză',
      ],
    },
  },
  notFound: {
    title: 'Pagina nu a fost găsită',
    description: 'Această pagină nu există.',
    heading: 'Această pagină nu există și arată groaznic.',
    done: 'Mult mai bine. Pagina tot nu există, dar măcar acum arată bine.',
    pageTitle: '404 Pagină negăsită',
    pageBody: 'URL-ul solicitat nu a fost găsit pe acest server.',
    pageLink: 'Mergi la pagina principală',
    nice: '✨ Fă-o frumoasă',
  },
};

export default site;
