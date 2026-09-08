import { isMediaWikiMainPage } from './is-media-wiki-main-page';

// Checks that need the parsed DOM to be reliable (e.g. reading
// document.scripts) — run once after the DOMContentLoaded/load wait rather
// than eagerly like shouldRunOnUrl(). Add future post-load exclusions here.
const AFTER_LOAD_CHECKS: Array<() => boolean> = [isMediaWikiMainPage];

/**
 * Whether a check that requires the loaded DOM says the reader shouldn't run here.
 */
export const isBlockedAfterLoad = (): boolean =>
  AFTER_LOAD_CHECKS.some(check => check());
