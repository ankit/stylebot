// Cross-checks src/_locales/*.config against how message keys are referenced
// from source. Exits 1 on errors; missing translations are warnings only.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseLocaleConfig } = require('./lib/parse-locale-config.js');

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const localesDir = path.join(rootDir, 'src/_locales');
const srcDir = path.join(rootDir, 'src');
const manifestPath = path.join(rootDir, 'src/extension/manifest.json');

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

// Returns a call's first argument text, e.g. `a ? 'x' : 'y'` for `t(a ? 'x' : 'y', [z])`.
function extractFirstArg(text, startIdx) {
  let depth = 0;

  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];

    if (c === '(' || c === '[' || c === '{') {
      depth++;
    } else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) return text.slice(startIdx, i);
      depth--;
    } else if (c === ',' && depth === 0) {
      return text.slice(startIdx, i);
    }
  }

  return text.slice(startIdx);
}

function findReferencedKeys(text) {
  const staticKeys = new Set();
  const dynamicCalls = [];
  const callRegex = /\bt\(|chrome\.i18n\.getMessage\(/g;

  let match;

  while ((match = callRegex.exec(text))) {
    const argStart = match.index + match[0].length;
    const arg = extractFirstArg(text, argStart);
    const literals = [...arg.matchAll(/'([^']*)'|"([^"]*)"/g)].map(
      m => m[1] ?? m[2]
    );

    if (literals.length === 0) {
      dynamicCalls.push(arg.trim());
      continue;
    }

    literals.forEach(key => {
      if (KEY_PATTERN.test(key)) staticKeys.add(key);
    });
  }

  return { staticKeys, dynamicCalls };
}

function walk(dir) {
  return readdirSync(dir, { recursive: true })
    .map(entry => path.join(dir, entry))
    .filter(p => /\.(ts|vue)$/.test(p));
}

function collectUsedKeys() {
  const usedKeys = new Set();
  const dynamicCalls = [];

  for (const file of walk(srcDir)) {
    const text = readFileSync(file, 'utf8');
    const found = findReferencedKeys(text);

    found.staticKeys.forEach(key => usedKeys.add(key));
    found.dynamicCalls.forEach(call =>
      dynamicCalls.push(`${path.relative(rootDir, file)}: ${call}`)
    );
  }

  const manifest = readFileSync(manifestPath, 'utf8');

  [...manifest.matchAll(/__MSG_([a-zA-Z0-9_]+)__/g)].forEach(m =>
    usedKeys.add(m[1])
  );

  return { usedKeys, dynamicCalls };
}

function placeholderNames(message) {
  return new Set([...message.matchAll(/\$([^$]+)\$/g)].map(m => m[1]));
}

function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const baseLocale = manifest.default_locale;

  const localeFiles = readdirSync(localesDir).filter(f =>
    f.endsWith('.config')
  );

  const parsedByLocale = {};

  for (const file of localeFiles) {
    const locale = file.replace(/\.config$/, '');
    const raw = readFileSync(path.join(localesDir, file), 'utf8');

    parsedByLocale[locale] = parseLocaleConfig(raw);
  }

  const baseMessages = parsedByLocale[baseLocale]?.messages;

  if (!baseMessages) {
    console.error(
      `Base locale "${baseLocale}" (from manifest.json default_locale) has no matching ${baseLocale}.config`
    );
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Duplicate @key within a single file (silently dropped by the build).
  for (const [locale, { duplicateKeys }] of Object.entries(parsedByLocale)) {
    duplicateKeys.forEach(key =>
      errors.push(`${locale}.config: duplicate key "@${key}"`)
    );
  }

  // Keys referenced from source but missing from the base locale.
  const { usedKeys, dynamicCalls } = collectUsedKeys();

  usedKeys.forEach(key => {
    if (!(key in baseMessages)) {
      errors.push(
        `"${key}" is referenced in source but missing from ${baseLocale}.config`
      );
    }
  });

  // Per-locale: orphan keys, missing translations, placeholder mismatches.
  for (const [locale, { messages }] of Object.entries(parsedByLocale)) {
    if (locale === baseLocale) continue;

    for (const key of Object.keys(messages)) {
      if (!(key in baseMessages)) {
        errors.push(
          `${locale}.config: "@${key}" does not exist in ${baseLocale}.config`
        );
      }
    }

    for (const key of Object.keys(baseMessages)) {
      if (!(key in messages)) {
        warnings.push(`${locale}.config: missing translation for "@${key}"`);
        continue;
      }

      const basePlaceholders = placeholderNames(baseMessages[key].message);
      const localePlaceholders = placeholderNames(messages[key].message);

      const mismatch =
        basePlaceholders.size !== localePlaceholders.size ||
        [...basePlaceholders].some(p => !localePlaceholders.has(p));

      if (mismatch) {
        errors.push(
          `${locale}.config: "@${key}" placeholders [${[
            ...localePlaceholders,
          ]}] don't match ${baseLocale}.config [${[...basePlaceholders]}]`
        );
      }
    }
  }

  if (dynamicCalls.length > 0) {
    console.log(
      `Skipped ${dynamicCalls.length} dynamic (non-literal) key reference(s), not statically checkable:`
    );
    dynamicCalls.forEach(call => console.log(`  - ${call}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.error(`${errors.length} error(s):`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Locale files valid.');
}

main();
