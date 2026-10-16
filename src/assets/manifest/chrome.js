const base = require('./manifest.json');
const { signInPage } = require('./shared');

// Chrome and Edge share this manifest.
module.exports = {
  ...base,

  side_panel: { default_path: 'side-panel-default/index.html' },

  permissions: [
    ...base.permissions,
    'identity',
    'favicon',
    'scripting',
    'declarativeNetRequestWithHostAccess',
  ],

  optional_permissions: ['sidePanel', 'nativeMessaging'],

  host_permissions: [...base.host_permissions, '<all_urls>'],

  web_accessible_resources: [
    ...base.web_accessible_resources,
    signInPage,
    { resources: ['cli-inspector/index.js'], matches: ['<all_urls>'] },
  ],
};
