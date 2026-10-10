// Cross-checks src/assets/_locales/*.config against how message keys are referenced
// from source, and flags user-facing text written straight into components.
// Exits 1 on any error, a missing translation included.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseLocaleConfig } = require('./lib/parse-locale-config.js');
const { parseComponent, compile } = require('vue-template-compiler');

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const localesDir = path.join(rootDir, 'src/assets/_locales');
const srcDir = path.join(rootDir, 'src');
// The Safari wrapper app shows the extension's messages too.
const safariAppScript = path.join(
  rootDir,
  'safari/Stylebot/Stylebot/Resources/Script.js'
);
const manifestPath = path.join(rootDir, 'src/assets/manifest/manifest.json');

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

// Kept for use outside the extension: the store listings.
const UNREFERENCED_KEYS = new Set([
  'store_listing',
  'privacy_policy',
  'app_store_subtitle',
  'app_store_keywords',
]);

// Attributes and script properties whose value a user reads.
const TEXT_ATTRIBUTES = new Set([
  'title',
  'placeholder',
  'aria-label',
  'alt',
  'label',
]);
const TEXT_PROPERTY =
  /\b(?:label|title|text|placeholder|tooltip|ariaLabel)\s*:\s*'([A-Z][^']*)'/g;

// Literals that read the same in every language: the name, a typography
// glyph, an example domain and a CSS keyword.
const UNTRANSLATED_TEXT = new Set(['Stylebot', 'Aa', 'example.com', 'none']);

const isText = value =>
  /[A-Za-z]{2,}/.test(value) && !UNTRANSLATED_TEXT.has(value.trim());

// Returns a call's first argument text, e.g. `a ? 'x' : 'y'` for `t(a ? 'x' : 'y', [z])`.
function extractFirstArg(text, startIdx) {
  let depth = 0;

  for (let i = startIdx; i < text.length; i++) {
    const c = text[i];

    if (c === '(' || c === '[' || c === '{') {
      depth++;
    } else if (c === ')' || c === ']' || c === '}') {
      if (depth === 0) {
        return text.slice(startIdx, i);
      }
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
      if (KEY_PATTERN.test(key)) {
        staticKeys.add(key);
      }
    });
  }

  return { staticKeys, dynamicCalls };
}

function walk(dir) {
  return readdirSync(dir, { recursive: true })
    .map(entry => path.join(dir, entry))
    .filter(p => /\.(ts|vue)$/.test(p));
}

// A key built in a template literal, e.g. t(`${verb}_one_line`), as a pattern
// matching every key it can build.
function templatePatterns(text) {
  return [...text.matchAll(/\bt\(\s*`([^`]*)`/g)].map(
    ([, template]) =>
      new RegExp(
        `^${template
          .split(/\$\{[^}]*\}/)
          .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('[a-z0-9_]+')}$`
      )
  );
}

function collectUsedKeys() {
  const usedKeys = new Set();
  const dynamicCalls = [];
  // Every quoted key-like string, since keys passed through variables
  // (`labelKey: 'toggle_editor'`) are written somewhere as literals.
  const quoted = new Set();
  const patterns = [];

  for (const file of [...walk(srcDir), safariAppScript]) {
    const text = readFileSync(file, 'utf8');
    const found = findReferencedKeys(text);

    found.staticKeys.forEach(key => usedKeys.add(key));
    found.dynamicCalls.forEach(call =>
      dynamicCalls.push(`${path.relative(rootDir, file)}: ${call}`)
    );
    [...text.matchAll(/['"`]([a-z][a-z0-9_]*)['"`]/g)].forEach(m =>
      quoted.add(m[1])
    );
    patterns.push(...templatePatterns(text));
  }

  const manifest = readFileSync(manifestPath, 'utf8');

  [...manifest.matchAll(/__MSG_([a-zA-Z0-9_]+)__/g)].forEach(m =>
    usedKeys.add(m[1])
  );

  const isReferenced = key =>
    usedKeys.has(key) ||
    quoted.has(key) ||
    patterns.some(pattern => pattern.test(key));

  return { usedKeys, dynamicCalls, isReferenced };
}

// Text in a component template that skips t(): static text between tags,
// and static attributes a user reads.
function templateText(template) {
  const found = [];
  const { ast } = compile(template, { whitespace: 'condense' });

  const visit = node => {
    if (!node) {
      return;
    }

    if (node.type === 3 && !node.isComment && isText(node.text)) {
      found.push(node.text.trim());
    }

    if (node.type === 2) {
      node.tokens
        .filter(token => typeof token === 'string' && isText(token))
        .forEach(token => found.push(token.trim()));
    }

    if (node.type === 1) {
      node.attrsList
        .filter(attr => TEXT_ATTRIBUTES.has(attr.name) && isText(attr.value))
        .forEach(attr => found.push(`${attr.name}="${attr.value}"`));
      node.children.forEach(visit);
      (node.ifConditions ?? [])
        .filter(condition => condition.block !== node)
        .forEach(condition => visit(condition.block));
      Object.values(node.scopedSlots ?? {}).forEach(visit);
    }
  };

  visit(ast);

  return found;
}

