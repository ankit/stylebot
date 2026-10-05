/**
 * Shows the extension's state, in the user's language.
 * `messages` maps each of the extension's message keys to its text.
 */
function show(state, messages) {
  const t = key => messages[key] ?? '';
  const setText = (selector, text) => {
    document.querySelector(selector).textContent = text;
  };

  document.documentElement.lang = t('language_code');
  setText('.description', t('extension_description'));
  setText(
    '.state-on',
    t('stylebot_is_on_turn_it_off_in_safari_settings_extensions')
  );
  setText(
    '.state-off',
    t('stylebot_is_off_turn_it_on_in_safari_settings_extensions')
  );
  setText(
    '.state-unknown',
    t('turn_on_stylebot_in_safari_settings_extensions')
  );
  setText('.open-preferences', t('quit_and_open_safari_settings'));
  document.body.classList.add(`state-${state}`);
}

function openPreferences() {
  webkit.messageHandlers.controller.postMessage('open-preferences');
}

document
  .querySelector('button.open-preferences')
  .addEventListener('click', openPreferences);
