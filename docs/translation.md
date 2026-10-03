# Translation

Add support for a locale via the following steps

- See [supported locales](https://developer.chrome.com/docs/webstore/i18n#locales)
- If `src/assets/_locales/[locale].config` already exists, please help improve translations
- If not, copy [`src/assets/_locales/en.config`](../src/assets/_locales/en.config) to `src/assets/_locales/[locale].config`
- Update strings in `src/assets/_locales/[locale].config` to match the locale

## Checks

`yarn validate-locales` runs in CI and fails when:

- a string is used in code but missing from the English locale
- a string in the English locale is missing from any other locale, so every new string needs all of them
- a locale has a string the English locale doesn't
- a translation's placeholders don't match the English ones
- a string in the English locale is never used (copy kept for the store listing is exempt)
- a component shows text that doesn't go through a locale string: text in a template, or a title, placeholder, label or alt written out in English

Words that read the same in every language, like the product name, are allowed as they are.
