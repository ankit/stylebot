const { linkify } = require('./style.mjs');

describe('linkify', () => {
  it('links each stylebot.dev address, keeping the text', () => {
    expect(
      linkify('Add it from stylebot.dev, then see stylebot.dev/cli.')
    ).toBe(
      'Add it from \x1b]8;;https://stylebot.dev\x1b\\stylebot.dev\x1b]8;;\x1b\\, then see \x1b]8;;https://stylebot.dev/cli\x1b\\stylebot.dev/cli\x1b]8;;\x1b\\.'
    );
  });

  it('leaves text without an address alone', () => {
    expect(linkify('Open Chrome (or Edge) with Stylebot.')).toBe(
      'Open Chrome (or Edge) with Stylebot.'
    );
  });
});
