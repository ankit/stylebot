import { t } from '@stylebot/i18n';
import type { GoogleSignInRedirect } from '@stylebot/types';

const status = t('signing_in_to_google_drive');

document.documentElement.lang = t('language_code');
document.title = status;

const element = document.getElementById('status');
if (element) {
  element.textContent = status;
}

// The background reads the code from this URL, then closes the tab.
const message: GoogleSignInRedirect = {
  name: 'GoogleSignInRedirect',
  url: location.href,
};
chrome.runtime.sendMessage(message);
