import { initReader } from './reader';
import { shouldRunOnUrl } from './utils';
import { showLoader, hideLoader } from './loader';
import { cacheUrl, didUrlChange, revertToCachedDocument } from './cache';

import './index.scss';

const run = async () => {
  try {
    await initReader();
  } catch (e) {
    remove();
  }
};

export const apply = async (forceApply = false): Promise<void> => {
  if (window !== window.top) {
    return;
  }

  // Prevent duplicate calls for the same url if not force applying
  if (!forceApply && !didUrlChange()) {
    return;
  }

  cacheUrl();

  if (!shouldRunOnUrl()) {
    remove();
    return;
  }

  showLoader();

  if (document.readyState === 'complete') {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', async () => {
      run();
    });
  }
};

export const remove = (): void => {
  hideLoader();
  revertToCachedDocument();
  document.getElementById('stylebot-reader')?.remove();
};
