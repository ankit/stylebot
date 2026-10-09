import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'Épingler à la barre d’outils',
      body: 'Gardez Stylebot à portée de clic.',
      captions: {
        menu: 'Stylebot apparaît d’abord dans le menu des extensions.',
        pinned: 'Épinglé. Stylebot est maintenant dans votre barre d’outils.',
      },
    },
    open: {
      title: 'Ouvrir l’éditeur',
      keysBody: 'Cliquez sur l’icône, ou appuyez sur {keys}.',
      captions: {
        iconThenStyle:
          'Cliquez sur l’icône Stylebot, puis sur Styliser cette page.',
        orKeys: 'Ou appuyez sur {keys} pour l’ouvrir directement.',
      },
    },
    pick: {
      title: 'Choisir un élément',
      fieldsBody:
        'Cliquez pour sélectionner. Les champs affichent ses styles actuels.',
      captions: {
        hoverToSee: 'Survolez pour voir ce qui peut être stylisé.',
        select:
          'Cliquez pour sélectionner. Le sélecteur CSS se remplit tout seul.',
        computed:
          'Chaque champ affiche la valeur calculée actuelle de l’élément.',
      },
    },
    style: {
      title: 'Styliser',
      body: 'Utilisez les commandes De base ou écrivez du CSS.',
      captions: {
        size: 'Réglez la taille…',
        color: '…puis la couleur.',
        plainCss:
          'Chaque modification est du CSS standard, enregistré pour ce site.',
        byHand: 'Ou écrivez le CSS à la main.',
        live: 'La page se met à jour pendant que vous tapez.',
      },
    },
    profiles: {
      title: 'Profils',
      looksBody: 'Enregistrez plusieurs apparences pour un même site.',
      captions: {
        createForLook: 'Créez un profil pour une nouvelle apparence.',
        created:
          '{profile} démarre vide. Le profil {defaultProfile} reste enregistré.',
        newspaperLook: 'Donnez-lui une allure de journal.',
        darkLook: 'Donnez-lui une allure sombre et chaleureuse.',
        switchAnytime: 'Passez de l’un à l’autre à tout moment.',
        backToDefault:
          'Retour au profil {defaultProfile}. Un site, deux apparences.',
      },
    },
  },
  browser: {
    extensions: 'Extensions',
    fullAccess: 'Accès complet',
    fullAccessNote:
      'Ces extensions peuvent voir et modifier les informations sur ce site.',
    otherExtensions: {
      adBlocker: 'Bloqueur de pubs',
      passwordManager: 'Gestionnaire de mots de passe',
      translate: 'Traduction',
      webArchive: 'Archive web',
    },
  },
  popup: {
    readability: 'Lisibilité',
    styleThisPage: 'Styliser cette page',
  },
  editor: {
    defaultProfile: 'Par défaut',
    newProfile: 'Journal',
    newProfileDark: 'Oiseau de nuit',
    createProfile: 'Créer un profil',
    pickAnElement: 'Choisir un élément',
    tabs: {
      basic: 'De base',
      code: 'Code',
      presets: 'Préréglages',
      chat: 'Chat',
    },
    basic: {
      hide: 'Masquer',
      reset: 'Réinitialiser',
      text: 'Texte',
      font: 'Police',
      defaultFont: 'Par défaut',
      size: 'Taille',
      lineHeight: 'Hauteur de ligne',
      color: 'Couleur',
      decoration: 'Décoration',
      none: 'Aucun',
      alignment: 'Alignement',
      background: 'Arrière-plan',
      box: 'Boîte',
      effects: 'Effets',
      moreProperties: 'Plus de propriétés',
    },
    code: {
      noStyles: 'Aucun style pour le moment',
    },
    presets: {
      readability: 'Lisibilité',
      articlesOnly: 'Articles uniquement',
      readabilityDescription:
        'Transforme les articles de ce site en une vue de lecture épurée, sans distractions, avec le thème, la police et la taille de votre choix.',
      grayscale: 'Niveaux de gris',
      grayscaleDescription: 'Applique les niveaux de gris à la page.',
    },
  },
  article: {
    nav: {
      news: 'Actualités',
      travel: 'Voyage',
      signIn: 'Se connecter',
    },
    kicker: 'Voyage · Grand format',
    headline: 'Le retour discret du ferry de nuit',
    dek: 'Trois compagnies parient que les voyageurs troqueront la vitesse contre une cabine, une vue sur la mer et pas d’aéroport.',
    byline: 'Marta Linde · 24 sept. · 6 min de lecture',
    paragraphs: [
      'Vingt ans après la suppression de la dernière traversée de nuit, trois compagnies remettent des cabines à flot. L’argument est simple : embarquer après le dîner, dormir pendant la traversée et se réveiller dans un autre pays.',
      'La première ligne relancée a affiché complet pour tout l’été en une semaine. La plupart des passagers ont moins de quarante ans, et beaucoup n’ont jamais voyagé de nuit, ni en train ni en bateau. Selon les compagnies, les cabines partent d’abord, puis les sièges inclinables, puis le pont.',
    ],
    quote:
      '« Personne ne réserve pour gagner du temps. On réserve pour en perdre un peu. »',
    quoteBy: '— Ines Varga, planificatrice d’itinéraires',
  },
  steps: {
    heading: 'Comment ça marche',
    counter: '{current} / {total}',
    jump: 'Aller à ce moment',
  },
};

export default demo;
