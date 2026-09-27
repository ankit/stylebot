// Sites that populate article images lazily, after DOMContentLoaded.
const DEFERRED_IMAGE_HOSTS = ['nytimes.com'];

/**
 * Whether to wait for window `load` (not just DOMContentLoaded) before mounting.
 */
export const shouldWaitForFullLoad = (): boolean =>
  DEFERRED_IMAGE_HOSTS.some(host => document.domain.endsWith(host));
