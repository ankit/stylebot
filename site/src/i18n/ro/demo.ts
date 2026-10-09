import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Fixează-l în bara de instrumente',
      body: 'Ține Stylebot la un clic distanță.',
      captions: {
        menu: 'La început, Stylebot stă în meniul de extensii.',
        pinned: 'Fixat. Stylebot este acum în bara de instrumente.',
      },
    },
    open: {
      title: 'Deschide editorul',
      keysBody: 'Dă clic pe pictogramă sau apasă {keys}.',
      captions: {
        iconThenStyle:
          'Dă clic pe pictograma Stylebot, apoi pe Stilizează această pagină.',
        orKeys: 'Sau apasă {keys} ca să-l deschizi direct.',
      },
    },
    pick: {
      title: 'Alege un element',
      fieldsBody: 'Dă clic ca să selectezi. Câmpurile arată stilurile actuale.',
      captions: {
        hoverToSee: 'Treci cu mouse-ul ca să vezi ce poți stiliza.',
        select:
          'Dă clic ca să selectezi. Selectorul CSS se completează singur.',
        computed:
          'Fiecare câmp arată valoarea calculată actuală a elementului.',
      },
    },
    style: {
      title: 'Stilizează-l',
      body: 'Folosește controalele din Simplu sau scrie CSS.',
      captions: {
        size: 'Setează mărimea…',
        color: '…și culoarea.',
        plainCss:
          'Fiecare modificare este CSS simplu, salvat pentru acest site.',
        byHand: 'Sau scrie CSS de mână.',
        live: 'Pagina se actualizează pe măsură ce scrii.',
      },
    },
    profiles: {
      title: 'Profiluri',
      looksBody: 'Salvează aspecte diferite pentru același site.',
      captions: {
        createForLook: 'Creează un profil pentru un aspect nou.',
        created: '{profile} pornește gol. {defaultProfile} rămâne salvat.',
        newspaperLook: 'Dă-i un aspect de ziar.',
        darkLook: 'Dă-i un aspect întunecat și cald.',
        switchAnytime: 'Comută între ele oricând.',
        backToDefault: 'Înapoi la {defaultProfile}. Un site, două aspecte.',
      },
    },
  },
  browser: {
    extensions: 'Extensii',
    fullAccess: 'Acces complet',
    fullAccessNote:
      'Aceste extensii pot vedea și modifica informațiile de pe acest site.',
    otherExtensions: {
      adBlocker: 'Blocare reclame',
      passwordManager: 'Manager de parole',
      translate: 'Traducere',
      webArchive: 'Arhivă web',
    },
  },
  popup: {
    readability: 'Lizibilitate',
    styleThisPage: 'Stilizează această pagină',
  },
  editor: {
    defaultProfile: 'Implicit',
    newProfile: 'Ziar',
    newProfileDark: 'Bufniță de noapte',
    createProfile: 'Creează profil',
    pickAnElement: 'Alege un element',
    tabs: {
      basic: 'Simplu',
      code: 'Cod',
      presets: 'Presetări',
      chat: 'Chat',
    },
    basic: {
      hide: 'Ascunde',
      reset: 'Resetează',
      text: 'Text',
      font: 'Font',
      defaultFont: 'Prestabilit',
      size: 'Mărime',
      lineHeight: 'Înălțimea liniei',
      color: 'Culoare',
      decoration: 'Decorare',
      none: 'Fără',
      alignment: 'Aliniere',
      background: 'Fundal',
      box: 'Casetă',
      effects: 'Efecte',
      moreProperties: 'Mai multe proprietăți',
    },
    code: {
      noStyles: 'Încă niciun stil',
    },
    presets: {
      readability: 'Lizibilitate',
      articlesOnly: 'Doar articole',
      readabilityDescription:
        'Transformă articolele de pe acest site într-o vizualizare de citire curată, fără distrageri, cu tema, fontul și mărimea alese de tine.',
      grayscale: 'Alb-negru',
      grayscaleDescription: 'Aplică modul alb-negru pe pagină.',
    },
  },
  article: {
    nav: {
      news: 'Știri',
      travel: 'Călătorii',
      signIn: 'Conectare',
    },
    kicker: 'Călătorii · Reportaj',
    headline: 'Întoarcerea discretă a feribotului de noapte',
    dek: 'Trei operatori mizează că pasagerii vor da viteza pe o cabină, o vedere la mare și niciun aeroport.',
    byline: 'Marta Linde · 24 sept. · 6 min de lectură',
    paragraphs: [
      'La douăzeci de ani după ce ultima traversare de noapte a fost anulată, trei operatori readuc cabinele pe apă. Oferta e simplă: urci la bord după cină, dormi pe toată durata traversării și te trezești în altă țară.',
      'Locurile pe prima linie redeschisă s-au epuizat pentru toată vara într-o săptămână. Majoritatea pasagerilor au sub patruzeci de ani, iar mulți n-au călătorit niciodată noaptea, nici cu trenul, nici cu vaporul. Operatorii spun că se ocupă întâi cabinele, apoi scaunele rabatabile, apoi puntea.',
    ],
    quote:
      '„Nimeni nu rezervă asta ca să câștige timp. O rezervă ca să mai piardă puțin.”',
    quoteBy: '— Ines Varga, planificatoare de rute',
  },
  steps: {
    heading: 'Cum funcționează',
    counter: '{current} / {total}',
    jump: 'Sari la acest moment',
  },
};

export default demo;
