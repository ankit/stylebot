import { packageEntryImports } from './rules/package-entry-imports.mjs';
import { tierImports } from './rules/tier-imports.mjs';

export const stylebotPlugin = {
  rules: {
    'package-entry-imports': packageEntryImports,
    'tier-imports': tierImports,
  },
};
