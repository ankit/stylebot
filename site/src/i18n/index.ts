import enSite from './en/site';
import enDemo from './en/demo';
import deSite from './de/site';
import deDemo from './de/demo';
import esSite from './es/site';
import esDemo from './es/demo';
import frSite from './fr/site';
import frDemo from './fr/demo';
import itSite from './it/site';
import itDemo from './it/demo';
import ptBrSite from './pt-br/site';
import ptBrDemo from './pt-br/demo';
import ptPtSite from './pt-pt/site';
import ptPtDemo from './pt-pt/demo';
import roSite from './ro/site';
import roDemo from './ro/demo';
import viSite from './vi/site';
import viDemo from './vi/demo';
import ruSite from './ru/site';
import ruDemo from './ru/demo';
import jaSite from './ja/site';
import jaDemo from './ja/demo';
import koSite from './ko/site';
import koDemo from './ko/demo';
import zhCnSite from './zh-cn/site';
import zhCnDemo from './zh-cn/demo';
import zhTwSite from './zh-tw/site';
import zhTwDemo from './zh-tw/demo';
import { localeOf, type Locale } from './locales';

export type SiteMessages = typeof enSite;
export type DemoMessages = typeof enDemo;
export type Messages = { site: SiteMessages; demo: DemoMessages };

const MESSAGES: Record<Locale, Messages> = {
  en: { site: enSite, demo: enDemo },
  de: { site: deSite, demo: deDemo },
  es: { site: esSite, demo: esDemo },
  fr: { site: frSite, demo: frDemo },
  it: { site: itSite, demo: itDemo },
  'pt-br': { site: ptBrSite, demo: ptBrDemo },
  'pt-pt': { site: ptPtSite, demo: ptPtDemo },
  ro: { site: roSite, demo: roDemo },
  vi: { site: viSite, demo: viDemo },
  ru: { site: ruSite, demo: ruDemo },
  ja: { site: jaSite, demo: jaDemo },
  ko: { site: koSite, demo: koDemo },
  'zh-cn': { site: zhCnSite, demo: zhCnDemo },
  'zh-tw': { site: zhTwSite, demo: zhTwDemo },
};

export function messages(locale: Locale): Messages {
  return MESSAGES[locale];
}

/**
 * The messages for the page at a URL, from its locale prefix.
 */
export function messagesFor(url: URL) {
  const locale = localeOf(url.pathname);
  return { locale, ...messages(locale) };
}

export * from './locales';
export * from './format';
