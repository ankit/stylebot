import path from 'node:path';
import { SRC_DIR, packageDirs } from '../../scripts/lib/src-packages.js';
import { packageOf } from './src-paths.mjs';

const PACKAGE_DIRS = packageDirs();

// The tiers each tier may import from, besides its own package.
const ALLOWED_TIERS = {
  apps: ['features', 'ui', 'core'],
  features: ['ui', 'core'],
  ui: ['ui', 'core'],
  core: ['core'],
};

// Imports that broke the direction when it was introduced; remove, don't add.
const TIER_ALLOWLIST = new Set([
  'editor -> inject-css',
  'page-bridge -> highlighter',
  'page-bridge -> readability',
]);

/**
 * Flags a @stylebot/ import that points up or across the src/ tiers: apps use
 * features, ui and core; features use ui and core; ui uses core.
 */
export const tierImports = {
  meta: {
    type: 'problem',
    messages: {
      upward:
        "{{from}} is in {{fromTier}}/ and can't import '{{source}}' from {{targetTier}}/; imports only point down the src/ tiers.",
    },
  },
  create(context) {
    const file = context.filename;
    const fromTier = path.relative(SRC_DIR, file).split(path.sep)[0];
    const from = packageOf(file);

    if (!ALLOWED_TIERS[fromTier]) {
      return {};
    }

    const check = node => {
      const source = node.source?.value;

      if (typeof source !== 'string' || !source.startsWith('@stylebot/')) {
        return;
      }

      const name = source.split('/')[1];
      const dir = PACKAGE_DIRS[name];

      if (!dir) {
        return;
      }

      const [targetTier, target] = dir.split('/');

      if (
        target === from ||
        ALLOWED_TIERS[fromTier].includes(targetTier) ||
        TIER_ALLOWLIST.has(`${from} -> ${name}`)
      ) {
        return;
      }

      context.report({
        node,
        messageId: 'upward',
        data: { from, fromTier, source, targetTier },
      });
    };

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};
