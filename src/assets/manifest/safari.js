const base = require('./manifest.json');
const { signInPage } = require('./shared');

module.exports = {
  ...base,

  action: {
    ...base.action,
    default_icon: {
      ...base.action.default_icon,
      19: 'img/icon19.png',
      38: 'img/icon38.png',
    },
  },

  permissions: [...base.permissions, 'declarativeNetRequestWithHostAccess'],

  // Without access to every site, it lists the hosts sign-in uses.
  host_permissions: [
    ...base.host_permissions,
    'https://oauth2.googleapis.com/*',
    'http://127.0.0.1/*',
  ],

  web_accessible_resources: [...base.web_accessible_resources, signInPage],
};
