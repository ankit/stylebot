import { PageSnapshot } from './PageBridge';

/**
 * The snapshot a store starts from before its host has read the page.
 */
export const emptyPageSnapshot = (): PageSnapshot => ({
  domain: '',
  href: '',
  title: '',
  readerable: false,
  bodyChildSelectors: [],
});
