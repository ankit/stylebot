const fs = require('fs');
const path = require('path');

const MANIFEST_DIR = path.resolve(__dirname, '../../src/assets/manifest');

const readManifest = name =>
  JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, name)));

const without = (list, ...removed) =>
  list.filter(item => !removed.includes(item));

/**
 * Firefox runs the background as an event page under its own add-on id, and
 * has no per-tab side panel, so it warns on the unknown permission.
 */
const buildFirefoxManifest = manifest => ({
  ...manifest,
  ...readManifest('manifest-firefox.json'),
  permissions: without(manifest.permissions, 'sidePanel'),
});

/**
 * Safari blurs toolbar icons below 19pt and has no identity API, so Drive
 * sign-in runs in a tab: Google's loopback redirect is rerouted to an
 * extension page, and tokens refresh by fetch.
 */
const buildSafariManifest = manifest => ({
  ...manifest,
  action: {
    ...manifest.action,
    default_icon: {
      ...manifest.action.default_icon,
      19: 'img/icon19.png',
      38: 'img/icon38.png',
    },
  },
  permissions: [
    ...without(manifest.permissions, 'sidePanel', 'identity'),
    'declarativeNetRequestWithHostAccess',
  ],
  host_permissions: [
    ...manifest.host_permissions,
    'https://oauth2.googleapis.com/*',
    'http://127.0.0.1/*',
  ],
  web_accessible_resources: [
    ...manifest.web_accessible_resources,
    {
      resources: ['google-sign-in/index.html'],
      matches: ['https://accounts.google.com/*', 'http://127.0.0.1/*'],
    },
  ],
});

/**
 * Adds the Chrome Web Store public key, for the store id that Drive sign-in's
 * OAuth redirect needs. Release builds leave it out: the store rejects an
 * uploaded manifest with a `key`.
 */
const buildChromeManifest = (manifest, { nodeEnv, preview }) => {
  /*
   * The CLI's native host, and screenshots for it; dev builds only until it ships opt-in.
   * <all_urls> also lifts CORS on the background's fetches, which release builds keep.
   */
  if (nodeEnv === 'development') {
    return {
      ...manifest,
      ...readManifest('manifest-dev.json'),
      permissions: [...manifest.permissions, 'nativeMessaging'],
      host_permissions: [...manifest.host_permissions, '<all_urls>'],
    };
  }

  if (preview) {
    return { ...manifest, ...readManifest('manifest-dev.json') };
  }

  return manifest;
};

/**
 * Builds the extension manifest for a browser (undefined for Chrome and Edge,
 * which share one build) from the base manifest.
 */
const buildManifest = (base, { browser, nodeEnv, preview }) => {
  if (browser === 'firefox') {
    return buildFirefoxManifest(base);
  }

  if (browser === 'safari') {
    return buildSafariManifest(base);
  }

  return buildChromeManifest(base, { nodeEnv, preview });
};

module.exports = { buildManifest };