function collectHardcodedText() {
  const found = [];

  for (const file of walk(srcDir).filter(p => p.endsWith('.vue'))) {
    const { template, script } = parseComponent(readFileSync(file, 'utf8'));
    const relative = path.relative(rootDir, file);

    if (template) {
      templateText(template.content).forEach(text =>
        found.push(`${relative}: ${text}`)
      );
    }

    if (script) {
      [...script.content.matchAll(TEXT_PROPERTY)]
        .filter(([, value]) => isText(value))
        .forEach(([match]) => found.push(`${relative}: ${match}`));
    }
  }

  return found;
}

function placeholderNames(message) {
  return new Set([...message.matchAll(/\$([^$]+)\$/g)].map(m => m[1]));
}

// Strings that read the same as English in any language: names and codes.
const SAME_IN_EVERY_LANGUAGE = new Set([
  'language_code',
  'github',
  'google_drive',
  'x_and_y',
  'image_size_kb',
  'editor_window_title',
]);

/**
 * `yarn validate-locales --audit <locale>`: what a reviewer of that locale
 * should look at first. Reports only; whether a match is right is a call
 * for someone who knows the language.
 */
function audit(locale, parsedByLocale, baseLocale) {
  const base = parsedByLocale[baseLocale].messages;
  const messages = parsedByLocale[locale]?.messages;

  if (!messages) {
    console.error(`No ${locale}.config`);
    process.exit(1);
  }

  const raw = readFileSync(path.join(localesDir, `${locale}.config`), 'utf8');
  const report = (title, lines) => {
    console.log(`${title} (${lines.length})`);
    lines.forEach(line => console.log(`  - ${line}`));
    console.log('');
  };

  report(
    'Same as English: a loanword, or untranslated?',
    Object.entries(messages)
      .filter(
        ([key, { message }]) =>
          !SAME_IN_EVERY_LANGUAGE.has(key) &&
          message === base[key]?.message &&
          /[A-Za-z]{3}/.test(message)
      )
      .map(([key, { message }]) => `${key}: ${message.slice(0, 60)}`)
  );
  report(
    'Three dots instead of an ellipsis (…)',
    Object.entries(messages)
      .filter(([, { message }]) => message.includes('...'))
      .map(([key]) => key)
  );
  report(
    'Trailing or doubled spaces',
    raw
      .split('\n')
      .map((line, index) => [line, index + 1])
      .filter(([line]) => line !== line.trimEnd() || / {2}/.test(line.trim()))
      .map(([line, number]) => `line ${number}: ${line.trim().slice(0, 50)}`)
  );
  report(
    'Short labels over twice the English length (check their controls)',
    Object.entries(messages)
      .filter(([key, { message }]) => {
        const english = base[key]?.message ?? '';
        return english.length <= 15 && message.length > english.length * 2 + 4;
      })
      .map(([key, { message }]) => `${key}: ${base[key].message} → ${message}`)
  );
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

  const auditIndex = process.argv.indexOf('--audit');

  if (auditIndex > -1) {
    audit(process.argv[auditIndex + 1], parsedByLocale, baseLocale);
    return;
  }

  const baseMessages = parsedByLocale[baseLocale]?.messages;

  if (!baseMessages) {
    console.error(
      `Base locale "${baseLocale}" (from manifest.json default_locale) has no matching ${baseLocale}.config`
    );
    process.exit(1);
  }

  const errors = [];

  // Duplicate @key within a single file (silently dropped by the build).
  for (const [locale, { duplicateKeys }] of Object.entries(parsedByLocale)) {
    duplicateKeys.forEach(key =>
      errors.push(`${locale}.config: duplicate key "@${key}"`)
    );
  }

  // Keys referenced from source but missing from the base locale.
  const { usedKeys, dynamicCalls, isReferenced } = collectUsedKeys();

  usedKeys.forEach(key => {
    if (!(key in baseMessages)) {
      errors.push(
        `"${key}" is referenced in source but missing from ${baseLocale}.config`
      );
    }
  });

  // Keys nothing references, which would otherwise linger untranslated.
  Object.keys(baseMessages)
    .filter(key => !UNREFERENCED_KEYS.has(key) && !isReferenced(key))
    .forEach(key =>
      errors.push(`"${key}" in ${baseLocale}.config is never referenced`)
    );

  // User-facing text written into a component instead of a locale.
  collectHardcodedText().forEach(text =>
    errors.push(`hardcoded text, use t(): ${text}`)
  );

  // Per-locale: orphan keys, missing translations, placeholder mismatches.
  for (const [locale, { messages }] of Object.entries(parsedByLocale)) {
    if (locale === baseLocale) {
      continue;
    }

    for (const key of Object.keys(messages)) {
      if (!(key in baseMessages)) {
        errors.push(
          `${locale}.config: "@${key}" does not exist in ${baseLocale}.config`
        );
      }
    }

    for (const key of Object.keys(baseMessages)) {
      if (!(key in messages)) {
        errors.push(`${locale}.config: missing translation for "@${key}"`);
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

  if (errors.length > 0) {
    console.error(`${errors.length} error(s):`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('Locale files valid.');
}

main();
