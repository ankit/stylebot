/**
 * Checks that site strings matching an extension string in English use the
 * extension's own translation, so mock UI labels match the real extension.
 * With --glossary <code>, prints those strings and their translations instead.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const { parseLocaleConfig } = createRequire(import.meta.url)(
  '../../scripts/lib/parse-locale-config.js',
);

const CATALOGS = ['site', 'demo'];

// Walkthrough step headings word "Pick an element" as an instruction, unlike the
// button; the sample news article is the demo page's text, not Stylebot's UI.
const EXCEPTIONS = [
  'demo:scenes.pick.title',
  'demo:article.',
  'site:cli.demo.',
];

const i18n = new URL('../src/i18n/', import.meta.url);
const configs = new URL('../../src/assets/_locales/', import.meta.url);

type Leaves = Map<string, string>;

/**
 * Every string in a catalog by its dotted path, prefixed with the catalog.
 */
function leaves(value: unknown, path: string, out: Leaves = new Map()) {
  if (typeof value === 'string') out.set(path, value);
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      leaves(child, `${path}${path.endsWith(':') ? '' : '.'}${key}`, out);
    }
  }
  return out;
}

const load = async (locale: string) => {
  const all: Leaves = new Map();
  for (const catalog of CATALOGS) {
    const url = new URL(`${locale}/${catalog}.ts`, i18n).href;
    leaves((await import(url)).default, `${catalog}:`, all);
  }
  return all;
};

const config = (locale: string): Record<string, string> => {
  const [lang, region] = locale.split('-');
  const file = region ? `${lang}_${region.toUpperCase()}` : lang;
  const raw = readFileSync(new URL(`${file}.config`, configs), 'utf8');
  const { messages } = parseLocaleConfig(raw);
  return Object.fromEntries(
    Object.entries(messages).map(([key, { message }]: [string, any]) => [
      key,
      message,
    ]),
  );
};

const normalize = (s: string) => s.replace(/\.\.\.$/, '…');

const english = await load('en');
const extensionKeys = new Map<string, string[]>();
for (const [key, message] of Object.entries(config('en'))) {
  const text = normalize(message);
  extensionKeys.set(text, [...(extensionKeys.get(text) ?? []), key]);
}

const args = process.argv.slice(2);
const glossary = args[0] === '--glossary' ? args[1] : null;
const locales = glossary
  ? [glossary]
  : readdirSync(i18n, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'en')
      .map((e) => e.name);

const errors: string[] = [];

for (const locale of locales) {
  const translated = await load(locale);
  const extension = config(locale);
  for (const [path, text] of english) {
    const keys = extensionKeys.get(text);
    if (!keys) continue;
    const expected = keys.map((key) => extension[key]).filter(Boolean);
    if (glossary) {
      console.log(
        `${path}  ${JSON.stringify(text)} => ${expected.map((e) => JSON.stringify(e)).join(' / ')}  (@${keys.join(', @')})`,
      );
      continue;
    }
    const actual = translated.get(path) ?? '';
    if (
      EXCEPTIONS.some((e) => path.startsWith(e)) ||
      expected.some((e) => normalize(e) === actual)
    ) {
      continue;
    }
    errors.push(
      `${locale} ${path}: ${JSON.stringify(actual)}, extension has ${expected
        .map((e) => JSON.stringify(e))
        .join(' or ')} (@${keys.join(', @')})`,
    );
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
if (!glossary) console.log(`Extension terms match in ${locales.join(', ')}`);
