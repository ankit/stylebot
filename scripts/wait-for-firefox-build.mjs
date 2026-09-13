// Blocks until `yarn watch:firefox` (running concurrently) finishes its
// first build, so `web-ext run` never sees firefox-dist/ before
// manifest.json exists.

import { existsSync, mkdirSync, readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(rootDir, 'firefox-dist');
const markerPath = path.join(outputPath, '.build-complete');

const readMarker = () => (existsSync(markerPath) ? readFileSync(markerPath, 'utf8') : null);

// fs.watch throws ENOENT if the directory doesn't exist yet, which is the
// case on a fresh checkout before `yarn watch:firefox` has run once.
mkdirSync(outputPath, { recursive: true });

const baseline = readMarker();

await new Promise((resolve) => {
  const checkNow = () => {
    if (readMarker() !== baseline) {
      watcher.close();
      resolve();
    }
  };
  const watcher = watch(outputPath, (event, filename) => {
    if (filename === '.build-complete') {
      checkNow();
    }
  });
  checkNow(); // in case it changed before the watcher attached
});
