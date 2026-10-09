export const LOCALES = [
  { code: 'en', lang: 'en', name: 'English' },
  { code: 'de', lang: 'de', name: 'Deutsch' },
  { code: 'es', lang: 'es', name: 'Español' },
  { code: 'fr', lang: 'fr', name: 'Français' },
  { code: 'it', lang: 'it', name: 'Italiano' },
  { code: 'pt-br', lang: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'pt-pt', lang: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'ro', lang: 'ro', name: 'Română' },
  { code: 'vi', lang: 'vi', name: 'Tiếng Việt' },
  { code: 'ru', lang: 'ru', name: 'Русский' },
  { code: 'ja', lang: 'ja', name: '日本語' },
  { code: 'ko', lang: 'ko', name: '한국어' },
  { code: 'zh-cn', lang: 'zh-CN', name: '简体中文' },
  { code: 'zh-tw', lang: 'zh-TW', name: '繁體中文' },
] as const;

export type Locale = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: Locale = 'en';

const CODES = LOCALES.map((l) => l.code) as readonly string[];

/**
 * The locale a site path belongs to, from its first segment; English pages
 * have no prefix.
 */
export function localeOf(pathname: string): Locale {
  const first = pathname.split('/')[1]?.toLowerCase() ?? '';
  return CODES.includes(first) ? (first as Locale) : DEFAULT_LOCALE;
}

/**
 * A site path without its locale prefix, e.g. `/de/manual` → `/manual`.
 */
export function unlocalizedPath(pathname: string): string {
  const locale = localeOf(pathname);
  if (locale === DEFAULT_LOCALE) return pathname;
  return pathname.slice(locale.length + 1) || '/';
}

/**
 * A site path in the given locale, e.g. `/manual` → `/de/manual`. Hashes and
 * query strings are kept.
 */
export function localizePath(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

export function htmlLang(locale: Locale): string {
  return LOCALES.find((l) => l.code === locale)!.lang;
}

/**
 * Static paths for a page served in every locale: `/page` for English and
 * `/<locale>/page` for the rest, for pages under `src/pages/[...lang]/`.
 */
export function localeStaticPaths() {
  return LOCALES.map(({ code }) => ({
    params: { lang: code === DEFAULT_LOCALE ? undefined : code },
  }));
}

/**
 * The site locale for a BCP 47 language tag such as `de-AT` or `zh-HK`, or
 * undefined when the site isn't translated into that language.
 */
export function matchLocale(tag: string): Locale | undefined {
  const lower = tag.toLowerCase();
  if (CODES.includes(lower)) return lower as Locale;
  const [base] = lower.split('-');
  if (base === 'zh') {
    return /-(tw|hk|mo|hant)/.test(lower) ? 'zh-tw' : 'zh-cn';
  }
  if (base === 'pt') return 'pt-br';
  return CODES.includes(base) ? (base as Locale) : undefined;
}
