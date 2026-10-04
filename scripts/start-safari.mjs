// Builds the Safari wrapper app from safari-dist/ with xcodebuild and launches
// it, which registers the extension with Safari. With --watch, it waits for
// `yarn watch:safari` (running concurrently) and rebuilds the app after every
// webpack rebuild.

import { existsSync, mkdirSync, readFileSync, watch } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  console.error('Safari builds need macOS with Xcode installed.');
  process.exit(1);
}

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const distDir = path.join(rootDir, 'safari-dist');
const markerPath = path.join(distDir, '.build-complete');
const projectPath = path.join(rootDir, 'safari/Stylebot/Stylebot.xcodeproj');
const watchMode = process.argv.includes('--watch');

// Xcode's default build folder, so builds from here and from the Xcode app
// share one Stylebot.app; two copies with the same extension id leave Safari
// loading whichever one macOS registered first.
const xcodebuildArgs = [
  '-project',
  projectPath,
  '-scheme',
  'Stylebot',
  '-configuration',
  'Debug',
  '-destination',
  `platform=macOS,arch=${process.arch === 'arm64' ? 'arm64' : 'x86_64'}`,
];

const readMarker = () =>
  existsSync(markerPath) ? readFileSync(markerPath, 'utf8') : null;

/**
 * Builds the wrapper app, which copies safari-dist/ into the extension.
 * Returns whether the build succeeded.
 */
const buildApp = () => {
  const { status } = spawnSync(
    'xcodebuild',
    [...xcodebuildArgs, '-quiet', 'build'],
    { stdio: 'inherit' }
  );

  return status === 0;
};

/**
 * Path of the built Stylebot.app, as xcodebuild reports it.
 */
const getAppPath = () => {
  const { stdout } = spawnSync(
    'xcodebuild',
    [...xcodebuildArgs, '-showBuildSettings', '-json'],
    { encoding: 'utf8' }
  );
  const app = JSON.parse(stdout).find(entry => entry.target === 'Stylebot');

  return path.join(app.buildSettings.BUILT_PRODUCTS_DIR, 'Stylebot.app');
};

/**
 * Resolves once webpack writes a build marker different from `baseline`.
 */
const waitForBuild = baseline =>
  new Promise(resolve => {
    const checkNow = () => {
      if (readMarker() !== baseline) {
        watcher.close();
        resolve();
      }
    };
    const watcher = watch(distDir, (event, filename) => {
      if (filename === '.build-complete') {
        checkNow();
      }
    });
    checkNow();
  });

const launch = () => {
  spawnSync('open', [getAppPath()], { stdio: 'inherit' });
  spawnSync('open', ['-a', 'Safari'], { stdio: 'inherit' });

  console.log(`
Stylebot is installed in Safari. Two steps Safari only lets you do by hand:
  1. Develop > Allow Unsigned Extensions (resets every time Safari quits;
     turn on Settings > Advanced > "Show features for web developers" if
     there's no Develop menu)
  2. Settings > Extensions > tick Stylebot Extension and allow it on all
     websites (once)
`);
};

if (watchMode) {
  mkdirSync(distDir, { recursive: true });
  let marker = readMarker();
  await waitForBuild(marker);
  marker = readMarker();

  if (!buildApp()) {
    process.exit(1);
  }
  launch();

  for (;;) {
    await waitForBuild(marker);
    marker = readMarker();
    if (buildApp()) {
      console.log(
        'Rebuilt the Safari extension. Reload the page; if the background ' +
          'script looks stale, turn the extension off and on in Safari.'
      );
    }
  }
} else {
  if (!existsSync(path.join(distDir, 'manifest.json'))) {
    console.error('safari-dist/ is missing; run yarn build:safari first.');
    process.exit(1);
  }
  if (!buildApp()) {
    process.exit(1);
  }
  launch();
}
