// Parses Stylebot's `src/_locales/*.config` authoring format into the Chrome
// extension `_locales/<locale>/messages.json` shape. Shared by the webpack
// build (which needs `messages`) and scripts/validate-locales.mjs (which also
// needs `duplicateKeys`, since a repeated `@key` silently overwrites the
// earlier entry below).
function parseLocaleConfig(raw) {
  const content = raw.replace(/^#.*?$/gm, '');
  const messages = {};
  const seenCounts = {};
  const regex = /@([a-z0-9_]+)/gi;

  let match;

  while ((match = regex.exec(content))) {
    const messageName = match[1];
    const messageStart = match.index + match[0].length;

    let messageEnd = content.indexOf('@', messageStart);

    if (messageEnd < 0) {
      messageEnd = content.length;
    }

    const message = content.substring(messageStart, messageEnd).trim();

    seenCounts[messageName] = (seenCounts[messageName] || 0) + 1;

    messages[messageName] = {
      message,
    };

    const placeholderMatches = [...message.matchAll(/\$([^$]+)\$/g)];

    if (placeholderMatches.length > 0) {
      messages[messageName].placeholders = {};

      placeholderMatches.forEach(m => {
        messages[messageName].placeholders[m[1]] = {
          content: '$1',
        };
      });
    }
  }

  const duplicateKeys = Object.keys(seenCounts).filter(
    key => seenCounts[key] > 1
  );

  return { messages, duplicateKeys };
}

module.exports = { parseLocaleConfig };
