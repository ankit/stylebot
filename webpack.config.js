const webpack = require('webpack');
const ejs = require('ejs');
const CopyPlugin = require('copy-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');

const config = {
  mode: process.env.NODE_ENV,
  context: __dirname + '/src',
  entry: {
    background: './background/index.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js'],
  },
  module: {
    rules: [
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
          from: 'options/index.html',
          to: 'options/index.html',
          transform: transformHtml,
        },
        {
          from: 'shared',
          to: 'shared',
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
