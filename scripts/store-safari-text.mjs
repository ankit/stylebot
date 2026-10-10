// Writes the Mac App Store listing's text for each language into
// store/safari/listing/<App Store Connect locale>/, one file per field, from
// the store copy in the extension's locale files:
//
//   yarn store:safari-text

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { parseLocaleConfig } = require('./lib/parse-locale-config.js');

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const localesDir = path.join(rootDir, 'src/assets/_locales');
const outDir = path.join(rootDir, 'store/safari/listing');

// The extension's locales, by the locale App Store Connect calls them.
const LOCALES = {
  'en-US': 'en_US',
  'en-GB': 'en_GB',
  'de-DE': 'de',
  'es-ES': 'es',
  'fr-FR': 'fr',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  'pt-BR': 'pt_BR',
  'pt-PT': 'pt_PT',
  ro: 'ro',
  ru: 'ru',
  vi: 'vi',
  'zh-Hans': 'zh_CN',
  'zh-Hant': 'zh_TW',
};

// App Store Connect's limits: keywords count bytes, the rest characters.
const LIMITS = {
  name: { max: 30, measure: text => [...text].length },
  subtitle: { max: 30, measure: text => [...text].length },
  keywords: { max: 100, measure: text => Buffer.byteLength(text) },
  description: { max: 4000, measure: text => [...text].length },
};

/**
 * The Chrome Web Store description without its command line bullet, since
 * Safari builds don't carry the CLI. That bullet is the one naming Claude Code.
 */
const toDescription = listing =>
  listing
    .split('\n')
    .filter(line => !(line.startsWith('★') && line.includes('Claude Code')))
    .join('\n');

const read = locale =>
  parseLocaleConfig(
    readFileSync(path.join(localesDir, `${locale}.config`), 'utf8')
  ).messages;

rmSync(outDir, { recursive: true, force: true });

let failed = 0;

for (const [storeLocale, locale] of Object.entries(LOCALES)) {
  const messages = read(locale);
  const fields = {
    name: 'Stylebot',
    subtitle: messages.app_store_subtitle.message,
    keywords: messages.app_store_keywords.message,
    description: toDescription(messages.store_listing.message),
  };
  const dir = path.join(outDir, storeLocale);
  mkdirSync(dir, { recursive: true });

  for (const [field, text] of Object.entries(fields)) {
    const { max, measure } = LIMITS[field];
    if (measure(text) > max) {
      failed++;
      console.error(`✗ ${storeLocale} ${field} is over ${max}`);
    }
    writeFileSync(path.join(dir, `${field}.txt`), `${text}\n`);
  }
}

console.log(
  `Wrote ${Object.keys(LOCALES).length} languages to ${path.relative(
    rootDir,
    outDir
  )}/`
);
process.exit(failed ? 1 : 0);
