/* eslint-disable @typescript-eslint/no-var-requires */
const ejs = require('ejs');
const path = require('path');
const webpack = require('webpack');

const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  stats: 'errors-only',

  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 6,
          output: {
            ascii_only: true,
          },
        },
      }),
    ],
  },

  entry: {
    'sync/index': './sync/index.ts',
    'popup/index': './popup/index.ts',
    'editor/index': './editor/index.ts',
    'options/index': './options/index.ts',
    'background/index': './background/index.ts',
    'inject-css/index': './inject-css/index.ts',
    'monaco-editor/iframe/index': './monaco-editor/iframe/index.ts',
    'readability/index': './readability/index.ts',
  },

  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    publicPath: '/',
  },

  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      '@stylebot/css': path.resolve(__dirname, './src/css/index'),
      '@stylebot/i18n': path.resolve(__dirname, './src/i18n/index'),
      '@stylebot/sync': path.resolve(__dirname, './src/sync/index'),
      '@stylebot/types': path.resolve(__dirname, './src/types/index'),
      '@stylebot/utils': path.resolve(__dirname, './src/utils/index'),
      '@stylebot/dark-mode': path.resolve(__dirname, './src/dark-mode/index'),
      '@stylebot/settings': path.resolve(__dirname, './src/settings/index'),

      '@stylebot/readability': path.resolve(
        __dirname,
        './src/readability/index'
      ),

      '@stylebot/highlighter': path.resolve(
        __dirname,
        './src/highlighter/index'
      ),

      '@stylebot/monaco-editor': path.resolve(
        __dirname,
        './src/monaco-editor/index'
      ),
    },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
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
          'sass-loader',
        ],
      },
    ],
  },

  plugins: [
    new ProgressBarPlugin(),
    new webpack.DefinePlugin({
      global: 'window',
    }),
    new VueLoaderPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: '../tsconfig.json',
        extensions: {
          vue: true,
        },
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'extension/img',
          to: 'img',
        },
        {
          from: 'options/index.html',
          to: 'options/index.html',
          transform: transformHtml,
        },
        {
          from: 'popup/index.html',
          to: 'popup/index.html',
          transform: transformHtml,
        },
        {
          from: 'monaco-editor/iframe/index.html',
          to: 'monaco-editor/iframe/index.html',
          transform: transformHtml,
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
          from: '_locales/*.config',
          to: '_locales/[name]/messages.json',

          transform: raw => {
            const content = raw.toString().replace(/^#.*?$/gm, '');
            const messages = {};
            const regex = /@([a-z0-9_]+)/gi;

            let match;

            while ((match = regex.exec(content))) {
              const messageName = match[1];
              const messageStart = match.index + match[0].length;

              let messageEnd = content.indexOf('@', messageStart);

              if (messageEnd < 0) {
                messageEnd = content.length;
              }

              const message = content
                .substring(messageStart, messageEnd)
                .trim();

              messages[messageName] = {
                message,
              };

              const placeholderMatches = [...message.matchAll(/\$([^$]+)\$/g)];

              if (placeholderMatches.length > 0) {
                messages[messageName].placeholders = {};

                placeholderMatches.forEach(m => {
                  messages[messageName].placeholders[m[1]] = {
                    content: '$1',
                  };
                });
              }
            }

            return JSON.stringify(messages, null, 2);
          },
        },
        {
          from: 'extension/manifest.json',
          to: 'manifest.json',

          transform: content => {
            const jsonContent = JSON.parse(content);

            if (config.mode === 'development') {
              jsonContent['content_security_policy'] =
                "script-src 'self' 'unsafe-eval'; object-src 'self'";
            }

            return JSON.stringify(jsonContent, null, 2);
          },
        },
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

if (process.env.HMR === 'true') {
  config.plugins = (config.plugins || []).concat([
    new ExtensionReloader({
      manifest: __dirname + '/src/extension/manifest.json',
    }),
  ]);
}

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

module.exports = config;
