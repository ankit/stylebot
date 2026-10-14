import fs from 'node:fs';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';

/**
 * Where screenshots of the stylebot.dev site go by default, git-ignored, for
 * copying into the site's repo.
 */
export const capturesDir = name => path.join(rootDir, 'captures', name);

/**
 * A directory as a capture script reports it: relative inside the repo,
 * absolute outside it.
 */
export const shownPath = dir => {
  const relative = path.relative(rootDir, dir);
  return relative.startsWith('..') ? dir : relative;
};

/**
 * A capture script's output directory, the one after --out or else the
 * default, created if it's missing; and its arguments without --out.
 */
export const takeOutput = (args, defaultDir) => {
  const index = args.indexOf('--out');
  if (index === -1) {
    fs.mkdirSync(defaultDir, { recursive: true });
    return { outDir: defaultDir, rest: args };
  }

  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    console.error('--out needs a directory');
    process.exit(1);
  }
  const outDir = path.resolve(value);
  fs.mkdirSync(outDir, { recursive: true });
  return {
    outDir,
    rest: args.filter((_, i) => i !== index && i !== index + 1),
  };
};
