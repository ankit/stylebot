/**
 * Brings every translated catalog in line with the English one after English
 * changes: new keys and keys whose English changed get the English text as a
 * placeholder, removed keys go, and unchanged keys keep their translation.
 * Prints the changed keys, the list to translate next.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATALOGS = { site: 'SiteMessages', demo: 'DemoMessages' } as const;
type Catalog = keyof typeof CATALOGS;

const USAGE = `Usage: node scripts/migrate-messages.ts [--from <git ref>] [--rename <catalog>:<new.path>=<old.path>]...

  --from    the commit whose English the translations match (default HEAD)
  --rename  a key that moved with its English unchanged, e.g.
            --rename demo:editor.newProfile=chat.looks.newspaper.profile`;

const siteDir = fileURLToPath(new URL('..', import.meta.url));
const i18n = join(siteDir, 'src/i18n');

let from = 'HEAD';
const renames: [Catalog, string, string][] = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from') from = args[++i];
  else if (args[i] === '--rename') {
    const [, catalog, to, old] =
      /^(site|demo):([\w.]+)=([\w.]+)$/.exec(args[++i] ?? '') ?? [];
    if (!catalog) throw new Error(USAGE);
    renames.push([catalog as Catalog, to, old]);
  } else {
    console.error(USAGE);
    process.exit(1);
  }
}

const scratch = mkdtempSync(join(tmpdir(), 'stylebot-messages-'));

/**
 * A catalog as it was at the --from commit, or undefined if it didn't exist.
 */
async function loadAt(locale: string, catalog: Catalog) {
  let source: string;
  try {
    source = execFileSync(
      'git',
      ['show', `${from}:./src/i18n/${locale}/${catalog}.ts`],
      { cwd: siteDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
  } catch {
    return undefined;
  }
  const file = join(scratch, `${locale}-${catalog}.ts`);
  writeFileSync(file, source.replace(/^import type .*$/m, ''));
  return (await import(file)).default;
}

const loadNow = async (locale: string, catalog: Catalog) =>
  (await import(join(i18n, locale, `${catalog}.ts`))).default;

const get = (value: unknown, path: string) =>
  path
    .split('.')
    .reduce<any>((v, key) => (v == null ? undefined : v[key]), value);

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a)?.replace(/’/g, "'") ===
  JSON.stringify(b)?.replace(/’/g, "'");

/**
 * The key a value was at before a --rename, for looking it up at --from.
 */
const source = (catalog: Catalog, path: string) => {
  for (const [c, to, old] of renames) {
    if (c !== catalog) continue;
    if (path === to || path.startsWith(`${to}.`))
      return old + path.slice(to.length);
  }
  return path;
};

/**
 * Serializes a catalog value as a TypeScript literal; prettier tidies it after.
 */
function serialize(value: unknown, depth: number): string {
  const pad = '  '.repeat(depth + 1);
  const end = '  '.repeat(depth);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[\n${value.map((v) => pad + serialize(v, depth + 1)).join(',\n')},\n${end}]`;
  }
  const entries = Object.entries(value as object).map(
    ([key, v]) =>
      `${pad}${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${serialize(v, depth + 1)}`,
  );
  return `{\n${entries.join(',\n')},\n${end}}`;
}

const locales = readdirSync(i18n, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== 'en')
  .map((e) => e.name);

const changed = new Set<string>();
const written: string[] = [];

for (const catalog of Object.keys(CATALOGS) as Catalog[]) {
  const oldEnglish = await loadAt('en', catalog);
  const english = await loadNow('en', catalog);
  if (!oldEnglish) throw new Error(`No English ${catalog} catalog at ${from}`);

  for (const locale of locales) {
    const current = await loadNow(locale, catalog);
    const atFrom = (await loadAt(locale, catalog)) ?? current;

    /**
     * The value for one key: the current translation if its English is
     * unchanged or someone has updated it since --from, else the English.
     */
    const build = (en: unknown, path: string): unknown => {
      if (typeof en === 'string' || Array.isArray(en)) {
        const old = source(catalog, path);
        const now = get(current, path);
        if (now !== undefined && !same(now, get(atFrom, old))) {
          if (same(now, en) && !same(get(oldEnglish, old), en)) {
            changed.add(`${catalog}:${path}`);
          }
          return now;
        }
        const translation = get(atFrom, old);
        if (translation !== undefined && same(get(oldEnglish, old), en)) {
          return translation;
        }
        changed.add(`${catalog}:${path}`);
        const before = get(oldEnglish, old);
        if (
          Array.isArray(en) &&
          Array.isArray(before) &&
          Array.isArray(translation) &&
          before.length === en.length &&
          translation.length === en.length
        ) {
          return en.map((item, i) =>
            same(item, before[i]) ? translation[i] : item,
          );
        }
        return en;
      }
      return Object.fromEntries(
        Object.entries(en as object).map(([key, child]) => [
          key,
          build(child, path ? `${path}.${key}` : key),
        ]),
      );
    };

    const next = build(english, '');
    if (same(next, current)) continue;
    const file = join(i18n, locale, `${catalog}.ts`);
    writeFileSync(
      file,
      `import type { ${CATALOGS[catalog]} } from '..';\n\nconst ${catalog}: ${CATALOGS[catalog]} = ${serialize(next, 0)};\n\nexport default ${catalog};\n`,
    );
    written.push(file);
  }
}

if (written.length) {
  execFileSync('npx', ['prettier', '--write', ...written], {
    cwd: siteDir,
    stdio: 'ignore',
  });
}

console.log(
  changed.size
    ? `Updated ${written.length} files. To translate:\n${[...changed].join('\n')}`
    : 'Every translation is in line with English.',
);
