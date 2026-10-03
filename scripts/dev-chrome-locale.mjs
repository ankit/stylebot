// `yarn dev:chrome:locale <locale>`: `yarn dev:chrome` with the browser, and so
// the extension, in another language, e.g. `yarn dev:chrome:locale vi`.

import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const localesDir = path.join(rootDir, 'src/assets/_locales');
const locale = process.argv[2];

if (!locale || !existsSync(path.join(localesDir, `${locale}.config`))) {
  const available = readdirSync(localesDir)
    .filter(file => file.endsWith('.config'))
    .map(file => file.replace(/\.config$/, ''));

  console.error(
    `Usage: yarn dev:chrome:locale <locale>\nLocales: ${available.join(', ')}`
  );
  process.exit(1);
}

spawn('yarn', ['dev:chrome'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, STYLEBOT_LOCALE: locale },
}).on('exit', code => process.exit(code ?? 0));
