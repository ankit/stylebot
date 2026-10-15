// The stylebot.dev gallery's themes, read from a checkout of the site's repo,
// stylebot-site, which keeps them as src/assets/gallery/<site>/<theme>.css.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { rootDir } from '../lib/cli.mjs';

/**
 * The folder holding this repo's main checkout, so a worktree finds the same
 * sibling stylebot-site as the checkout it was made from.
 */
const checkoutsDir = () => {
  try {
    const commonDir = execFileSync(
      'git',
      ['rev-parse', '--path-format=absolute', '--git-common-dir'],
      { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return path.dirname(path.dirname(commonDir));
  } catch {
    return path.dirname(rootDir);
  }
};

export const defaultThemesDir = () =>
  path.join(checkoutsDir(), 'stylebot-site', 'src', 'assets', 'gallery');

/**
 * The gallery folder after --themes or else the sibling stylebot-site's,
 * ending the process if it's missing; and the arguments without --themes.
 */
export const takeThemes = args => {
  const index = args.indexOf('--themes');
  if (index !== -1 && (!args[index + 1] || args[index + 1].startsWith('--'))) {
    console.error('--themes needs a directory');
    process.exit(1);
  }

  const themesDir =
    index === -1 ? defaultThemesDir() : path.resolve(args[index + 1]);
  if (!fs.existsSync(themesDir)) {
    console.error(
      `No gallery themes at ${themesDir}.\nClone github.com/ankit/stylebot-site beside this repo, or pass --themes <site>/src/assets/gallery.`
    );
    process.exit(1);
  }

  return {
    themesDir,
    rest:
      index === -1
        ? args
        : args.filter((_, i) => i !== index && i !== index + 1),
  };
};

let sharedThemesDir;

/**
 * A gallery theme's CSS from the sibling stylebot-site checkout.
 */
export const gallery = (site, name) => {
  sharedThemesDir ??= takeThemes([]).themesDir;
  return fs.readFileSync(
    path.join(sharedThemesDir, site, `${name}.css`),
    'utf8'
  );
};
