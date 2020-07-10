module.exports = {
  parser: "vue-eslint-parser",

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    parser: "@typescript-eslint/parser",
  },

  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/recommended",
    "prettier",
    "prettier/@typescript-eslint",
    "prettier/vue",
  ],

  plugins: ["@typescript-eslint", "vue"],

  rules: {
    "vue/html-indent": "off",
  },

  env: {
    node: true,
    es6: true,
  },

  globals: {
    chrome: "readonly",
  },
};
