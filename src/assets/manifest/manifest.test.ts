import fs from 'fs';
import path from 'path';

import { buildManifest } from '../../../scripts/lib/build-manifest';

const base = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8')
);

const GOOGLE_HOSTS = [
  'https://drive.google.com/*',
  'https://www.googleapis.com/*',
  'https://fonts.googleapis.com/*',
];

// The stylebot.dev bridge is covered by <all_urls>, so it adds no warning.
const CONTENT_SCRIPT_MATCHES = [
  ['<all_urls>'],
  ['<all_urls>'],
  ['https://stylebot.dev/*'],
];

const RELEASE_INSTALL_WARNING_FIELDS = {
  chrome: {
    permissions: [
      'tabs',
      'storage',
      'identity',
      'contextMenus',
      'unlimitedStorage',
      'alarms',
      'idle',
      'sidePanel',
      // Covered by the warning tabs already shows, so it adds none.
      'favicon',
    ],
    host_permissions: GOOGLE_HOSTS,
    content_script_matches: CONTENT_SCRIPT_MATCHES,
  },
  firefox: {
    permissions: [
      'tabs',
      'storage',
      'identity',
      'contextMenus',
      'unlimitedStorage',
      'alarms',
      'idle',
    ],
    host_permissions: GOOGLE_HOSTS,
    content_script_matches: CONTENT_SCRIPT_MATCHES,
  },
  safari: {
    permissions: [
      'tabs',
      'storage',
      'contextMenus',
      'unlimitedStorage',
      'alarms',
      'idle',
      'declarativeNetRequestWithHostAccess',
    ],
    host_permissions: [
      ...GOOGLE_HOSTS,
      'https://oauth2.googleapis.com/*',
      'http://127.0.0.1/*',
    ],
    content_script_matches: CONTENT_SCRIPT_MATCHES,
  },
};

const GUARD_MESSAGE = `A release manifest's required permissions, hosts or content script matches changed.
Adding one shows a new install warning, and Chrome disables Stylebot for every existing user until they re-approve it.
Declare it in optional_permissions / optional_host_permissions and request it at runtime instead.
Only update the expectation in this test deliberately, knowing what it does to existing users.`;

/**
 * Sorts each list, since reordering permissions or hosts never shows a warning.
 */
const normalize = (fields: Record<string, Array<unknown>>) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(fields).map(([name, list]) => [
        name,
        list.map(item => JSON.stringify(item)).sort(),
      ])
    )
  );

const releaseManifest = (browser: 'chrome' | 'firefox' | 'safari') =>
  buildManifest(base, {
    browser: browser === 'chrome' ? undefined : browser,
    nodeEnv: 'production',
    preview: false,
  });

describe('release manifest', () => {
  it.each(['chrome', 'firefox', 'safari'] as const)(
    'keeps the fields that drive install warnings unchanged for %s',
    browser => {
      const manifest = releaseManifest(browser);
      const actual = {
        permissions: manifest.permissions,
        host_permissions: manifest.host_permissions,
        content_script_matches: manifest.content_scripts.map(
          script => script.matches
        ),
      };

      if (
        normalize(actual) !== normalize(RELEASE_INSTALL_WARNING_FIELDS[browser])
      ) {
        throw new Error(
          `${GUARD_MESSAGE}\n\nExpected: ${JSON.stringify(
            RELEASE_INSTALL_WARNING_FIELDS[browser],
            null,
            2
          )}\nReceived: ${JSON.stringify(actual, null, 2)}`
        );
      }
    }
  );

  it.each(['chrome', 'firefox', 'safari'] as const)(
    'has no key for %s, which the store rejects',
    browser => {
      expect(releaseManifest(browser)).not.toHaveProperty('key');
    }
  );
});

describe('CLI permissions', () => {
  it.each([
    ['release', 'production', false],
    ['preview', 'production', true],
    ['development', 'development', false],
  ])('are only optional in the %s Chrome manifest', (_, nodeEnv, preview) => {
    const manifest = buildManifest(base, {
      browser: undefined,
      nodeEnv,
      preview,
    });

    expect(manifest.permissions).toEqual(base.permissions);
    expect(manifest.host_permissions).toEqual(base.host_permissions);
    expect(manifest.optional_permissions).toEqual([
      'nativeMessaging',
      'scripting',
    ]);
    expect(manifest.optional_host_permissions).toEqual(['<all_urls>']);
  });

  it.each(['firefox', 'safari'] as const)(
    'are left out of the %s manifest',
    browser => {
      const manifest = releaseManifest(browser);

      expect(manifest).not.toHaveProperty('optional_permissions');
      expect(manifest).not.toHaveProperty('optional_host_permissions');
    }
  );
});
