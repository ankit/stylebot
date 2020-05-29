const ejs = require('ejs');
const webpack = require('webpack');

const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const { VueLoaderPlugin } = require('vue-loader');
const ExtensionReloader = require('webpack-extension-reloader');

const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  entry: {
    background: './background/index.js',
    'browseraction/index': './browseraction/index.ts',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
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
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      global: 'window',
    }),
    new VueLoaderPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'editor',
          to: 'editor',
        },
        {
          from: 'images',
          to: 'images',
        },
        {
          from: 'libs',
          to: 'libs',
        },
        {
          from: 'notification',
          to: 'notification',
        },
        {
          from: 'shared',
          to: 'shared',
        },
        {
          from: 'options/index.html',
          to: 'options/index.html',
          transform: transformHtml,
        },
        {
          from: 'browseraction/index.html',
          to: 'browseraction/index.html',
          transform: transformHtml,
        },
        {
          from: 'manifest.json',
          to: 'manifest.json',
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
      manifest: __dirname + '/src/manifest.json',
    }),
  ]);
}

function transformHtml(content) {
  return ejs.render(content.toString(), {
    ...process.env,
  });
}

module.exports = config;
