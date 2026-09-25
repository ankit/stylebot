import type { Timestamp } from './shared';

export type Style = {
  url: string;
  css: string;
  enabled: boolean;
  readability: boolean;
  modifiedTime: Timestamp;
  // Whether `!important` is forced onto every declaration. Missing means
  // true; only false is ever stored.
  forceImportant?: boolean;
};

export type StyleWithoutUrl = Omit<Style, 'url'>;

export type StyleMap = {
  [url: string]: Omit<Style, 'url'>;
};
