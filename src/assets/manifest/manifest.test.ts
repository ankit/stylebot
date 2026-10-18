import crypto from 'crypto';

import { buildManifest } from '../../../scripts/lib/build-manifest';

const GOOGLE_HOSTS = [
  'https://drive.google.com/*',
  'https://www.googleapis.com/*',
  'https://fonts.googleapis.com/*',
];

// The stylebot.dev bridge is covered by <all_urls>, so it adds no warning.
const CONTENT_SCRIPT_MATCHES = [
  ['<all_urls>'],
  ['<all_urls>'],
  ['https://stylebot.dev/*', 'https://gallery.stylebot.dev/*'],
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
      // Covered by the warning tabs already shows, so it adds none.
      'favicon',
      // No warning of its own, and <all_urls> below adds none either, since
      // the content scripts already match every site (checked against 3.2.4
      // with getPermissionWarningsByManifest on Chrome and Edge).
      'scripting',
      // No warning either, checked the same way: its redirect only applies
      // to hosts <all_urls> already covers.
      'declarativeNetRequestWithHostAccess',
    ],
    host_permissions: [...GOOGLE_HOSTS, '<all_urls>'],
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
  buildManifest({
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

describe('optional permissions', () => {
  it.each([
    ['release', 'production', false],
    ['preview', 'production', true],
    ['development', 'development', false],
  ])(
    'make the side panel optional in the %s Chrome manifest',
    (_, nodeEnv, preview) => {
      const manifest = buildManifest({
        browser: undefined,
        nodeEnv,
        preview,
      });

      expect(manifest.permissions).not.toContain('sidePanel');
      expect(manifest.optional_permissions).toContain('sidePanel');
      expect(manifest).toHaveProperty('side_panel');
    }
  );
});

describe('CLI permissions', () => {
  it.each([
    ['release', 'production', false],
    ['preview', 'production', true],
    ['development', 'development', false],
  ])('are only optional in the %s Chrome manifest', (_, nodeEnv, preview) => {
    const manifest = buildManifest({
      browser: undefined,
      nodeEnv,
      preview,
    });

    expect(manifest.permissions).not.toContain('nativeMessaging');
    expect(manifest.optional_permissions).toContain('nativeMessaging');
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

/**
 * Derives an extension id from its public key, as Chromium does.
 */
const extensionId = (key: string) =>
  [
    ...crypto
      .createHash('sha256')
      .update(Buffer.from(key, 'base64'))
      .digest('hex')
      .slice(0, 32),
  ]
    .map(c => String.fromCharCode(97 + parseInt(c, 16)))
    .join('');

describe('store key', () => {
  it.each([
    ['Chrome', undefined, 'oiaejidbmkiecgbjeifoejpgmdaleoha'],
    ['Edge', 'edge', 'mjolbpfednnbebfapicajpifliopnnai'],
  ])('gives the %s preview build its store id', (_, store, id) => {
    const manifest = buildManifest({
      nodeEnv: 'production',
      preview: true,
      store,
    });

    expect(extensionId(manifest.key as string)).toBe(id);
  });
});
