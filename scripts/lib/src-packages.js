const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../../src');

// Tiers holding @stylebot/ packages, highest first; src/assets holds no code.
const TIERS = ['apps', 'features', 'ui', 'core'];

// Names kept from before their folder was renamed, so imports stay put.
const RENAMED_PACKAGES = { 'inject-css': 'apps/content' };

/**
 * Maps each @stylebot/ package name to its folder under src/, relative to it,
 * e.g. css → core/css. Every folder directly inside a tier is a package.
 */
const packageDirs = () => {
  const dirs = {};

  for (const tier of TIERS) {
    for (const entry of fs.readdirSync(path.join(SRC_DIR, tier), {
      withFileTypes: true,
    })) {
      if (entry.isDirectory()) {
        dirs[entry.name] = `${tier}/${entry.name}`;
      }
    }
  }

  return { ...dirs, ...RENAMED_PACKAGES };
};

module.exports = { SRC_DIR, TIERS, packageDirs };
