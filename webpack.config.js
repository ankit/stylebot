const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const webpack = require('webpack');

const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const { buildManifest, supportsCLI } = require('./scripts/lib/build-manifest');
const { parseLocaleConfig } = require('./scripts/lib/parse-locale-config');
const { SRC_DIR, packageDirs } = require('./scripts/lib/src-packages');

const isPreview = process.env.STYLEBOT_PREVIEW === '1';
const isCLISupported = supportsCLI(process.env.BROWSER);
// Lets app code check for the CLI, and minifying drops it where it's false.
const cliDefinitions = {
  'process.env.STYLEBOT_CLI': JSON.stringify(String(isCLISupported)),
};

// Safari's Drive sign-in can't exchange codes without it, so a release
// built without it would ship with sign-in broken.
if (
  process.env.BROWSER === 'safari' &&
  !process.env.STYLEBOT_GOOGLE_CLIENT_SECRET
) {
  const message =
    'STYLEBOT_GOOGLE_CLIENT_SECRET is not set; Google Drive sign-in will fail in this Safari build.';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }
  console.warn(`Warning: ${message}`);
}

const getOutputPath = () => {
  if (isPreview) {
    return `${__dirname}/preview-dist`;
  }

  return process.env.BROWSER
    ? `${__dirname}/${process.env.BROWSER}-dist`
    : `${__dirname}/dist`;
};

// Writes a marker once every compiler has built successfully, so tools like
// scripts/launch-chrome.mjs never see it before manifest.json exists.
const compilersDone = {};

class WriteBuildMarkerPlugin {
  constructor(compilerKey) {
    this.compilerKey = compilerKey;
  }

  apply(compiler) {
    compilersDone[this.compilerKey] = false;

    compiler.hooks.done.tap('WriteBuildMarkerPlugin', stats => {
      if (stats.hasErrors()) {
        return;
      }

      compilersDone[this.compilerKey] = true;

      if (!Object.values(compilersDone).every(Boolean)) {
        return;
      }

      fs.writeFileSync(
        path.join(getOutputPath(), '.build-complete'),
        String(Date.now())
      );
    });
  }
}

