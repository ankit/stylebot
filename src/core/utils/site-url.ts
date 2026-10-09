import { t } from '@stylebot/i18n';

const SITE = 'https://stylebot.dev';

// Locales stylebot.dev is translated into, as `language_code` names them.
const SITE_LOCALES = [
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt-br',
  'pt-pt',
  'ro',
  'ru',
  'vi',
  'zh-cn',
  'zh-tw',
];

/**
 * A stylebot.dev page in the extension's UI language, e.g. `/manual` becomes
 * `https://stylebot.dev/de/manual` in German; English pages have no prefix.
 */
export const getSiteUrl = (
  path: string,
  languageCode: string = t('language_code')
): string => {
  const locale = languageCode.toLowerCase();
  return SITE_LOCALES.includes(locale)
    ? `${SITE}/${locale}${path}`
    : `${SITE}${path}`;
};
