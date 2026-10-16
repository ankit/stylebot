const base = require('./manifest.json');

module.exports = {
  ...base,

  // Runs the background as an event page, under its own add-on id.
  background: { scripts: ['background/index.js'], type: 'module' },

  browser_specific_settings: {
    gecko: {
      id: '{52bda3fd-dc48-4b3d-a7b9-58af57879f1e}',
      strict_min_version: '137.0',
    },
  },

  permissions: [...base.permissions, 'identity'],
};
