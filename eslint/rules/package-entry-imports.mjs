import path from 'node:path';
import { SRC_DIR } from '../../scripts/lib/src-packages.js';
import { packageOf, targetPackage } from './src-paths.mjs';

/**
 * Flags an import that reaches into another folder under src/, by relative
 * path or bare baseUrl path, instead of going through its @stylebot/ entry.
 */
export const packageEntryImports = {
  meta: {
    type: 'problem',
    messages: {
      usePackageEntry:
        "'{{source}}' reaches into {{target}}/; import it through its package entry.",
    },
  },
  create(context) {
    const file = context.filename;

    if (!file.startsWith(SRC_DIR + path.sep)) {
      return {};
    }

    const check = node => {
      const source = node.source?.value;

      if (typeof source !== 'string') {
        return;
      }

      const target = targetPackage(file, source);

      if (target && target !== packageOf(file)) {
        context.report({
          node,
          messageId: 'usePackageEntry',
          data: { source, target },
        });
      }
    };

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};
