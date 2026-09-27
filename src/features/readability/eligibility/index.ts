import { shouldRunOnUrl } from './should-run-on-url';
import { isBlockedAfterLoad } from './is-blocked-after-load';
import { hasReaderableContent } from './has-readerable-content';

export { shouldRunOnUrl } from './should-run-on-url';
export { shouldWaitForFullLoad } from './should-wait-for-full-load';
export { isBlockedAfterLoad } from './is-blocked-after-load';

/**
 * Whether the reader can run on the current page right now.
 */
export const isReaderable = (): boolean => {
  // Once mounted, the original content is stripped and the article lives
  // in a shadow root `querySelectorAll` can't see — short-circuit instead.
  if (document.getElementById('stylebot-reader')) {
    return true;
  }

  return (
    shouldRunOnUrl() && !isBlockedAfterLoad() && hasReaderableContent(document)
  );
};
