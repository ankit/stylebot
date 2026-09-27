import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { SRC_DIR, TIERS, packageDirs } from './scripts/lib/src-packages.js';

const TIER_DIRS = new Set([...TIERS, 'assets']);

/**
 * The package a path under src/ belongs to: the folder inside its tier, so
 * src/core/css/x.ts is in package css.
 */
const packageOf = file => {
  const [first, second] = path.relative(SRC_DIR, file).split(path.sep);
  return TIER_DIRS.has(first) ? second : null;
};

/**
 * The src/ package an import resolves into, or null for anything outside it.
 */
const targetPackage = (file, source) => {
  if (source.startsWith('.')) {
    return packageOf(path.resolve(path.dirname(file), source));
  }

  const [first, second, ...rest] = source.split('/');
  return TIER_DIRS.has(first) && rest.length > 0 ? second : null;
};

/**
 * Flags an import that reaches into another folder under src/, by relative
 * path or bare baseUrl path, instead of going through its @stylebot/ entry.
 */
const packageEntryImports = {
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
const tierImports = {
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

const stylebotPlugin = {
  rules: {
    'package-entry-imports': packageEntryImports,
    'tier-imports': tierImports,
  },
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'firefox-dist',
      'preview-dist',
      'coverage',
      'test-results',
      'playwright-report',
      'storybook-static',
      'junit.xml',
      'patches',
      '.chrome-dev-profile',
      '.edge-dev-profile',
      '.history',
      '.claude',

      // Separate Gatsby project with its own toolchain.
      'site',
    ],
  },

  { files: ['**/*.{js,mjs,ts,vue}'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/vue2-recommended'],
  prettier,

  {
    plugins: { jsdoc },

    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly',
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },

    rules: {
      'vue/html-indent': 'off',

      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-else-return': 'error',
      'no-nested-ternary': 'error',

      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions'] },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Existing single-word component names predate this rule.
      'vue/multi-word-component-names': 'off',
      // The color components mutate their `value` prop; fixing that is a
      // behavior change tracked separately.
      'vue/no-mutating-props': 'warn',

      'jsdoc/multiline-blocks': [
        'error',
        {
          noSingleLineBlocks: true,
          noZeroLineText: true,
          noFinalLineText: true,
        },
      ],
      'jsdoc/no-restricted-syntax': [
        'error',
        {
          contexts: [
            {
              comment: 'JsdocBlock:has(JsdocTag)',
              context: 'any',
              message:
                'JSDoc @ tags are not allowed; describe the function in prose and let the TypeScript signature document params and return types.',
            },
          ],
        },
      ],

      'vue/component-name-in-template-casing': [
        'error',
        'kebab-case',
        { registeredComponentsOnly: true },
      ],
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
    },
  },

  {
    // Typed linting only for what tsconfig covers; e2e and scripts are
    // transpiled by esbuild/node directly and have no project.
    files: ['src/**/*.{ts,vue}', '*.d.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  },

  {
    // Stories and Storybook config are typed against their own tsconfig,
    // since the root one excludes them from the extension build.
    files: ['src/**/*.stories.ts', '.storybook/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: '.storybook/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    // Packages use each other only through their @stylebot/ entries, so their
    // internals can change freely; sideEffects keeps entries free to import.
    files: ['src/**/*.{ts,vue}'],
    ignores: ['**/*.test.ts', '**/*.stories.ts'],
    plugins: { stylebot: stylebotPlugin },
    rules: { 'stylebot/package-entry-imports': 'error' },
  },

  {
    // Tests and stories too: they may mock or render a lower tier, never a higher one.
    files: ['src/**/*.{ts,vue}'],
    plugins: { stylebot: stylebotPlugin },
    rules: { 'stylebot/tier-imports': 'error' },
  },

  {
    // Tests re-require modules after jest.resetModules().
    files: ['**/*.test.ts'],
    languageOptions: { globals: globals.jest },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    files: ['*.js', 'jest/**/*.js', 'scripts/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    // Playwright fixtures declare unused dependencies as `({}, use)`.
    files: ['e2e/**'],
    rules: {
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },

  {
    // createRequire() is the ESM-correct way to load these CommonJS helpers.
    files: ['scripts/**/*.mjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  }
);
