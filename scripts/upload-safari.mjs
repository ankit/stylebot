// Builds the Safari extension for release, archives the wrapper app and
// uploads it to App Store Connect, where it shows up in TestFlight once
// processed. Signs with the Apple account signed in to Xcode, or with an App
// Store Connect API key when APP_STORE_CONNECT_KEY_PATH, _KEY_ID and
// _ISSUER_ID are set.

import { mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  console.error('Safari builds need macOS with Xcode installed.');
  process.exit(1);
}

if (!process.env.STYLEBOT_GOOGLE_CLIENT_SECRET) {
  console.error(
    'Set STYLEBOT_GOOGLE_CLIENT_SECRET to the Desktop OAuth client secret; ' +
      'Drive sign-in needs it.'
  );
  process.exit(1);
}

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const projectPath = path.join(rootDir, 'safari/Stylebot/Stylebot.xcodeproj');
const exportOptionsPath = path.join(rootDir, 'safari/ExportOptions.plist');

const run = (command, args) => {
  const { status } = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (status !== 0) {
    process.exit(status ?? 1);
  }
};

/**
 * Where Xcode keeps archives, so this one shows up in the Organizer too.
 */
const getArchivePath = () => {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '.');

  return path.join(
    os.homedir(),
    'Library/Developer/Xcode/Archives',
    day,
    `Stylebot ${day} ${time}.xcarchive`
  );
};

const getAuthenticationArgs = () => {
  const {
    APP_STORE_CONNECT_KEY_PATH: keyPath,
    APP_STORE_CONNECT_KEY_ID: keyId,
    APP_STORE_CONNECT_ISSUER_ID: issuerId,
  } = process.env;

  if (!keyPath) {
    return [];
  }

  return [
    '-authenticationKeyPath',
    keyPath,
    '-authenticationKeyID',
    keyId,
    '-authenticationKeyIssuerID',
    issuerId,
  ];
};

const archivePath = getArchivePath();
const exportPath = mkdtempSync(path.join(os.tmpdir(), 'stylebot-safari-'));

run('yarn', ['build:safari']);

run('xcodebuild', [
  '-project',
  projectPath,
  '-scheme',
  'Stylebot',
  '-configuration',
  'Release',
  '-destination',
  'generic/platform=macOS',
  '-archivePath',
  archivePath,
  '-allowProvisioningUpdates',
  ...getAuthenticationArgs(),
  '-quiet',
  'archive',
]);

run('xcodebuild', [
  '-exportArchive',
  '-archivePath',
  archivePath,
  '-exportOptionsPlist',
  exportOptionsPath,
  '-exportPath',
  exportPath,
  '-allowProvisioningUpdates',
  ...getAuthenticationArgs(),
]);

rmSync(exportPath, { recursive: true, force: true });

console.log(`
Uploaded to App Store Connect. It appears under TestFlight once Apple has
processed it, usually within 30 minutes. The archive is in Xcode's Organizer.
`);
