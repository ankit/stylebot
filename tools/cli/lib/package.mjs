/**
 * Where the CLI's own files are, and its version. Kept apart because Jest
 * runs these modules as CommonJS, which has no import.meta.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

export const CLI_VERSION = JSON.parse(
  fs.readFileSync(path.join(LIB_DIR, '..', 'package.json'), 'utf8')
).version;
