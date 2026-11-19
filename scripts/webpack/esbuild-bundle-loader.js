const esbuild = require('esbuild');
const path = require('path');

/**
 * Bundles a module and its npm dependencies with esbuild, for packages that
 * Webpack 4 can't take itself: it resolves `exports` maps and lowers syntax
 * newer than Webpack 4's parser reads.
 */
module.exports = function esbuildBundleLoader() {
  const callback = this.async();

  esbuild
    .build({
      entryPoints: [this.resourcePath],
      bundle: true,
      write: false,
      format: 'esm',
      target: 'es2019',
      platform: 'browser',
      metafile: true,
      logLevel: 'silent',
    })
    .then(result => {
      Object.keys(result.metafile.inputs).forEach(input =>
        this.addDependency(path.resolve(input))
      );
      callback(null, result.outputFiles[0].text);
    }, callback);
};
