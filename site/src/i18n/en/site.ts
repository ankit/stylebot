/*
 * Strings may carry inline HTML (<strong>, <a>, <code>, <q>), `{name}`
 * placeholders, and key combinations as [[alt+shift+M]]; keep all three intact.
 */
export default {
  meta: {
    title: 'Stylebot - Restyle any website',
    titleSuffix: '{title} - Stylebot',
    description:
      'Point at something on a page and change it, or describe what you want. Stylebot writes the CSS. Free and open source for Chrome, Firefox and Edge.',
  },
  header: {
    home: 'Stylebot home',
    manual: 'Manual',
    install: 'Install',
    language: 'Language',
    // Offered to visitors whose browser prefers this language, on a page in another one.
    suggest: 'View this page in English',
    dismiss: 'Dismiss',
    theme: 'Theme: {theme}',
  },
  themes: {
    light: 'Light',
    dark: 'Dark',
    stylebot: 'Stylebot',
    newsprint: 'Newsprint',
  },
  footer: {
    changelog: 'Changelog',
    donate: 'Buy me a coffee',
  },
  store: {
    add: 'Add to {store}',
    addFree: 'Add to {store} — it’s free',
    reinstall: 'Reinstall for {store}',
  },
  zoom: {
    label: 'Enlarged screenshot',
    close: 'Close',
  },
  home: {
    // {word} is titleWord, a button that switches its own font each time it's clicked.
    // Keep {word} at the start where the language allows: wider fonts grow it to the left.
    title: '{word} any website.',
    // A single word, ideally short: the page cycles it through decorative fonts.
    titleWord: 'Restyle',
    // Tooltip on titleWord.
    titleWordHint: 'Click to restyle',
    lede: 'Point at something on the page and change it, or just describe what you want. Stylebot writes the CSS and loads your style every time you come back.',
    also: 'Also on {first} and {second}',
    installTitle: 'Install Stylebot',
    installBody:
      'Free and open source since 2011. No account and no tracking. Your styles live in your browser, and the code is on GitHub.',
    cli: 'Using a coding agent? Add the <a href="#cli">CLI</a>:',
  },
  cli: {
    copy: 'Copy',
    copied: 'Copied',
    // {command} is a terminal command, such as npm install -g @stylebot/cli.
    copyCommand: 'Copy {command}',
    title: 'Works with your coding agent',
    body: 'Claude Code, Codex, Cursor or any agent that runs commands can use Stylebot from the terminal.',
    guide: 'Set up the CLI →',
    // An animation of a coding agent restyling a made-up news site's article.
    demo: {
      terminal: 'Terminal · coding agent',
      // What the person asks the agent; {site} is the site's address.
      prompt: 'make {site} easier to read at night',
      done: 'Dark background, warmer text, larger serif body. Ad removed.',
      before: 'Before',
      after: 'After',
      kicker: 'Travel',
      headline: 'The quiet return of the night ferry',
      dek: 'Three operators are betting that travelers will trade speed for a cabin, a sea view and no airport.',
      text: 'The 22:40 from Rostock leaves without fanfare. By the time the port lights fall behind, most passengers have found their cabins and the bar has settled into a low murmur.',
      ad: 'Ad',
    },
    page: {
      title: 'Command line',
      description:
        'Control Stylebot from your terminal, or let a coding agent like Claude Code, Codex or Cursor restyle sites in your browser on your own subscription.',
      heading: 'Stylebot from your terminal',
      lede: 'Control Stylebot from the command line, or let a coding agent like Claude Code, Codex or Cursor do it. The agent restyles sites right in your browser, using your own subscription instead of an API key.',
      setup: 'Set it up',
      install: 'Install Stylebot',
      installBody:
        "For Chrome or Edge. The command line doesn't work on Firefox yet.",
      cli: 'Install the CLI',
      cliBody: 'It needs Node 20 or later.',
      connect: 'Connect it to your browsers',
      connectBody:
        'This registers the CLI with Chrome and Edge, so Stylebot can reach it.',
      access: 'Turn on command line access',
      // "Basics" and the bolded setting are labels in Stylebot's Options page; use the extension's own translation.
      accessBody:
        "In Stylebot's options, under Basics, turn on <strong>Let apps on this computer control Stylebot</strong> and allow what the browser asks for.",
      plugin: 'Add the Claude Code plugin',
      optional: 'Optional',
      pluginBody: 'In Claude Code, run:',
      tryIt: 'Then try it:',
      commands: 'Commands',
      commandsBody:
        'An agent runs these for you, but you can run them yourself too. <code>stylebot --help</code> lists them all.',
      examples: {
        open: 'Opens the page in a window behind yours and prints its tab id.',
        outline: 'Prints the page’s visible elements as an outline.',
        css: 'Saves the CSS as the site’s style, applies it, and checks the page.',
        screenshot: 'Saves a picture of the tab.',
      },
      privacy: 'Privacy',
      privacyBody: [
        "Command line access is off until you turn it on. While it's on, apps on this computer can read your open pages, take screenshots and change your styles. Turn it off in Stylebot's options at any time.",
        'Stylebot and the CLI talk only to each other, on this computer, and send nothing anywhere. An agent sends what it reads to its own provider, as Claude Code does to Anthropic.',
      ],
    },
  },
  gallery: {
    title: 'Styles to start from',
    lede: 'Copy one and tweak it, or start from scratch.',
    // Shown after copying a style's CSS; {site} is a website, such as github.com. "Code" is the editor tab's name in Stylebot; use the extension's own translation.
    hint: 'Paste it into the Code tab on {site}.',
    // {site} is a website, {name} the name of one of its styles, such as Dracula.
    enlarge: 'Enlarge {site}: {name}',
    alt: '{site} restyled with Stylebot: {name}',
    install: 'Install',
    installTitle: 'Install in Stylebot',
    installed: 'Installed',
    // {name} is the name of the profile Stylebot added the style as.
    installedAs: 'Installed as {name}',
    installFailed: 'Couldn’t install',
    copy: 'Copy CSS',
    copied: 'Copied',
    source: 'View on GitHub',
    lightbox: 'Restyled site',
    close: 'Close',
  },
  quotes: {
    title: 'People love Stylebot',
  },
  features: {
    title: 'Everything else you get.',
    previous: 'Previous feature',
    next: 'Next feature',
    sync: {
      title: 'Sync',
      body: 'Connect Google Drive and your styles follow you to every computer you sign in to. Stylebot syncs every 30 minutes and right after you edit.',
      connected: 'Connected to Google Drive',
      synced: 'Synced 2 minutes ago',
      syncNow: 'Sync now',
      savedTo: 'Saved to',
      disconnect: 'Disconnect',
      schedule: 'Schedule',
      scheduleValue: 'Every 30 minutes, and right after you edit a style',
    },
    history: {
      title: 'Version history',
      body: 'Every change to your styles is kept, newest first. Open an entry to see what changed and restore it in one click.',
      today: 'Today, Sep 25',
      yesterday: 'Yesterday, Sep 24',
      noChanges: 'No changes',
      edited: 'Edited',
      sites: '10 sites',
      current: 'Current',
      times: ['1:04 AM', '12:41 AM', '11:41 PM'],
    },
    presets: {
      title: 'Presets',
      body: 'Readability and grayscale work on any site, and they stack with your own changes.',
      readability: 'Readability',
      articlesOnly: 'Articles only',
      readabilityBody:
        'A clean reading view, with your choice of theme, font, and size.',
      grayscale: 'Grayscale',
      grayscaleBody: 'Apply grayscale to the page.',
    },
    // A picture of Stylebot's Chat tab; updated, undo and placeholder are labels from the extension, so use its own translations.
    chat: {
      title: 'Chat',
      body: 'No coding agent? Describe a change in the Chat tab and Stylebot writes the CSS. Bring your own Claude, OpenAI or Gemini key. It stays in your browser.',
      prompt: 'Make the article easier to read at night',
      reply:
        'Switched to a dark background with warmer text, and set the body in a larger serif with more line spacing.',
      updated: 'Updated styles',
      undo: 'Undo',
      placeholder: 'Describe a change',
    },
  },
  welcome: {
    title: 'Welcome',
    description: 'How Stylebot works, start to finish, in about a minute.',
    heading: 'Stylebot is installed.',
    yourTurn: 'Your turn.',
    yourTurnBody:
      'Open any site and press the shortcut. Nothing changes until you do.',
    manual: 'Manual',
    agentTitle: 'Connect your coding agent',
    agentBody:
      'Claude Code, Codex, Cursor or any agent that runs commands can use Stylebot from the terminal.',
    // What the person asks their coding agent; Everforest is a color theme's name
    agentPrompt: 'give this site an Everforest theme with nicer fonts',
    // The coding agent's reply; Lora and Newsreader are font names
    agentReply: 'Switched to Everforest colors with Lora and Newsreader.',
  },
  goodbye: {
    title: 'Goodbye',
    description: 'Thanks for using Stylebot.',
    panda: 'A pixel panda waving goodbye',
    heading: 'Thanks for using Stylebot.',
    lede: 'Your styles were removed from this browser. If you turned on sync, a backup is still in your Google Drive.',
    changedMind: 'Changed your mind?',
    note: 'I’ve been working on Stylebot since 2011. Thanks for giving it a try, and for any feedback you leave.',
    signature: '— Ankit',
    feedback: {
      question: 'Why did you uninstall?',
      optional: 'Optional, takes a second.',
      reasons: [
        'Didn’t need it anymore',
        'Hard to use',
        'It broke a site',
        'Missing a feature',
        'Too slow',
        'Something else',
      ],
      placeholder: 'Anything else? (optional)',
      send: 'Send feedback',
      sendNote: 'Goes straight to the maintainer.',
      thanks: 'Thank you. Every note gets read.',
    },
  },
  manual: {
    title: 'Manual',
    description:
      'How to use Stylebot: styling a site, profiles, the command line, Chat, sync, URL rules and shortcuts.',
    lede: 'How Stylebot works, from your first style to profiles, Chat and sync.',
    sections: 'Manual sections',
    toc: {
      start: 'Getting started',
      profiles: 'Profiles',
      cli: 'Command line',
      chat: 'Chat',
      presets: 'Readability and grayscale',
      sync: 'Sync, backup and history',
      urls: 'URL rules',
      shortcuts: 'Keyboard shortcuts',
      help: 'Help and support',
    },
    start: {
      open: 'Click the Stylebot icon in the toolbar, then <strong>Style this page</strong>. Or press [[alt+shift+M]] on any tab, or right-click an element and choose <strong>Stylebot → Style Element</strong>.',
      shot: 'The Basic tab, picking a link in a Wikipedia article',
      pick: 'Click the picker, hover the page and click an element. Press [[↑]] before clicking to select its parent instead. Then change it in <strong>Basic</strong>, or write CSS in <strong>Code</strong>. Changes save as you make them and load every time you visit the site.',
      fonts: 'Fonts',
      fontsBody:
        'Search 400 <a href="https://fonts.google.com/">Google Fonts</a> and Stylebot loads the one you pick, or type any font installed on your computer.',
      position: 'Editor position',
      positionBody:
        'In Chrome and Edge the editor opens in the side panel. Use <strong>Position</strong> in its <strong>⋯</strong> menu to open it in a separate window or dock it in the page. Firefox has no side panel.',
      off: 'Turning a style off',
      offBody:
        'Use the switch in the popup, or [[alt+shift+S]]. The style is kept, just not applied.',
      callout:
        'Some sites use auto-generated class names that change when the site updates. If a style stops working, pick the element again to get a fresh selector.',
    },
    profiles: {
      intro:
        'A profile is a separate stylesheet for the same site, so you can keep more than one look and switch between them. Only one is applied at a time, and every site starts with Default.',
      // Violet Hour, Everforest, Hearth and Newspaper are profile names shown in the screenshot.
      shot: 'The popup on Hacker News with four profiles: Violet Hour, Everforest, Hearth and Newspaper',
      manage:
        "Click the profile name next to the site in the editor's header to create, rename, duplicate or delete profiles. Switch between them there or in the popup, where <strong>No style</strong> turns styling off for the site. New profiles start empty.",
    },
    cli: {
      intro:
        "The <code>stylebot</code> command lets a coding agent like Claude Code, Codex or Cursor restyle sites right in your browser, using your own subscription instead of an API key. It's the best way to have an agent style a site, and you can run the commands yourself too.",
      setup: 'Setup',
      // The bolded setting is a label in Stylebot's Options page; use the extension's own translation.
      setupBody:
        'Install the CLI, connect it to your browsers, then turn on <strong>Let apps on this computer control Stylebot</strong> in Options. The <a href="{cli}">command line page</a> walks through each step. Chrome and Edge only for now.',
      claudeCodeBody:
        'Add the Stylebot plugin and ask for a change with <code>/stylebot</code>, such as a dark theme for a site.',
      privacy: 'Privacy',
      privacyBody:
        'Command line access is off until you turn it on. Stylebot and the CLI talk only to each other, on this computer; an agent sends what it reads to its own provider.',
    },
    chat: {
      intro:
        'Chat is ideal for quick fixes. Describe the change you want in the Chat tab and Stylebot writes the CSS. You can pick an element to point it at something, or attach a screenshot to show what you mean. For bigger changes, like a whole new theme, use the <a href="#cli">command line</a>.',
      shot: 'The Chat tab after asking for a forest theme with a readable serif font on Hacker News',
      key: 'Bring your own key',
      keyBody:
        'Connect a Claude, OpenAI or Gemini API key. Keys are saved on this computer only and never synced. Messages go straight from your browser to the provider.',
      changes: 'Where changes go',
      changesBody:
        "Each change is applied right away and added to the current profile's stylesheet. Click <strong>Added N lines</strong> to see it in Code, or undo it from the chat.",
      cost: 'Cost',
      costBody:
        'The token count under the message box shows what the conversation has used, with an estimated cost.',
    },
    presets: {
      intro:
        "Both are in the Presets tab and stack with your own changes. <strong>Readability</strong> turns a site's articles into a clean reading view, with a choice of theme, font, size and width; it leaves pages that aren't articles alone. <strong>Grayscale</strong> removes color from the site, at any strength.",
      shot: 'The Wikipedia article on Mathematics in the Readability view, with Reading settings open',
    },
    sync: {
      shot: 'Options, connected to Google Drive and synced',
      drive: 'Google Drive sync',
      driveBody:
        'Connect Google Drive in Options. Your styles, including profiles, sync every 30 minutes and right after you edit. Stylebot only sees the files it creates in your Drive, and there is no Stylebot server.',
      conflicts: 'Conflicts',
      conflictsBody:
        'If a style changed on two computers, your newer edit is kept and the other version is saved in a comment, so nothing is lost.',
      backup: 'Backup',
      backupBody: 'Export and import all your styles as JSON from Options.',
      history: 'Version history',
      historyBody:
        'Every change on this computer is kept in Options, including ones that arrive through sync. Restore any earlier version, for some sites or all of them.',
      historyShot: 'Version history in Options, newest change first',
    },
    urls: {
      intro:
        "By default, Stylebot matches styles to websites by domain name. Edit a style's URL in Options and use these patterns for anything more specific.",
      wildcards: {
        anything: 'Matches any character sequence.',
        segment: 'Matches any character sequence until a / is found.',
        list: 'Separates a list of patterns. A URL matches if any pattern matches.',
        regex: 'At the start of a URL, turns it into a regular expression.',
      },
      examplesTitle: 'Examples',
      examples: {
        domain: 'The domain docs.google.com or any of its subdomains.',
        prefix: 'Any URL beginning with docs.',
        numbered:
          'docs.google.com, docs1.google.com, docs2.google.com and so on.',
        subdomains: 'news.ycombinator.com and apps.ycombinator.com.',
        either: 'Either domain, or any of their subdomains.',
        regex: 'The Reddit homepage only.',
        everywhere: 'Every site. Useful for styles you want everywhere.',
      },
    },
    shortcuts: {
      intro:
        "Global shortcuts work on any page Stylebot can style; change them in your browser's shortcut settings, linked from Options. For the editor's own shortcuts, press [[?]] in the editor.",
      or: 'or',
      unset: 'Not set; assign in your browser',
      global: 'Global',
      picker: 'While picking an element',
      actions: {
        toggleEditor: 'Toggle editor',
        toggleStyling: 'Toggle styling',
        toggleReadability: 'Toggle readability',
        toggleGrayscale: 'Toggle grayscale',
        parent: 'Select the parent element',
        child: 'Go back to the child element',
        select: 'Select the highlighted element',
      },
    },
    help: {
      body: 'Found a bug or have an idea? Open an issue on <a href="{issues}">GitHub</a>. Stylebot is free and open source, maintained since 2011. If it\'s useful to you, you can support it by <a href="{donate}">buying me a coffee</a>.',
    },
  },
  privacy: {
    title: 'Privacy',
    description:
      'What Stylebot does with your data: no server, no account, no analytics.',
    lede: 'Stylebot has no server, no account and no analytics. Your styles stay in your browser unless you turn on sync, chat or the command line, and then they go straight to a service you chose or an app you allowed.',
    updated: 'Last updated {date}',
    browser: {
      title: 'What stays in your browser',
      body: [
        "Your styles, profiles, settings, history, chat conversations and API keys are saved in your browser's extension storage, and uninstalling Stylebot removes them. Stylebot reads the pages you visit to style them, and sends nothing from them unless you use chat or the command line.",
      ],
    },
    sync: {
      title: 'Google Drive sync',
      body: [
        'When you connect Google Drive in Options, your styles are saved to a file in your own Drive. Stylebot can only see the files it creates. Its access token stays in your browser and expires after an hour. Disconnect in Options or in your <a href="https://myaccount.google.com/connections">Google account</a>.',
        'Stylebot\'s use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.',
      ],
    },
    chat: {
      title: 'Chat',
      body: [
        'When you add an API key and send a message, your browser sends it straight to that provider with your message, any screenshot you attach, the page\'s address and title, an outline of what\'s visible on the page, and its CSS and your styles. That can include personal information shown on the page, so don\'t use chat on pages you wouldn\'t share with the provider. Their policy applies: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: 'Command line',
      body: [
        'When you turn on <q>Let apps on this computer control Stylebot</q> in Options, apps running as you can list your tabs, read pages, take screenshots, and read and change your styles, through a local connection only you can use. What they read can reach the services they use, such as the model behind a coding agent. Turn the setting off to disconnect.',
      ],
    },
    fonts: {
      title: 'Fonts and imported CSS',
      body: [
        'Google Fonts in your styles are downloaded from Google, which sees your IP address. Stylesheets you <code>@import</code> are fetched from their address.',
      ],
    },
    site: {
      title: 'This website',
      body: [
        'stylebot.dev has no ads or cookies and is hosted on GitHub Pages, which keeps standard server logs. Plausible counts visits by page, referrer, country and device type, without cookies or anything that identifies you.',
      ],
    },
    sharing: {
      title: 'Sharing',
      body: [
        "Stylebot doesn't collect, sell or share your data. It only leaves your browser for the services above, when you use them.",
      ],
    },
    contact: {
      title: 'Changes and contact',
      body: [
        'Changes to this policy are listed in the <a href="{history}">site\'s history on GitHub</a>. Questions go to <a href="mailto:{email}">{email}</a> or a <a href="{issues}">GitHub issue</a>.',
      ],
    },
    translation:
      'This is a translation. If it differs from the <a href="{original}">English version</a>, the English version applies.',
  },
  releases: {
    title: "What's new in {version}",
    bugFixes: 'And lots of <a href="{changelog}">bug fixes</a>',
    sections: 'Sections',
    r31: {
      description:
        'Stylebot 3.1 adds sync and backup with Google Drive, a resizable editor and color palettes.',
      syncTitle: 'Sync and backup with Google Drive',
      syncAlt: 'Syncing styles with Google Drive',
      syncBody: [
        'Turn on and authorize sync with Google Drive from the Stylebot <strong>Options page</strong>.',
        "Once it's on, click <strong>Sync Now</strong> in the popup or the Options page to sync your browser's styles with the ones backed up on Google Drive.",
      ],
      resizeTitle: 'Resize the Stylebot editor',
      resizeAlt: 'Resizing the Stylebot editor',
      resizeBody:
        "You can now resize the Stylebot editor, and optionally have the page shrink so its content doesn't sit under the editor.",
      colorsTitle: 'Color palettes',
      colorsAlt: 'Picking a color from a palette',
      colorsBody:
        'An improved color picker with palettes makes it easier to pick good colors.',
    },
    r32: {
      description:
        'Stylebot 3.2 brings faster, flicker-free styling, a redesigned Readability mode and a cleaner popup.',
      lede: 'Stylebot is back in active development, with more updates planned ahead.',
      fasterTitle: 'Faster, flicker-free styling',
      fasterBody:
        'CSS is now cached and applied instantly, so pages no longer flash unstyled while your styles catch up, and everything feels snappier as a result.',
      readabilityTitle: 'A redesigned Readability mode',
      readabilityAlt:
        "Readability mode's new inline theme and typography controls",
      readabilityItems: [
        'Newer article-extraction algorithm, better at cleaning up pages',
        'Faster activation, applying before the rest of the page loads',
        'Inline customization for theme and typography',
        'Smoother loading animation',
        'Keyboard shortcut to toggle it',
      ],
      popupTitle: 'A cleaner popup',
      popupAlt: "Stylebot's redesigned popup",
      popupItems: [
        'Fully clickable toggle rows',
        'Direct settings button',
        'Dark mode support',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 brings a redesigned editor, a command line for coding agents, profiles, a side panel, Chat, version history and sync.',
      lede: 'A redesigned editor, a command line for coding agents, profiles, and a side panel.',
      toc: {
        editor: 'Redesigned editor',
        cli: 'Command line',
        profiles: 'Profiles',
        panel: 'Side panel',
        history: 'Version history',
        sync: 'Sync',
        chat: 'Chat',
        more: 'And more',
      },
      editorTitle: 'A redesigned editor',
      // Newspaper is a profile name shown in the screenshot.
      editorAlt:
        'The redesigned Basic tab, styling Hacker News with a Newspaper profile',
      editorBody: 'Rebuilt from the ground up, now with dark mode.',
      // "More properties" is a label in Stylebot's editor; use the extension's own translation.
      editorItems: [
        "Grouped controls that show the page's own values",
        'Better selector generation, with selectors that keep working when a site updates and others to choose from',
        'Shows when another rule overrides a value',
        'Color palettes and an eyedropper',
        'Preview a color or font on the page by hovering it',
        'Edit any other CSS property in place under More properties',
        'Undo support',
      ],
      profilesTitle: 'Profiles',
      profilesAlt: 'The popup on a site with two profiles, Dracula and Gruvbox',
      profilesBody:
        'Keep several looks for a site and switch between them from the editor or the popup.',
      panelTitle: 'The side panel, or its own window',
      panelAlt: 'The editor’s menu, with Position set to the side panel',
      panelBody:
        'In Chrome and Edge the editor opens in the side panel. Or pop it out into its own window, from <strong>Position</strong> in the editor’s <strong>⋯</strong> menu.',
      historyTitle: 'Version history',
      historyBody:
        'Every change is kept, and you can restore any earlier version.',
      syncTitle: 'Sync',
      syncBody:
        'Google Drive sync is more robust. Edits from different computers are merged, so none get lost. It runs on its own every 30 minutes and right after you edit.',
      chatTitle: 'Chat',
      chatBody:
        'No coding agent? Describe what you want, or pick a suggested look, and Stylebot writes the CSS. Bring your own Claude, OpenAI or Gemini key.',
      // Cozy, Calm and Only the links in color are suggestions shown in the screenshot; use the extension's own translation.
      chatAlt:
        'The Chat tab suggesting looks for the page: Cozy, Calm, and Only the links in color',
      moreTitle: 'And more',
      moreItems: [
        'A new stylebot.dev',
        'A new Stylebot icon',
        'Styles now apply inside shadow DOM, so they work on sites built with web components',
        "Stylebot's shortcuts now live in your browser's shortcut settings. In Chrome and Edge, any you changed are back to their defaults, so set them again there.",
        'Stylebot is now available in Vietnamese',
      ],
    },
  },
  notFound: {
    title: 'Page not found',
    description: "This page doesn't exist.",
    heading: "This page doesn't exist, and it looks terrible.",
    done: 'Much better. The page still doesn’t exist, but at least it looks good now.',
    pageTitle: '404 Not Found',
    pageBody: 'The requested URL was not found on this server.',
    pageLink: 'Go to the homepage',
    nice: '✨ Just make it nice',
  },
};
