// Builds the iOS wrapper app from safari-dist/ for the iOS Simulator, installs
// it on a booted simulator (or boots the newest iPhone) and launches it, which
// registers the extension with the simulator's Safari.

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  console.error('Safari builds need macOS with Xcode installed.');
  process.exit(1);
}

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const distDir = path.join(rootDir, 'safari-dist');
const projectPath = path.join(rootDir, 'safari/StylebotiOS/Stylebot.xcodeproj');
const bundleId = 'dev.stylebot.Stylebot';

const run = (command, args) => {
  const { status, stdout } = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'inherit'],
  });

  if (status !== 0) {
    process.exit(status ?? 1);
  }

  return stdout;
};

/**
 * The booted simulator's UDID, booting the newest available iPhone if none is.
 */
const getSimulator = () => {
  const { devices } = JSON.parse(
    run('xcrun', ['simctl', 'list', 'devices', 'available', '--json'])
  );
  const runtimes = Object.keys(devices)
    .filter(runtime => runtime.includes('iOS'))
    .sort()
    .reverse();
  const all = runtimes.flatMap(runtime => devices[runtime]);
  const booted = all.find(device => device.state === 'Booted');

  if (booted) {
    return booted.udid;
  }

  const iphone = all.find(device => device.name.startsWith('iPhone'));
  if (!iphone) {
    console.error('No iPhone simulator found; add one in Xcode.');
    process.exit(1);
  }

  run('xcrun', ['simctl', 'boot', iphone.udid]);

  return iphone.udid;
};

if (!existsSync(path.join(distDir, 'manifest.json'))) {
  console.error('safari-dist/ is missing; run yarn build:safari first.');
  process.exit(1);
}

const udid = getSimulator();
const xcodebuildArgs = [
  '-project',
  projectPath,
  '-scheme',
  'Stylebot',
  '-configuration',
  'Debug',
  '-destination',
  `platform=iOS Simulator,id=${udid}`,
];

run('xcodebuild', [...xcodebuildArgs, '-quiet', 'build']);

const settings = JSON.parse(
  run('xcodebuild', [...xcodebuildArgs, '-showBuildSettings', '-json'])
);
const app = settings.find(entry => entry.target === 'Stylebot');
const appPath = path.join(app.buildSettings.BUILT_PRODUCTS_DIR, 'Stylebot.app');

run('xcrun', ['simctl', 'install', udid, appPath]);
run('xcrun', ['simctl', 'launch', udid, bundleId]);
spawnSync('open', ['-a', 'Simulator'], { stdio: 'inherit' });

console.log(`
Stylebot is installed in the simulator. Turn it on once in its Settings app:
Apps > Safari > Extensions > Stylebot, then allow it on all websites.
`);
