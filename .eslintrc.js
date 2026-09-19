module.exports = {
  root: true,
  parser: 'vue-eslint-parser',

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    parser: '@typescript-eslint/parser',
  },

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/vue',
  ],

  plugins: ['@typescript-eslint', 'vue', 'jsdoc'],

  rules: {
    'vue/html-indent': 'off',

    curly: ['error', 'all'],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-else-return': 'error',

    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/prefer-optional-chain': 'error',

    'jsdoc/multiline-blocks': [
      'error',
      { noSingleLineBlocks: true, noZeroLineText: true, noFinalLineText: true },
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
    'vue/component-tags-order': [
      'error',
      { order: ['template', 'script', 'style'] },
    ],
  },

  env: {
    node: true,
    es6: true,
  },

  globals: {
    chrome: 'readonly',
  },

  overrides: [
    {
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.spec.ts'],
      env: { jest: true },
    },
    {
      // createRequire() is the ESM-correct way to load these CommonJS helpers.
      files: ['scripts/**/*.mjs'],
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
};
