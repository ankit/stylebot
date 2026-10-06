import type { ChatPageSignals } from '@stylebot/types';

/**
 * A request Chat offers before a conversation starts: its label as an i18n
 * key with the substitution it takes, and the full request it sends.
 */
export type ChatSuggestion = {
  id: string;
  label: string;
  request: string;
  substitutions?: Array<string>;
};

/**
 * What the suggestions are chosen from: the page's signals (null when the
 * page couldn't be read) and whether it's an article.
 */
export type ChatSuggestionContext = {
  signals: ChatPageSignals | null;
  article: boolean;
};

const MAX_PRACTICAL = 2;

const DARK_MODE: ChatSuggestion = {
  id: 'dark-mode',
  label: 'dark_mode',
  request:
    'Give this page a dark theme: a dark background, soft light text, dimmer text for secondary details, links in a gentle blue, and cards, menus and inputs a little lighter than the background. Keep all text easy to read.',
};

const LIGHT_MODE: ChatSuggestion = {
  id: 'light-mode',
  label: 'light_mode',
  request:
    'Give this page a light theme: a white background, near-black text, gray for secondary details, links in a clear blue, and cards, menus and inputs in a faint gray with subtle borders. Keep all text easy to read.',
};

const EASIER_TO_READ: ChatSuggestion = {
  id: 'easier-to-read',
  label: 'easier_to_read',
  request:
    'Make the text easier to read: larger body text, more space between lines, shorter lines, and stronger contrast between the text and its background.',
};

const READ_LIKE_A_BOOK: ChatSuggestion = {
  id: 'book',
  label: 'read_like_a_book',
  request:
    'Make the article read like a book: a comfortable serif for the text and headings, larger text with roomy lines, a narrow centered column, and the sidebars hidden. Keep the images.',
};

const FOCUS_MODE: ChatSuggestion = {
  id: 'focus',
  label: 'focus_mode',
  request:
    'Focus mode: hide everything but the article (the header, navigation, sidebars, comments, footer and ads), and center the article in a comfortable reading column. Keep its images.',
};

const UNPIN_HEADER: ChatSuggestion = {
  id: 'unpin-header',
  label: 'stop_the_header_from_following_me',
  request:
    'Stop the header from following me: let the header scroll away with the page instead of staying fixed at the top, and remove the space the page kept for it.',
};

const HIDE_SIDEBAR: ChatSuggestion = {
  id: 'hide-sidebar',
  label: 'hide_the_sidebar',
  request:
    'Hide the sidebar and let the main content use the space, centered on the page.',
};

const COMPACT: ChatSuggestion = {
  id: 'compact',
  label: 'compact',
  request:
    'Make the list compact so more fits on screen: tighter lines and less space around and between items, so each takes noticeably less room. Keep the text size and every item.',
};

const HIDE_DISTRACTIONS: ChatSuggestion = {
  id: 'hide-distractions',
  label: 'hide_distractions',
  request:
    'Hide distractions: ads and promos, banners and pop-ups, cookie, subscription and newsletter prompts, social share buttons, autoplay videos and sticky footers. Keep the navigation and the main content with its images as they are.',
};

// Editor palettes the Terminal look takes turns with, after its green.
export const TERMINAL_THEMES = ['Dracula', 'Everforest'];

const terminalThemeRequest = (name: string): string =>
  `Terminal, in ${name}: ${name}'s own dark background, foreground and accent colors, a monospace font for everything, and links in one of its accents. Keep all text easy to read.`;

