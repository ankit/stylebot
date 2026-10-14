const fs = require('fs');
const path = require('path');

const MANIFEST_DIR = path.resolve(__dirname, '../../src/assets/manifest');

const readManifest = name =>
  JSON.parse(fs.readFileSync(path.join(MANIFEST_DIR, name)));

const without = (list, ...removed) =>
  list.filter(item => !removed.includes(item));

/**
 * Firefox runs the background as an event page under its own add-on id, and
 * has no per-tab side panel or favicon cache, so it warns on those permissions.
 */
const buildFirefoxManifest = manifest => ({
  ...manifest,
  ...readManifest('manifest-firefox.json'),
  permissions: without(manifest.permissions, 'sidePanel', 'favicon'),
});

/**
 * Drive sign-in in a tab: a redirect rule reroutes Google's loopback redirect
 * to an extension page, which has to be web accessible for it.
 */
const addTabSignIn = manifest => ({
  ...manifest,
  permissions: [...manifest.permissions, 'declarativeNetRequestWithHostAccess'],
  web_accessible_resources: [
    ...manifest.web_accessible_resources,
    {
      resources: ['google-sign-in/index.html'],
      matches: ['https://accounts.google.com/*', 'http://127.0.0.1/*'],
    },
  ],
});

/**
 * Safari blurs toolbar icons below 19pt and has no identity API. It doesn't
 * get access to every site, so it lists the hosts sign-in uses.
 */
const buildSafariManifest = manifest =>
  addTabSignIn({
    ...manifest,
    action: {
      ...manifest.action,
      default_icon: {
        ...manifest.action.default_icon,
        19: 'img/icon19.png',
        38: 'img/icon38.png',
      },
    },
    permissions: without(
      manifest.permissions,
      'sidePanel',
      'identity',
      'favicon'
    ),
    host_permissions: [
      ...manifest.host_permissions,
      'https://oauth2.googleapis.com/*',
      'http://127.0.0.1/*',
    ],
  });

// Chrome and Edge share one build, which runs with no BROWSER set.
const CHROME = 'chrome';

// The browsers the CLI ships in. Firefox and Safari don't get it yet.
const CLI_BROWSERS = [CHROME];

/**
 * Whether the build for a browser (a BROWSER value, undefined for Chrome and
 * Edge) carries the CLI.
 */
const supportsCLI = browser => CLI_BROWSERS.includes(browser ?? CHROME);

/**
 * Adds the CLI's native host permission, requested only when it's turned on,
 * and its page inspector.
 */
const addCli = manifest => ({
  ...manifest,
  optional_permissions: ['nativeMessaging'],
  web_accessible_resources: [
    ...manifest.web_accessible_resources,
    { resources: ['cli-inspector/index.js'], matches: ['<all_urls>'] },
  ],
});

/**
 * Adds scripting and host access to every site, to run scripts in open tabs.
 * The content scripts already match every site, so neither adds an install
 * warning.
 */
const addScripting = manifest => ({
  ...manifest,
  permissions: [...manifest.permissions, 'scripting'],
  host_permissions: [...manifest.host_permissions, '<all_urls>'],
});

/**
 * Adds the Chrome Web Store public key, or Edge Add-ons' for `store: 'edge'`,
 * for the store id that Drive sign-in's OAuth redirect needs. Release builds
 * leave it out: the stores reject an uploaded manifest with a `key`.
 */
const buildChromeManifest = (manifest, { nodeEnv, preview, store }) => {
  const scripting = addTabSignIn(addScripting(manifest));

  if (nodeEnv === 'development' || preview) {
    const keyFile =
      store === 'edge' ? 'manifest-edge-dev.json' : 'manifest-dev.json';
    return { ...scripting, ...readManifest(keyFile) };
  }

  return scripting;
};

const SITE_BRIDGE_SCRIPT = 'site-bridge/index.js';

// Where `yarn dev` in the stylebot-site repo serves stylebot.dev, on whichever
// port is free.
const SITE_DEV_SERVER = 'http://localhost/*';

/**
 * Lets the site's dev server use the stylebot.dev bridge in development
 * builds, to try gallery installs locally.
 */
const addSiteDevServer = manifest => ({
  ...manifest,
  content_scripts: manifest.content_scripts.map(script =>
    script.js.includes(SITE_BRIDGE_SCRIPT)
      ? { ...script, matches: [...script.matches, SITE_DEV_SERVER] }
      : script
  ),
});

/**
 * Builds the extension manifest for a browser (undefined for Chrome and Edge,
 * which share one build) from the base manifest.
 */
const buildManifest = (base, { browser, nodeEnv, preview, store }) => {
  let manifest;

  if (browser === 'firefox') {
    manifest = buildFirefoxManifest(base);
  } else if (browser === 'safari') {
    manifest = buildSafariManifest(base);
  } else {
    manifest = buildChromeManifest(base, { nodeEnv, preview, store });
  }

  if (nodeEnv === 'development') {
    manifest = addSiteDevServer(manifest);
  }

  return supportsCLI(browser) ? addCli(manifest) : manifest;
};

module.exports = { buildManifest, supportsCLI };
