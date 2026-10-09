export default {
  scenes: {
    pin: {
      title: 'Pin it to the toolbar',
      body: 'Keep Stylebot one click away.',
      captions: {
        menu: 'Stylebot starts in the extensions menu.',
        pinned: 'Pinned. Stylebot is now in your toolbar.',
      },
    },
    open: {
      title: 'Open the editor',
      // {keys} is the keyboard shortcut, shown as Alt+Shift+M or ⌥⇧M
      keysBody: 'Click the icon, or press {keys}.',
      captions: {
        // "Style this page" is the popup's button, popup.styleThisPage
        iconThenStyle: 'Click the Stylebot icon, then Style this page.',
        // {keys} is the keyboard shortcut, shown as Alt+Shift+M or ⌥⇧M
        orKeys: 'Or press {keys} to open it directly.',
      },
    },
    pick: {
      title: 'Pick an element',
      fieldsBody: 'Click to select. Fields show its current styles.',
      captions: {
        hoverToSee: 'Hover to see what can be styled.',
        select: 'Click to select. The selector fills in for you.',
        computed: 'Each field shows the element’s current computed value.',
      },
    },
    style: {
      title: 'Style it',
      body: 'Use the Basic controls or write CSS.',
      captions: {
        size: 'Set the size…',
        color: '…and the color.',
        plainCss: 'Every change is plain CSS, saved for this site.',
        byHand: 'Or write CSS by hand.',
        live: 'The page updates as you type.',
      },
    },
    profiles: {
      title: 'Profiles',
      // Also the scene's first caption
      looksBody: 'Save different looks for the same site.',
      captions: {
        createForLook: 'Create a profile for a new look.',
        // {profile} is the new profile's name; {defaultProfile} is "Default"
        created: '{profile} starts clean. {defaultProfile} is still saved.',
        // The new profile, editor.newProfile, gets a newspaper-like style
        newspaperLook: 'Give it a newspaper look.',
        // On a dark page the new profile, editor.newProfileDark, gets a warm dark theme instead
        darkLook: 'Give it a warm dark look.',
        // "them" is the two profiles
        switchAnytime: 'Switch between them anytime.',
        // {defaultProfile} is the default profile's name, "Default"
        backToDefault: 'Back to {defaultProfile}. One site, two looks.',
      },
    },
  },
  browser: {
    extensions: 'Extensions',
    fullAccess: 'Full access',
    fullAccessNote:
      'These extensions can see and change information on this site.',
    // Names of made-up extensions listed beside Stylebot in the browser's menu
    otherExtensions: {
      adBlocker: 'Ad blocker',
      passwordManager: 'Password manager',
      translate: 'Translate',
      webArchive: 'Web archive',
    },
  },
  popup: {
    readability: 'Readability',
    styleThisPage: 'Style this page',
  },
  editor: {
    defaultProfile: 'Default',
    // The name the visitor types for the profile they create, for a newspaper-like look
    newProfile: 'Newspaper',
    // The same profile's name on a dark page, where it gets a warm dark theme;
    // matches the extension's "Night owl" suggestion
    newProfileDark: 'Night owl',
    createProfile: 'Create profile',
    pickAnElement: 'Pick an element',
    tabs: {
      basic: 'Basic',
      code: 'Code',
      presets: 'Presets',
      chat: 'Chat',
    },
    basic: {
      hide: 'Hide',
      reset: 'Reset',
      text: 'Text',
      font: 'Font',
      // The font picker's value when no font is set
      defaultFont: 'Default',
      size: 'Size',
      lineHeight: 'Line Height',
      color: 'Color',
      decoration: 'Decoration',
      // Text decoration option: no underline, strikethrough or overline
      none: 'None',
      alignment: 'Alignment',
      background: 'Background',
      box: 'Box',
      effects: 'Effects',
      moreProperties: 'More properties',
    },
    code: {
      // Shown as a CSS comment in an empty code editor
      noStyles: 'No styles yet',
    },
    presets: {
      readability: 'Readability',
      articlesOnly: 'Articles only',
      readabilityDescription:
        "Turn this site's articles into a clean, distraction-free reading view, with your choice of theme, font, and size.",
      grayscale: 'Grayscale',
      grayscaleDescription: 'Apply grayscale to the page.',
    },
  },
  // The sample news article on the demo's page; the same story as cli.demo in site.ts,
  // so translate it the same way there. "The Harbour Post" is the paper's name.
  article: {
    nav: {
      news: 'News',
      travel: 'Travel',
      signIn: 'Sign in',
    },
    kicker: 'Travel · Long read',
    headline: 'The quiet return of the night ferry',
    dek: 'Three operators are betting that travelers will trade speed for a cabin, a sea view and no airport.',
    // A made-up author, date and reading time; keep the name
    byline: 'Marta Linde · Sep 24 · 6 min read',
    paragraphs: [
      'Twenty years after the last overnight crossing was cut, three operators are putting cabins back on the water. The pitch is simple: board after dinner, sleep through the crossing, and wake up in another country.',
      'Bookings on the first reopened line sold out for the summer within a week. Most passengers are under forty, and many have never taken a sleeper of any kind. Operators say the cabins fill first, then the reclining seats, then the deck.',
    ],
    quote: '“Nobody books this to save time. They book it to lose a little.”',
    // A made-up person; keep the name
    quoteBy: '— Ines Varga, route planner',
  },
  steps: {
    // Heading above the list of the walkthrough's steps
    heading: 'How it works',
    // The current step out of the total, e.g. "2 / 6"
    counter: '{current} / {total}',
    jump: 'Jump to this point',
  },
};