export const CREATIVE_SUGGESTIONS: Array<ChatSuggestion> = [
  {
    id: 'paper-and-ink',
    label: 'paper_and_ink',
    request:
      'Paper & ink: give the page the look of an e-reader, with warm off-white paper, soft black ink, a bookish serif at a comfortable size with roomy lines, a narrow centered text column, and links in a muted brown.',
  },
  {
    id: 'wabi-sabi',
    label: 'wabi_sabi',
    request:
      'Wabi-sabi: paper white with charcoal text, a single vermilion accent for links and buttons only, generous space between lines and sections, no shadows or gradients, and ads, promos and decorative extras like badges and icons hidden.',
  },
  {
    id: 'terminal',
    label: 'terminal',
    request:
      'Terminal: a near-black background, phosphor green text, a monospace font for everything, links in a lighter green, and dim green borders.',
  },
  {
    id: 'morning-newspaper',
    label: 'morning_newspaper',
    request:
      'Morning newspaper: cream paper and black ink, a classic serif for headlines and body text, narrow columns, and thin rules between sections.',
  },
  {
    id: 'swiss-poster',
    label: 'swiss_poster',
    request:
      'Swiss poster: a clean geometric sans-serif throughout, black text on white with one strong red accent for links, bold oversized headings, everything left-aligned on a strict grid, and no rounded corners or shadows.',
  },
  {
    id: 'night-owl',
    label: 'night_owl',
    request:
      'Night owl: a warm dark theme, with a deep brown-black background, cream text, muted tan for secondary text, amber links, slightly lighter cards and inputs, and images dimmed a little.',
  },
  {
    id: 'cozy',
    label: 'cozy',
    request:
      'Cozy: a cream background, warm dark brown text, a soft rounded sans-serif throughout, rounded corners on cards, buttons and inputs, gentle shadows, and terracotta links.',
  },
  {
    id: 'calm',
    label: 'calm',
    request:
      'Calm: quiet, desaturated colors, with an off-white background, soft dark gray text and muted blue-gray links, nothing bright, roomy lines, plenty of space between sections, and ads, promos, banners and pop-ups hidden.',
  },
  {
    id: 'links-in-color',
    label: 'only_the_links_in_color',
    request:
      'Only the links in color: make the page grayscale, with white and light gray backgrounds, dark gray text and grayscale images, and the links alone in a clear blue with an underline.',
  },
  {
    id: 'surprise-me',
    label: 'surprise_me',
    request:
      'Surprise me: restyle this page in a look of your choosing, and tell me what you went for.',
  },
];

/**
 * The page's best two requests, strongest signal first: its shape and what
 * gets in the way, then a theme opposite to its look. Unread pages get a
 * dark mode and easier reading.
 */
export const getPracticalSuggestions = ({
  signals,
  article,
}: ChatSuggestionContext): Array<ChatSuggestion> => {
  const {
    dark = false,
    list = false,
    sidebar = false,
    pinnedHeader = false,
    ads = false,
  } = signals ?? {};

  const ranked: Array<[boolean, ChatSuggestion]> = [
    [article && sidebar, FOCUS_MODE],
    [article && !sidebar, READ_LIKE_A_BOOK],
    [ads, HIDE_DISTRACTIONS],
    [pinnedHeader, UNPIN_HEADER],
    [!article && sidebar, HIDE_SIDEBAR],
    [list, COMPACT],
    [dark, LIGHT_MODE],
    [!dark, DARK_MODE],
    [true, EASIER_TO_READ],
  ];

  return ranked
    .filter(([applies]) => applies)
    .map(([, suggestion]) => suggestion)
    .slice(0, MAX_PRACTICAL);
};

/**
 * The creative requests from a position in the set onwards, wrapping
 * around it; each time round, Terminal takes the next of its palettes:
 * phosphor green, then each editor theme.
 */
export const getCreativeSuggestions = (
  start: number,
  count: number
): Array<ChatSuggestion> =>
  Array.from({ length: count }, (_, i) => {
    const position = start + i;
    const choice = CREATIVE_SUGGESTIONS[position % CREATIVE_SUGGESTIONS.length];
    const round = Math.floor(position / CREATIVE_SUGGESTIONS.length);
    const variant = round % (TERMINAL_THEMES.length + 1);

    if (choice.id !== 'terminal' || variant === 0) {
      return choice;
    }

    const name = TERMINAL_THEMES[variant - 1];
    return {
      ...choice,
      label: 'terminal_theme',
      request: terminalThemeRequest(name),
      substitutions: [name],
    };
  });
