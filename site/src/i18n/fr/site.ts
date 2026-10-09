import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - Changez l’apparence de n’importe quel site',
    titleSuffix: '{title} - Stylebot',
    description:
      'Désignez un élément de la page et modifiez-le, ou décrivez ce que vous voulez. Stylebot écrit le CSS. Gratuit et open source pour Chrome, Firefox et Edge.',
  },
  header: {
    home: 'Accueil Stylebot',
    manual: 'Manuel',
    install: 'Installer',
    language: 'Langue',
    suggest: 'Voir cette page en français',
    dismiss: 'Ignorer',
    theme: 'Thème : {theme}',
  },
  themes: {
    light: 'Clair',
    dark: 'Sombre',
    stylebot: 'Stylebot',
    newsprint: 'Papier journal',
  },
  footer: {
    changelog: 'Notes de version',
    donate: 'Offrez-moi un café',
  },
  store: {
    add: 'Ajouter à {store}',
    addFree: 'Ajouter à {store} — c’est gratuit',
    reinstall: 'Réinstaller pour {store}',
  },
  zoom: {
    label: 'Capture d’écran agrandie',
    close: 'Fermer',
  },
  home: {
    title: '{word} n’importe quel site.',
    titleWord: 'Relookez',
    titleWordHint: 'Cliquez pour relooker',
    lede: 'Désignez un élément de la page et modifiez-le, ou décrivez simplement ce que vous voulez. Stylebot écrit le CSS et applique votre style à chaque visite.',
    also: 'Aussi sur {first} et {second}',
    installTitle: 'Installer Stylebot',
    installBody:
      'Gratuit et open source depuis 2011. Sans compte et sans pistage. Vos styles restent dans votre navigateur, et le code est sur GitHub.',
    cli: 'Vous utilisez un agent de code ? Ajoutez la <a href="#cli">CLI</a> :',
  },
  cli: {
    copy: 'Copier',
    copied: 'Copié',
    copyCommand: 'Copier {command}',
    title: 'Fonctionne avec votre agent de code',
    body: 'Claude Code, Codex, Cursor ou tout agent capable d’exécuter des commandes peut utiliser Stylebot depuis le terminal.',
    guide: 'Configurer la CLI →',
    demo: {
      terminal: 'Terminal · agent de code',
      prompt: 'rends {site} plus lisible la nuit',
      done: 'Fond sombre, texte plus chaud, corps en serif plus grand. Pub supprimée.',
      before: 'Avant',
      after: 'Après',
      kicker: 'Voyage',
      headline: 'Le retour discret du ferry de nuit',
      dek: 'Trois compagnies parient que les voyageurs troqueront la vitesse contre une cabine, une vue sur la mer et pas d’aéroport.',
      text: 'Le 22 h 40 au départ de Rostock s’en va sans tambour ni trompette. Quand les lumières du port s’effacent, la plupart des passagers ont trouvé leur cabine et le bar n’est plus qu’un murmure.',
      ad: 'Pub',
    },
    page: {
      title: 'Ligne de commande',
      description:
        'Contrôlez Stylebot depuis votre terminal, ou laissez un agent de code comme Claude Code, Codex ou Cursor modifier le style des sites dans votre navigateur, avec votre propre abonnement.',
      heading: 'Stylebot dans votre terminal',
      lede: 'Contrôlez Stylebot en ligne de commande, ou confiez-le à un agent de code comme Claude Code, Codex ou Cursor. L’agent modifie le style des sites directement dans votre navigateur, avec votre propre abonnement plutôt qu’une clé d’API.',
      setup: 'Mise en place',
      install: 'Installez Stylebot',
      installBody:
        'Pour Chrome ou Edge. La ligne de commande ne fonctionne pas encore sur Firefox.',
      cli: 'Installez la CLI',
      cliBody: 'Elle nécessite Node 20 ou une version ultérieure.',
      connect: 'Connectez-la à vos navigateurs',
      connectBody:
        'Cette commande enregistre la CLI auprès de Chrome et d’Edge, pour que Stylebot puisse la joindre.',
      access: 'Activez l’accès en ligne de commande',
      accessBody:
        'Dans les options de Stylebot, sous Général, activez <strong>Autoriser les applications de cet ordinateur à contrôler Stylebot</strong> et accordez ce que le navigateur demande.',
      plugin: 'Ajoutez le plugin Claude Code',
      optional: 'Facultatif',
      pluginBody: 'Dans Claude Code, exécutez :',
      tryIt: 'Puis essayez :',
      commands: 'Commandes',
      commandsBody:
        'Un agent les exécute pour vous, mais vous pouvez aussi les lancer vous-même. <code>stylebot --help</code> les liste toutes.',
      examples: {
        open: 'Ouvre la page dans une fenêtre derrière la vôtre et affiche l’identifiant de son onglet.',
        outline: 'Affiche les éléments visibles de la page sous forme de plan.',
        css: 'Enregistre le CSS comme style du site, l’applique et vérifie la page.',
        screenshot: 'Enregistre une image de l’onglet.',
      },
      privacy: 'Confidentialité',
      privacyBody: [
        'L’accès en ligne de commande reste désactivé tant que vous ne l’activez pas. Une fois activé, les applications de cet ordinateur peuvent lire vos pages ouvertes, prendre des captures d’écran et modifier vos styles. Désactivez-le à tout moment dans les options de Stylebot.',
        'Stylebot et la CLI ne communiquent qu’entre eux, sur cet ordinateur, et n’envoient rien nulle part. Un agent envoie ce qu’il lit à son propre fournisseur, comme Claude Code à Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Des styles pour commencer',
    lede: 'Copiez-en un et adaptez-le, ou partez de zéro.',
    hint: 'Collez-le dans l’onglet Code sur {site}.',
    enlarge: 'Agrandir {site} : {name}',
    alt: '{site} relooké avec Stylebot : {name}',
    install: 'Installer',
    installTitle: 'Installer dans Stylebot',
    installed: 'Installé',
    installedAs: 'Installé : {name}',
    installFailed: 'Échec de l’installation',
    copy: 'Copier le CSS',
    copied: 'Copié',
    source: 'Voir sur GitHub',
    lightbox: 'Site relooké',
    close: 'Fermer',
  },
  quotes: {
    title: 'Ils adorent Stylebot',
  },
  features: {
    title: 'Et ce n’est pas tout.',
    previous: 'Fonction précédente',
    next: 'Fonction suivante',
    sync: {
      title: 'Synchronisation',
      body: 'Connectez Google Drive et vos styles vous suivent sur chaque ordinateur où vous vous connectez. Stylebot synchronise toutes les 30 minutes, et juste après chaque modification.',
      connected: 'Connecté à Google Drive',
      synced: 'Synchronisé il y a 2 minutes',
      syncNow: 'Synchroniser maintenant',
      savedTo: 'Enregistré dans',
      disconnect: 'Déconnecter',
      schedule: 'Fréquence',
      scheduleValue: 'Toutes les 30 minutes, et dès que vous modifiez un style',
    },
    history: {
      title: 'Historique des versions',
      body: 'Chaque modification de vos styles est conservée, de la plus récente à la plus ancienne. Ouvrez une entrée pour voir ce qui a changé et la restaurer en un clic.',
      today: 'Aujourd’hui, 25 sept.',
      yesterday: 'Hier, 24 sept.',
      noChanges: 'Aucune modification',
      edited: 'Modifié',
      sites: '10 sites',
      current: 'Actuelle',
      times: ['01:04', '00:41', '23:41'],
    },
    presets: {
      title: 'Préréglages',
      body: 'La lisibilité et les niveaux de gris fonctionnent sur tous les sites, et se combinent avec vos propres modifications.',
      readability: 'Lisibilité',
      articlesOnly: 'Articles uniquement',
      readabilityBody:
        'Une vue de lecture épurée, avec le thème, la police et la taille de votre choix.',
      grayscale: 'Niveaux de gris',
      grayscaleBody: 'Applique les niveaux de gris à la page.',
    },
    chat: {
      title: 'Chat',
      body: 'Pas d’agent de code ? Décrivez une modification dans l’onglet Chat et Stylebot écrit le CSS. Utilisez votre propre clé Claude, OpenAI ou Gemini. Elle reste dans votre navigateur.',
      prompt: 'Rends l’article plus lisible la nuit',
      reply:
        'J’ai mis un fond sombre et un texte plus chaud, et passé le corps du texte dans une serif plus grande, avec plus d’interligne.',
      updated: 'Styles mis à jour',
      undo: 'Annuler',
      placeholder: 'Décrivez un changement',
    },
  },
  welcome: {
    title: 'Bienvenue',
    description:
      'Le fonctionnement de Stylebot, du début à la fin, en une minute environ.',
    heading: 'Stylebot est installé.',
    yourTurn: 'À vous de jouer.',
    yourTurnBody:
      'Ouvrez n’importe quel site et appuyez sur le raccourci. Rien ne change tant que vous ne l’avez pas fait.',
    manual: 'Manuel',
    agentTitle: 'Connectez votre agent de code',
    agentBody:
      'Claude Code, Codex, Cursor ou tout agent capable d’exécuter des commandes peut utiliser Stylebot depuis le terminal.',
    agentPrompt:
      'donne à ce site un thème Everforest avec de plus jolies polices',
    agentReply: 'C’est fait : couleurs Everforest, avec Lora et Newsreader.',
  },
  goodbye: {
    title: 'Au revoir',
    description: 'Merci d’avoir utilisé Stylebot.',
    panda: 'Un panda en pixels qui fait au revoir',
    heading: 'Merci d’avoir utilisé Stylebot.',
    lede: 'Vos styles ont été supprimés de ce navigateur. Si vous aviez activé la synchronisation, une sauvegarde se trouve toujours dans votre Google Drive.',
    changedMind: 'Vous avez changé d’avis ?',
    note: 'Je travaille sur Stylebot depuis 2011. Merci de l’avoir essayé, et merci pour vos retours.',
    signature: '— Ankit',
    feedback: {
      question: 'Pourquoi l’avez-vous désinstallé ?',
      optional: 'Facultatif, ça ne prend qu’une seconde.',
      reasons: [
        'Je n’en avais plus besoin',
        'Difficile à utiliser',
        'Il a cassé un site',
        'Il manque une fonction',
        'Trop lent',
        'Autre chose',
      ],
      placeholder: 'Autre chose à ajouter ? (facultatif)',
      send: 'Envoyer mon avis',
      sendNote: 'Directement au mainteneur.',
      thanks: 'Merci. Chaque message est lu.',
    },
  },
  manual: {
    title: 'Manuel',
    description:
      'Comment utiliser Stylebot : styliser un site, les profils, la ligne de commande, le Chat, la synchronisation, les règles d’URL et les raccourcis.',
    lede: 'Le fonctionnement de Stylebot, de votre premier style aux profils, au Chat et à la synchronisation.',
    sections: 'Sections du manuel',
    toc: {
      start: 'Premiers pas',
      profiles: 'Profils',
      cli: 'Ligne de commande',
      chat: 'Chat',
      presets: 'Lisibilité et niveaux de gris',
      sync: 'Synchronisation, sauvegarde et historique',
      urls: 'Règles d’URL',
      shortcuts: 'Raccourcis clavier',
      help: 'Aide et assistance',
    },
    start: {
      open: 'Cliquez sur l’icône Stylebot dans la barre d’outils, puis sur <strong>Styliser cette page</strong>. Vous pouvez aussi appuyer sur [[alt+shift+M]] dans n’importe quel onglet, ou faire un clic droit sur un élément et choisir <strong>Stylebot → Styliser l’élément</strong>.',
      shot: 'L’onglet De base, pendant la sélection d’un lien dans un article de Wikipédia',
      pick: 'Cliquez sur le sélecteur d’élément, survolez la page et cliquez sur un élément. Appuyez sur [[↑]] avant de cliquer pour sélectionner plutôt son parent. Modifiez-le ensuite dans <strong>De base</strong>, ou écrivez du CSS dans <strong>Code</strong>. Les modifications sont enregistrées au fur et à mesure et s’appliquent à chaque visite du site.',
      fonts: 'Polices',
      fontsBody:
        'Cherchez parmi 400 <a href="https://fonts.google.com/">Google Fonts</a> et Stylebot charge celle que vous choisissez, ou saisissez le nom de n’importe quelle police installée sur votre ordinateur.',
      position: 'Position de l’éditeur',
      positionBody:
        'Dans Chrome et Edge, l’éditeur s’ouvre dans le panneau latéral. Utilisez <strong>Position</strong> dans son menu <strong>⋯</strong> pour l’ouvrir dans une fenêtre séparée ou l’ancrer dans la page. Firefox n’a pas de panneau latéral.',
      off: 'Désactiver un style',
      offBody:
        'Utilisez l’interrupteur de la fenêtre pop-up, ou [[alt+shift+S]]. Le style est conservé, mais n’est plus appliqué.',
      callout:
        'Certains sites utilisent des noms de classe générés automatiquement, qui changent quand le site est mis à jour. Si un style cesse de fonctionner, choisissez de nouveau l’élément pour obtenir un nouveau sélecteur.',
    },
    profiles: {
      intro:
        'Un profil est une feuille de style distincte pour un même site : vous pouvez ainsi garder plusieurs apparences et passer de l’une à l’autre. Un seul profil s’applique à la fois, et chaque site commence avec le profil Par défaut.',
      shot: 'La fenêtre pop-up sur Hacker News avec quatre profils : Violet Hour, Everforest, Hearth et Newspaper',
      manage:
        'Cliquez sur le nom du profil à côté du site, dans l’en-tête de l’éditeur, pour créer, renommer, dupliquer ou supprimer des profils. Passez de l’un à l’autre à cet endroit ou dans la fenêtre pop-up, où <strong>Aucun style</strong> désactive le style pour ce site. Les nouveaux profils sont vides au départ.',
    },
    cli: {
      intro:
        'La commande <code>stylebot</code> permet à un agent de code comme Claude Code, Codex ou Cursor de modifier le style des sites directement dans votre navigateur, avec votre propre abonnement plutôt qu’une clé d’API. C’est la meilleure façon de faire styliser un site par un agent, et vous pouvez aussi lancer les commandes vous-même.',
      setup: 'Configuration',
      setupBody:
        'Installez la CLI, connectez-la à vos navigateurs, puis activez <strong>Autoriser les applications de cet ordinateur à contrôler Stylebot</strong> dans les options. La <a href="{cli}">page Ligne de commande</a> détaille chaque étape. Chrome et Edge uniquement pour l’instant.',
      claudeCodeBody:
        'Ajoutez le plugin Stylebot et demandez une modification avec <code>/stylebot</code>, par exemple un thème sombre pour un site.',
      privacy: 'Confidentialité',
      privacyBody:
        'L’accès en ligne de commande reste désactivé tant que vous ne l’activez pas. Stylebot et la CLI ne communiquent qu’entre eux, sur cet ordinateur ; un agent envoie ce qu’il lit à son propre fournisseur.',
    },
    chat: {
      intro:
        'Le Chat est idéal pour les retouches rapides. Décrivez la modification souhaitée dans l’onglet Chat et Stylebot écrit le CSS. Vous pouvez choisir un élément pour cibler quelque chose de précis, ou joindre une capture d’écran pour montrer ce que vous voulez dire. Pour des changements plus importants, comme un thème entièrement nouveau, utilisez la <a href="#cli">ligne de commande</a>.',
      shot: 'L’onglet Chat après avoir demandé un thème forêt avec une police serif lisible sur Hacker News',
      key: 'Utilisez votre propre clé',
      keyBody:
        'Connectez une clé d’API Claude, OpenAI ou Gemini. Les clés sont enregistrées uniquement sur cet ordinateur, jamais synchronisées. Les messages vont directement de votre navigateur au fournisseur.',
      changes: 'Où vont les modifications',
      changesBody:
        'Chaque modification est appliquée immédiatement et ajoutée à la feuille de style du profil actuel. Cliquez sur <strong>N lignes ajoutées</strong> pour la voir dans Code, ou annulez-la depuis le chat.',
      cost: 'Coût',
      costBody:
        'Le nombre de jetons sous la zone de message indique ce que la conversation a consommé, avec un coût estimé.',
    },
    presets: {
      intro:
        'Les deux se trouvent dans l’onglet Préréglages et se combinent avec vos propres modifications. <strong>Lisibilité</strong> transforme les articles d’un site en une vue de lecture épurée, avec le choix du thème, de la police, de la taille et de la largeur ; les pages qui ne sont pas des articles restent intactes. <strong>Niveaux de gris</strong> retire la couleur du site, à l’intensité de votre choix.',
      shot: 'L’article de Wikipédia sur les mathématiques dans la vue Lisibilité, avec les paramètres de lecture ouverts',
    },
    sync: {
      shot: 'Les options, connectées à Google Drive et synchronisées',
      drive: 'Synchronisation Google Drive',
      driveBody:
        'Connectez Google Drive dans les options. Vos styles, profils compris, se synchronisent toutes les 30 minutes et juste après chaque modification. Stylebot ne voit que les fichiers qu’il crée dans votre Drive, et il n’y a pas de serveur Stylebot.',
      conflicts: 'Conflits',
      conflictsBody:
        'Si un style a été modifié sur deux ordinateurs, votre modification la plus récente est conservée et l’autre version est gardée dans un commentaire : rien n’est perdu.',
      backup: 'Sauvegarde',
      backupBody:
        'Exportez et importez tous vos styles au format JSON depuis les options.',
      history: 'Historique des versions',
      historyBody:
        'Chaque modification faite sur cet ordinateur est conservée dans les options, y compris celles qui arrivent par la synchronisation. Restaurez n’importe quelle version antérieure, pour certains sites ou pour tous.',
      historyShot:
        'L’historique des versions dans les options, modification la plus récente en premier',
    },
    urls: {
      intro:
        'Par défaut, Stylebot associe les styles aux sites par nom de domaine. Modifiez l’URL d’un style dans les options et utilisez ces motifs pour cibler plus précisément.',
      wildcards: {
        anything: 'Correspond à n’importe quelle suite de caractères.',
        segment:
          'Correspond à n’importe quelle suite de caractères jusqu’au prochain /.',
        list: 'Sépare une liste de motifs. Une URL correspond si l’un des motifs correspond.',
        regex: 'Au début d’une URL, la transforme en expression régulière.',
      },
      examplesTitle: 'Exemples',
      examples: {
        domain: 'Le domaine docs.google.com ou l’un de ses sous-domaines.',
        prefix: 'Toute URL commençant par docs.',
        numbered: 'docs.google.com, docs1.google.com, docs2.google.com, etc.',
        subdomains: 'news.ycombinator.com et apps.ycombinator.com.',
        either: 'L’un ou l’autre domaine, ou l’un de leurs sous-domaines.',
        regex: 'Uniquement la page d’accueil de Reddit.',
        everywhere:
          'Tous les sites. Pratique pour les styles à appliquer partout.',
      },
    },
    shortcuts: {
      intro:
        'Les raccourcis globaux fonctionnent sur toutes les pages que Stylebot peut styliser ; modifiez-les dans les paramètres de raccourcis de votre navigateur, accessibles depuis les options. Pour les raccourcis propres à l’éditeur, appuyez sur [[?]] dans l’éditeur.',
      or: 'ou',
      unset: 'Non défini, à attribuer dans le navigateur',
      global: 'Globaux',
      picker: 'Pendant la sélection d’un élément',
      actions: {
        toggleEditor: "Afficher/masquer l'éditeur",
        toggleStyling: 'Activer/désactiver le style',
        toggleReadability: 'Activer/désactiver la lisibilité',
        toggleGrayscale: 'Activer/désactiver les niveaux de gris',
        parent: "Sélectionner l'élément parent",
        child: "Revenir à l'élément enfant",
        select: "Sélectionner l'élément en surbrillance",
      },
    },
    help: {
      body: 'Vous avez trouvé un bug ou vous avez une idée ? Ouvrez un ticket sur <a href="{issues}">GitHub</a>. Stylebot est gratuit et open source, maintenu depuis 2011. S’il vous est utile, vous pouvez le soutenir en <a href="{donate}">m’offrant un café</a>.',
    },
  },
  privacy: {
    title: 'Confidentialité',
    description:
      'Ce que Stylebot fait de vos données : pas de serveur, pas de compte, pas de statistiques.',
    lede: 'Stylebot n’a ni serveur, ni compte, ni statistiques. Vos styles restent dans votre navigateur, sauf si vous activez la synchronisation, le chat ou la ligne de commande : ils vont alors directement à un service que vous avez choisi ou à une application que vous avez autorisée.',
    updated: 'Dernière mise à jour : {date}',
    browser: {
      title: 'Ce qui reste dans votre navigateur',
      body: [
        'Vos styles, profils, paramètres, historique, conversations de chat et clés d’API sont enregistrés dans le stockage des extensions de votre navigateur, et la désinstallation de Stylebot les supprime. Stylebot lit les pages que vous visitez pour les styliser, et n’en envoie rien, sauf si vous utilisez le chat ou la ligne de commande.',
      ],
    },
    sync: {
      title: 'Synchronisation Google Drive',
      body: [
        'Quand vous connectez Google Drive dans les options, vos styles sont enregistrés dans un fichier de votre propre Drive. Stylebot ne voit que les fichiers qu’il crée. Son jeton d’accès reste dans votre navigateur et expire au bout d’une heure. Déconnectez-vous dans les options ou dans votre <a href="https://myaccount.google.com/connections">compte Google</a>.',
        'L’utilisation par Stylebot des informations reçues des API Google respecte le <a href="https://developers.google.com/terms/api-services-user-data-policy">Règlement sur les données utilisateur des services d’API Google</a>, y compris les exigences relatives à l’utilisation limitée.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'Quand vous ajoutez une clé d’API et envoyez un message, votre navigateur l’envoie directement à ce fournisseur, avec les captures d’écran que vous joignez, l’adresse et le titre de la page, un plan de ce qui y est visible, ainsi que son CSS et vos styles. Cela peut inclure des informations personnelles affichées sur la page. N’utilisez donc pas le chat sur des pages que vous ne partageriez pas avec le fournisseur. Sa politique de confidentialité s’applique : <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Ligne de commande',
      body: [
        'Quand vous activez <q>Autoriser les applications de cet ordinateur à contrôler Stylebot</q> dans les options, les applications exécutées sous votre compte peuvent lister vos onglets, lire des pages, prendre des captures d’écran, et lire et modifier vos styles, via une connexion locale que vous seul pouvez utiliser. Ce qu’elles lisent peut parvenir aux services qu’elles utilisent, comme le modèle derrière un agent de code. Désactivez ce réglage pour vous déconnecter.',
      ],
    },
    fonts: {
      title: 'Polices et CSS importé',
      body: [
        'Les polices Google Fonts de vos styles sont téléchargées depuis Google, qui voit votre adresse IP. Les feuilles de style que vous importez avec <code>@import</code> sont récupérées à leur adresse.',
      ],
    },
    site: {
      title: 'Ce site',
      body: [
        'stylebot.dev n’utilise ni publicités, ni cookies, et est hébergé sur GitHub Pages, qui conserve des journaux serveur standard. Plausible compte les visites par page, site référent, pays et type d’appareil, sans cookies ni rien qui vous identifie.',
      ],
    },
    sharing: {
      title: 'Partage',
      body: [
        'Stylebot ne collecte, ne vend ni ne partage vos données. Elles ne quittent votre navigateur que pour les services ci-dessus, quand vous les utilisez.',
      ],
    },
    contact: {
      title: 'Modifications et contact',
      body: [
        'Les modifications de cette politique sont listées dans l’<a href="{history}">historique du site sur GitHub</a>. Pour toute question, écrivez à <a href="mailto:{email}">{email}</a> ou ouvrez un <a href="{issues}">ticket GitHub</a>.',
      ],
    },
    translation:
      'Ceci est une traduction. En cas de divergence avec la <a href="{original}">version anglaise</a>, la version anglaise prévaut.',
  },
  releases: {
    title: 'Nouveautés de la version {version}',
    bugFixes: 'Et de nombreuses <a href="{changelog}">corrections de bugs</a>',
    sections: 'Sections',
    r31: {
      description:
        'Stylebot 3.1 ajoute la synchronisation et la sauvegarde avec Google Drive, un éditeur redimensionnable et des palettes de couleurs.',
      syncTitle: 'Synchronisation et sauvegarde avec Google Drive',
      syncAlt: 'Synchronisation des styles avec Google Drive',
      syncBody: [
        'Activez et autorisez la synchronisation avec Google Drive depuis la <strong>page Options</strong> de Stylebot.',
        'Une fois activée, cliquez sur <strong>Synchroniser maintenant</strong> dans la fenêtre pop-up ou la page Options pour synchroniser les styles de votre navigateur avec ceux sauvegardés sur Google Drive.',
      ],
      resizeTitle: 'Redimensionnez l’éditeur Stylebot',
      resizeAlt: 'Redimensionnement de l’éditeur Stylebot',
      resizeBody:
        'Vous pouvez désormais redimensionner l’éditeur Stylebot et, si vous le souhaitez, réduire la page pour que son contenu ne passe pas sous l’éditeur.',
      colorsTitle: 'Palettes de couleurs',
      colorsAlt: 'Choix d’une couleur dans une palette',
      colorsBody:
        'Un sélecteur de couleur amélioré, avec des palettes, pour choisir plus facilement de belles couleurs.',
    },
    r32: {
      description:
        'Stylebot 3.2 apporte un style plus rapide et sans scintillement, un mode Lisibilité repensé et une fenêtre pop-up plus claire.',
      lede: 'Stylebot est de nouveau en développement actif, et d’autres mises à jour sont prévues.',
      fasterTitle: 'Un style plus rapide, sans scintillement',
      fasterBody:
        'Le CSS est désormais mis en cache et appliqué instantanément : les pages ne s’affichent plus un instant sans style le temps que vos styles arrivent, et tout paraît plus réactif.',
      readabilityTitle: 'Un mode Lisibilité repensé',
      readabilityAlt:
        'Les nouvelles commandes de thème et de typographie intégrées du mode Lisibilité',
      readabilityItems: [
        'Nouvel algorithme d’extraction d’articles, qui nettoie mieux les pages',
        'Activation plus rapide, avant le chargement du reste de la page',
        'Personnalisation du thème et de la typographie directement dans la page',
        'Animation de chargement plus fluide',
        'Raccourci clavier pour l’activer ou le désactiver',
      ],
      popupTitle: 'Une fenêtre pop-up plus claire',
      popupAlt: 'La fenêtre pop-up repensée de Stylebot',
      popupItems: [
        'Lignes d’activation entièrement cliquables',
        'Bouton d’accès direct aux paramètres',
        'Prise en charge du mode sombre',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 apporte un éditeur repensé, une ligne de commande pour les agents de code, des profils, un panneau latéral, le Chat, l’historique des versions et la synchronisation.',
      lede: 'Un éditeur repensé, une ligne de commande pour les agents de code, des profils et un panneau latéral.',
      toc: {
        editor: 'Éditeur repensé',
        cli: 'Ligne de commande',
        profiles: 'Profils',
        panel: 'Panneau latéral',
        history: 'Historique des versions',
        sync: 'Synchronisation',
        chat: 'Chat',
        more: 'Et plus encore',
      },
      editorTitle: 'Un éditeur repensé',
      editorAlt:
        'L’onglet De base repensé, qui stylise Hacker News avec un profil Newspaper',
      editorBody: 'Entièrement reconstruit, désormais avec un mode sombre.',
      editorItems: [
        'Des commandes regroupées qui affichent les valeurs de la page',
        'Une meilleure génération de sélecteurs, qui continuent de fonctionner quand un site est mis à jour, avec d’autres au choix',
        'Signale quand une autre règle remplace une valeur',
        'Des palettes de couleurs et une pipette',
        'Aperçu d’une couleur ou d’une police sur la page, au survol',
        'Modification sur place de toute autre propriété CSS, sous Plus de propriétés',
        'Annulation des modifications',
      ],
      profilesTitle: 'Profils',
      profilesAlt:
        'La fenêtre pop-up sur un site avec deux profils, Dracula et Gruvbox',
      profilesBody:
        'Gardez plusieurs apparences pour un site et passez de l’une à l’autre depuis l’éditeur ou la fenêtre pop-up.',
      panelTitle: 'Le panneau latéral, ou une fenêtre à part',
      panelAlt:
        'Le menu de l’éditeur, avec Position réglée sur le panneau latéral',
      panelBody:
        'Dans Chrome et Edge, l’éditeur s’ouvre dans le panneau latéral. Vous pouvez aussi l’ouvrir dans sa propre fenêtre, via <strong>Position</strong> dans le menu <strong>⋯</strong> de l’éditeur.',
      historyTitle: 'Historique des versions',
      historyBody:
        'Chaque modification est conservée, et vous pouvez restaurer n’importe quelle version antérieure.',
      syncTitle: 'Synchronisation',
      syncBody:
        'La synchronisation Google Drive est plus fiable. Les modifications faites sur différents ordinateurs sont fusionnées, pour que rien ne se perde. Elle s’exécute d’elle-même toutes les 30 minutes et juste après chaque modification.',
      chatTitle: 'Chat',
      chatBody:
        'Pas d’agent de code ? Décrivez ce que vous voulez, ou choisissez une apparence suggérée, et Stylebot écrit le CSS. Utilisez votre propre clé Claude, OpenAI ou Gemini.',
      chatAlt:
        'L’onglet Chat, qui suggère des apparences pour la page : Douillet, Apaisant et Seuls les liens en couleur',
      moreTitle: 'Et plus encore',
      moreItems: [
        'Un nouveau stylebot.dev',
        'Une nouvelle icône Stylebot',
        'Les styles s’appliquent désormais dans le shadow DOM : ils fonctionnent sur les sites construits avec des web components',
        'Les raccourcis de Stylebot se trouvent désormais dans les paramètres de raccourcis de votre navigateur. Dans Chrome et Edge, ceux que vous aviez modifiés ont retrouvé leurs valeurs par défaut : redéfinissez-les à cet endroit.',
        'Stylebot est désormais disponible en vietnamien',
      ],
    },
  },
  notFound: {
    title: 'Page introuvable',
    description: 'Cette page n’existe pas.',
    heading: 'Cette page n’existe pas, et elle est affreuse.',
    done: 'Bien mieux. La page n’existe toujours pas, mais au moins elle est jolie maintenant.',
    pageTitle: '404 Introuvable',
    pageBody: 'L’URL demandée est introuvable sur ce serveur.',
    pageLink: 'Aller à la page d’accueil',
    nice: '✨ Rendez-la jolie',
  },
};

export default site;
