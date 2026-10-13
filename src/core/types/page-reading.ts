import type { CssDeclaration } from './css';

/**
 * Declarations to set on a selector; an empty value removes the property
 * from the rule.
 */
export type CssEdit = {
  selector: string;
  declarations: Array<CssDeclaration>;
};

/**
 * Something the page check found once CSS was applied: text that became
 * hard to read, a surface a new theme missed, or a declaration that changed
 * nothing.
 */
export type StyleProblem =
  | {
      type: 'unreadable-text';
      selector: string;
      count: number;
      // How many elements the selector matches in all.
      of: number;
      color: string;
      background: string;
      ratio: number;
      // The selector that painted the background behind the text.
      paintedBy?: string;
      /* The variable, or selector, that set the text's color. Text a
       * variable colors is one problem for all of it, with selector an example. */
      coloredBy?: string;
    }
  | {
      type: 'missed-surface';
      selector: string;
      count: number;
      background: string;
      // What the page's base background turned into.
      page: 'dark' | 'light';
    }
  | {
      type: 'overridden-declaration';
      selector: string;
      property: string;
      value: string;
    };

/**
 * What the page shows, to suggest requests that suit it: whether it's dark,
 * and whether it has a long list, a sidebar, a header that stays on screen
 * as it scrolls, or ads.
 */
export type PageSignals = {
  dark: boolean;
  list: boolean;
  sidebar: boolean;
  pinnedHeader: boolean;
  ads: boolean;
};

/**
 * What suggestions are chosen from: the page's signals (null when the page
 * couldn't be read) and whether it's an article.
 */
export type SuggestionContext = {
  signals: PageSignals | null;
  article: boolean;
};