const config = {
  stats: 'errors-only',
  mode: process.env.NODE_ENV,
  context: `${__dirname}/src`,
  // Inline sourcemaps in production bloat every content script (see #890).
  devtool: process.env.NODE_ENV === 'production' ? false : 'inline-source-map',

  optimization: {
    // On in development too (webpack enables it only in production), so a
    // side-effect-only import missing from package.json breaks in dev:chrome.
    sideEffects: true,
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        parallel: true,
        // The monaco-editor package under min/vs is copied in pre-minified
        // (see CopyPlugin below) and uses syntax newer than this project's
        // pinned Terser can parse, so re-minifying it just breaks the build.
        exclude: /monaco-editor\/iframe\/node_modules\/monaco-editor/,
        terserOptions: {
          ecma: 6,
          output: {
            ascii_only: true,
          },
        },
      }),
    ],
  },

  output: {
    publicPath: '/',
    filename: '[name].js',
    path: getOutputPath(),
  },

  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: Object.fromEntries(
      Object.entries(packageDirs()).map(([name, dir]) => [
        `@stylebot/${name}`,
        path.join(SRC_DIR, dir, 'index'),
      ])
    ),
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        resourceQuery: /type=style/,
        sideEffects: true,
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.((c|sa|sc)ss)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { importLoaders: 2 },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: () => [
                require('cssnano')({
                  preset: 'default',
                }),
                require('postcss-rem-to-pixel')({
                  propList: ['*'],
                }),
              ],
            },
          },
          {
            loader: 'sass-loader',
            options: {
              prependData: `@import "mixins";`,
              sassOptions: {
                includePaths: [path.resolve(__dirname, 'src/ui/scss')],
              },
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new ProgressBarPlugin(),
    new WriteBuildMarkerPlugin('client'),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'assets/icon/*.png',
          to: 'img/[name].[ext]',
        },
        {
          from: 'assets/fonts',
          to: 'fonts',
        },
        {
          from: 'features/google-fonts/fonts.json',
          to: 'google-fonts/fonts.json',
        },
        {
          from: 'apps/options/index.html',
          to: 'options.html',
          transform: transformHtml,
        },
        {
          from: 'apps/popup/index.html',
          to: 'popup/index.html',
          transform: transformHtml,
        },
        {
          from: 'apps/options/google-sign-in/index.html',
          to: 'google-sign-in/index.html',
          transform: transformHtml,
        },
        {
          from: 'apps/editor/window/index.html',
          to: 'editor-window/index.html',
          transform: transformHtml,
        },
        {
          from: 'apps/editor/window/appearance-init.js',
          to: 'editor-window/appearance-init.js',
        },
        {
          from: 'apps/monaco-iframe/index.html',
          to: 'monaco-editor/iframe/index.html',
          transform: transformHtml,
        },
        {
          from: 'apps/monaco-iframe/options-index.html',
          to: 'monaco-editor/iframe/options-index.html',
          transform: transformHtml,
        },
        {
          from: 'apps/monaco-iframe/theme-init.js',
          to: 'monaco-editor/iframe/theme-init.js',
        },
        {
          from: '../node_modules/monaco-editor/min/**/*',
          to: 'monaco-editor/iframe/monaco-editor/',
        },
        {
          from: '../node_modules/requirejs/**/*',
          to: 'monaco-editor/iframe/requirejs',
        },
        {
          from: 'assets/_locales/*.config',
          to: '_locales/[name]/messages.json',

          transform: raw => {
            const { messages } = parseLocaleConfig(raw.toString());

            return JSON.stringify(messages, null, 2);
          },
        },
        {
          from: 'assets/manifest/manifest.json',
          to: 'manifest.json',

          transform: content =>
            JSON.stringify(
              buildManifest(JSON.parse(content), {
                browser: process.env.BROWSER,
                nodeEnv: process.env.NODE_ENV,
                preview: isPreview,
              }),
              null,
              2
            ),
        },
        // The Safari Xcode project reads its app and extension version from here.
        ...(process.env.BROWSER === 'safari'
          ? [
              {
                from: 'assets/manifest/manifest.json',
                to: 'Version.xcconfig',
                transform: content => {
                  const { version } = JSON.parse(content);
                  return `MARKETING_VERSION = ${version}\nCURRENT_PROJECT_VERSION = ${version}\n`;
                },
              },
            ]
          : []),
      ],
    }),
  ],
};

if (config.mode === 'production') {
  config.plugins = (config.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
  ]);
}

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

const backgroundPageConfig = {
  ...config,
  entry: {
    'background/index': './apps/background/index.ts',
  },
  plugins: [
    new WriteBuildMarkerPlugin('background'),
    new webpack.DefinePlugin({
      global: 'this',
      ...cliDefinitions,
      // Safari's Google sign-in client secret, kept out of the repo.
      'process.env.STYLEBOT_GOOGLE_CLIENT_SECRET': JSON.stringify(
        process.env.STYLEBOT_GOOGLE_CLIENT_SECRET ?? ''
      ),
    }),
  ],
};

const clientConfig = {
  ...config,
  entry: {
    'popup/index': './apps/popup/index.ts',
    'editor/index': './apps/editor/content-script.ts',
    'editor/app': './apps/editor/app.ts',
    options: './apps/options/index.ts',
    'google-sign-in/index': './apps/options/google-sign-in/index.ts',
    'editor-window/index': './apps/editor/window/index.ts',
    'inject-css/index': './apps/content/content-script.ts',
    'monaco-editor/iframe/index': './apps/monaco-iframe/index.ts',
    'monaco-editor/iframe/options-index':
      './apps/monaco-iframe/options-index.ts',
    'readability/reader': './apps/reader/reader.ts',
    // The CLI's page inspector, loaded on demand.
    ...(isCLISupported && {
      'editor/inspector': './apps/editor/inspector.ts',
    }),
  },
  // Webpack's `global` shim falls back to `new Function` in the bundles loaded
  // with import(), which a strict page CSP blocks and reports as an issue.
  node: { global: false },
  plugins: [
    ...config.plugins,
    new webpack.DefinePlugin({
      global: 'globalThis',
      ...cliDefinitions,
    }),
  ],
};

module.exports = [backgroundPageConfig, clientConfig];
