/**
 * Fills each [data-i18n] element with its message, in the user's language
 * when the app passes `messages`, showing *starred* words bold.
 */
function localize(messages = {}) {
  if (messages.language_code) {
    document.documentElement.lang = messages.language_code;
  }

  for (const element of document.querySelectorAll('[data-i18n]')) {
    const text = messages[element.dataset.i18n] ?? element.textContent;

    element.replaceChildren(
      ...text.split('*').map((part, index) => {
        if (index % 2 === 0) {
          return document.createTextNode(part);
        }

        const bold = document.createElement('b');
        bold.textContent = part;
        return bold;
      })
    );
  }
}

localize();
