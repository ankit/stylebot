# `options`

This package includes code for the stylebot options page.

- **`components`**: Vue components for rendering the options page

- **`store`**: [Vuex](https://vuex.vuejs.org/) store to manage options page state

- **`router`**: [vue-router](https://v3.router.vuejs.org/) hash routes — `#/basics`, `#/styles`, `#/styles/edit?url=…`, `#/sync`. `createRouter('abstract')` is for Storybook and Jest

- **`utils`**: Utility methods including methods to send messages to extension background page

- **`index`**: Entry point for build. Does not export anything to be consumed by any other packages.
