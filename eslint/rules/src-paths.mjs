import path from 'node:path';
import { SRC_DIR, TIERS } from '../../scripts/lib/src-packages.js';

const TIER_DIRS = new Set([...TIERS, 'assets']);

/**
 * The package a path under src/ belongs to: the folder inside its tier, so
 * src/core/css/x.ts is in package css.
 */
export const packageOf = file => {
  const [first, second] = path.relative(SRC_DIR, file).split(path.sep);
  return TIER_DIRS.has(first) ? second : null;
};

/**
 * The src/ package an import resolves into, or null for anything outside it.
 */
export const targetPackage = (file, source) => {
  if (source.startsWith('.')) {
    return packageOf(path.resolve(path.dirname(file), source));
  }

  const [first, second, ...rest] = source.split('/');
  return TIER_DIRS.has(first) && rest.length > 0 ? second : null;
};
